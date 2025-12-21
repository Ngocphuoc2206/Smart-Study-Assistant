/* eslint-disable @typescript-eslint/no-explicit-any */
import { Response } from "express";
import { AuthRequest } from "../middlewares/authMiddleware";
import { Notification } from "../models/notification";
import { logDebug } from "../../shared/logger";
import { Reminder } from "../models/reminder";

const toChannel = (ch: string) => (ch === "Email" ? "email" : "inapp");

const parseDurationMs = (d: string) => {
  const v = (d || "").toLowerCase();
  if (v === "hour" || v === "1h") return 60 * 60 * 1000;
  if (v === "day" || v === "1day") return 24 * 60 * 60 * 1000;
  return null;
};

const mapReminderToItem = (r: any) => ({
  id: String(r._id),
  eventId: String(r.task || r.schedule || r._id),
  eventTitle: r.title,
  channel: toChannel(r.channel),
  reminderTime: new Date(r.remindAt).toISOString(),
  read: false,
});

const mapNotifToItem = (n: any) => ({
  id: String(n._id),
  eventId: String(n.task || n.schedule || n.reminder || n._id),
  eventTitle: n.title,
  channel: toChannel(n.channel),
  reminderTime: new Date(n.fireAt).toISOString(),
  read: !!n.isRead,
});

// GET /api/notifications
export const getNotifications = async (req: AuthRequest, res: Response) => {
  try {
    const userId =
      (req.user as any)?.userId ||
      (req.user as any)?._id ||
      (req.user as any)?.user;
    if (!userId)
      return res.status(401).json({ success: false, message: "Unauthorized" });

    const now = new Date();
    //upComming
    const upcomingReminders = await Reminder.find({
      user: userId,
      status: "PENDING",
      remindAt: { $gt: now },
    })
      .sort({ remindAt: 1 })
      .limit(100)
      .lean();

    // sent
    const sentNotifications = await Notification.find({
      user: userId,
      fireAt: { $lte: now },
    })
      .sort({ fireAt: -1 })
      .limit(100)
      .lean();

    return res.status(200).json({
      success: true,
      data: {
        upcoming: upcomingReminders.map(mapReminderToItem),
        sent: sentNotifications.map(mapNotifToItem),
      },
    });
  } catch (e) {
    logDebug("[Notification] getNotifications error", e);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};

//Patch /api/notifications/:id/read
export const markNotificationAsRead = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const userId = req.user?.userId;
    if (!userId)
      return res.status(401).json({ success: false, message: "Unauthorized" });
    const { id } = req.params;
    const updated = await Notification.findOneAndUpdate(
      { _id: id, user: userId },
      { isRead: true },
      { new: true }
    );
    if (updated) return res.status(200).json({ success: true, data: updated });
    const updatedReminder = await Reminder.findOneAndUpdate(
      { _id: id, user: userId },
      { status: "DONE", isSent: true, sentAt: new Date() },
      { new: true }
    );
    if (updatedReminder) {
      return res.status(200).json({ success: true, data: updatedReminder });
    }

    return res.status(404).json({ success: false, message: "Not found" });
  } catch (e) {
    logDebug("[Notification] markRead error", e);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};

// PATCH /api/notifications/:id/snooze
export const snoozeNotification = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId || null;
    if (!userId)
      return res.status(401).json({ success: false, message: "Unauthorized" });

    const { id } = req.params;
    const incMs = parseDurationMs(String(req.body?.duration || ""));
    if (!incMs)
      return res
        .status(400)
        .json({ success: false, message: "Invalid duration" });
    //Check reminder and change it
    const reminder = await Reminder.findOne({ _id: id, user: userId });
    if (reminder) {
      reminder.remindAt = new Date(reminder.remindAt.getTime() + incMs);
      reminder.isSent = false;
      reminder.status = "PENDING";
      reminder.sentAt = undefined;
      await reminder.save();
      // Delete old notification
      await Notification.deleteOne({ reminder: reminder._id, user: userId });

      return res.status(200).json({
        success: true,
        message: "Snoozed successfully",
        data: {
          reminderId: String(reminder._id),
          newRemindAt: reminder.remindAt,
        },
      });
    }

    const notif = await Notification.findOne({ _id: id, user: userId });
    if (!notif)
      return res
        .status(404)
        .json({ success: false, message: "Notification not found" });

    const r = await Reminder.findOne({ _id: notif.reminder, user: userId });
    if (!r)
      return res
        .status(404)
        .json({ success: false, message: "Reminder not found" });

    r.remindAt = new Date(r.remindAt.getTime() + incMs);
    r.isSent = false;
    r.status = "PENDING";
    r.sentAt = undefined;
    await r.save();

    await Notification.deleteOne({ _id: notif._id, user: userId });

    return res.status(200).json({
      success: true,
      message: "Snoozed successfully",
      data: { reminderId: String(r._id), newRemindAt: r.remindAt },
    });
  } catch (e) {
    logDebug("[Notification] snooze error", e);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};
