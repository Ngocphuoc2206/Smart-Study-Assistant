/* eslint-disable @typescript-eslint/no-explicit-any */
import { Response } from "express";
import { AuthRequest } from "../middlewares/authMiddleware";
import { Notification } from "../models/notification";
import { logDebug } from "../utils/logger";
import { Reminder } from "../models/reminder";

const normalizeStatus = (s: string) => {
    const v = s.toLowerCase();
    if (v === "pending" || v === "done" || v === "overdue") return v;
    return "";
}

//Get
export const getNotifications = async (req: AuthRequest, res: Response) => {
    try{
        const userId = req.user?.userId;
        if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

        const status = normalizeStatus(req.query.status as string);
        const now = new Date();
        const query: any = {user: userId};

        if (status === "pending") query.fireAt = {$gt: now};
        if (status === "done") query.fireAt = {$lte: now};
        const data = await Notification.find(query).sort({ fireAt: 1 }).limit(100);
        return res.status(200).json({ success: true, data });
    } catch(e) {
        return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
}

//Patch /api/notifications/:id/read
export const markNotificationAsRead = async (req: AuthRequest, res: Response) => {
    try{
        const userId = req.user?.userId
        if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });
        const { id } = req.params;
        const updated = await Notification.findOneAndUpdate(
            { _id: id, user: userId },
            { read: true },
            { new: true }
        );
        if (!updated) return res.status(404).json({ success: false, message: "Notification not found" });
        return res.status(200).json({ success: true, data: updated });
    } catch(e) {
        logDebug("[Notification] markRead error", e);
        return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
}

// PATCH /api/notifications/:id/snooze
export const snoozeNotification = async (req: AuthRequest, res: Response) => {
    try{
        const userId = req.user?.userId
        if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });
        const { id } = req.params;
        const { duration } = (req.body?.duration || "").toLowerCase();
        const incMs =
        duration === "1h" ? 60 * 60 * 1000 :
        duration === "1day" ? 24 * 60 * 60 * 1000 :
        null;
        if (!incMs) return res.status(400).json({ success: false, message: "Invalid duration" });
        const notif = await Notification.findOne({ _id: id, user: userId })
        if (!notif) return res.status(404).json({ success: false, message: "Notification not found" });
        //Update reminder
        const reminderId = notif.reminder;
        const updatedReminder = await Reminder.findOneAndUpdate({_id: reminderId, user: userId});
        if (!updatedReminder) return res.status(404).json({ success: false, message: "Reminder not found" });
        updatedReminder.remindAt = new Date(updatedReminder.remindAt.getTime() + incMs);
        updatedReminder.isSent = false;
        updatedReminder.status = "PENDING";
        updatedReminder.sentAt = undefined;
        await updatedReminder.save();
        // Delete current notification so cron can create a new one (unique reminder index)
        await Notification.deleteOne({ _id: notif._id, user: userId });
        return res.status(200).json({
            success: true,
            message: `Snoozed ${duration} successfully`,
            data: {
              reminderId: String(updatedReminder._id),
              newRemindAt: updatedReminder.remindAt,
            },
        });
    } catch(e) {
        logDebug("[Notification] snooze error", e);
        return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
}
