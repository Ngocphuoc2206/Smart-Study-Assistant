import { NotificationChannel, NotificationType } from "@/shared/type";
import { Schema, model, Document } from "mongoose";

export interface INotification extends Document {
    user: Schema.Types.ObjectId;
    reminder: Schema.Types.ObjectId;
    task?: Schema.Types.ObjectId;
    schedule?: Schema.Types.ObjectId;
    title: string;
    fireAt: Date;
    channel: NotificationChannel;
    type: NotificationType;
    isRead: boolean;
    deliveryStatus: "PENDING" | "SENT" | "FAILED";
    deliveryAt?: Date;
    lastError?: string;
    createdAt: Date;
    updatedAt: Date;
}

const notificationSchema = new Schema<INotification>({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'User is required'],
    },
    reminder: {
        type: Schema.Types.ObjectId,
        ref: 'Reminder',
        required: [true, 'Reminder is required'],
    },
    task: {
        type: Schema.Types.ObjectId,
        ref: 'Task',
        required: false
    },
    schedule: {
        type: Schema.Types.ObjectId,
        ref: 'Schedule',
        required: false
    },
    title: {
        type: String,
        required: [true, 'Title is required'],
    },
    fireAt: {
        type: Date,
        required: [true, 'Fire at is required'],
    },
    channel: {
        type: String,
        enum: ['Email', 'In-app'],
        required: [true, 'Channel is required'],
    },
    type: {
        type: String,
        enum: ['TASK', 'SCHEDULE'],
        required: [true, 'Type is required'],
    },
    isRead: {
        type: Boolean,
        default: false,
    },
    deliveryStatus: {
        type: String,
        enum: ['PENDING', 'DONE', 'OVERDUE'],
        default: 'PENDING',
    },
    deliveryAt: {
        type: Date,
        required: false,
    },
    lastError: {
        type: String,
        required: false,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    },
}, {
    timestamps: true,
});

//Validation 1 reminder -> 1 notification
notificationSchema.index({ reminder: 1 }, { unique: true });
notificationSchema.index({ user: 1, fireAt: 1 })
export const Notification = model<INotification>('Notification', notificationSchema);
