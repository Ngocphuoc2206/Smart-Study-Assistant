/* eslint-disable @typescript-eslint/no-explicit-any */
import nodemailer from "nodemailer";
import { Notification } from "../models/notification";
import { User } from "../models/user";
import { logDebug } from "../utils/logger";

//Config
const transporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST,
    port: Number(process.env.MAIL_PORT || 587),
    secure: false,
    auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
    }
});

export async function sendEmailForNotification(notificationId: string){
    logDebug("Start to Sending email for notification")
    const notif = await Notification.findById(notificationId);
    if (!notif) return;

    const user = await User.findById(notif.user).select("email firstName lastName").lean();
    if (!user?.email){
        await Notification.updateOne(
            { _id: notif._id},
            { $set: {deliveryStatus: "FAILED", lastError: "User email missing"} }
        )
    }

    const subject = `[Reminder] ${notif.title}`;
    const html = `
    <div>
        <p>Xin chào ${user?.firstName} ${user?.lastName}},</p>
        <p>Bạn có nhắc nhở: <b>${notif.title}</b></p>
        <p>Thời gian : ${new Date(notif.fireAt).toLocaleString()}</p>
    </div>
    `
    try{
        await transporter.sendMail({
            from: process.env.MAIL_FROM || process.env.MAIL_USER,
            to: user?.email,
            subject,
            html
        });
        await Notification.updateOne(
            { _id: notif._id},
            { $set: {deliveryStatus: "SENT", deliveryAt: new Date(), lastError: "" } }
        )
        logDebug("Email sent successfully");
    } catch(e: any){
        logDebug("Error sending email", e);
        await Notification.updateOne(
            { _id: notif._id},
            { $set: {deliveryStatus: "FAILED", lastError: String(e.message) || e } }
        )
    }
}
