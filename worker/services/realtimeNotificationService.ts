import { Notification } from "../models/notification";
import { getIO } from "../realtime/socket";

export async function emitNotification(notificationId: string) {
    const notif = await Notification.findById(notificationId);
    if (!notif) return;

    const io = getIO();
    io.to(notif.user.toString()).emit("notification:new", notif);
}