/* eslint-disable @typescript-eslint/no-explicit-any */
import { Reminder } from "../models/reminder";
import { logDebug } from "../utils/logger";
import { Notification } from "../models/notification";

export async function generateNotificationFromRemiders() {
    logDebug("Generate notification from reminders...");
    const now = new Date();

    // Get reminder dueDate
    const dueReminders = await Reminder.find({
        remindAt: {$lte: now},
        isSent: false,
        status: "PENDING"
    }).limit(200);

    if (dueReminders.length === 0) return;
    //Create Notifications (insertMany ordered: false avoid duplicate)
    const notifiDocs = dueReminders.map(r => ({
        user: r.user,
        reminder: r._id,
        task: r.task,
        schedule: r.schedule,
        title: r.title,
        fireAt: r.remindAt,
        channel: r.channel,
        type: r.remindType,
        isRead: false
    }))

    try{
        await Notification.insertMany(notifiDocs, {ordered: false});
    }catch(e: any) {
        if (e?.code !== 11000) throw e;
    }

    await Reminder.updateMany(
        { _id: {$in: dueReminders.map(r => r._id)}},
        {$set: {isSent: true, sentAt: now, status: "DONE"}},
    );

    logDebug("[Cron] Generated notifications", {count: dueReminders.length})
}
