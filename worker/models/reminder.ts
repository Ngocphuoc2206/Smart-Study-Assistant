import { Schema, model, Document, Types } from 'mongoose';

export type remindType = "TASK" | "SCHEDULE";
export type channel = "Email" | "In-app";
export type status = "PENDING" | "DONE" | "OVERDUE";

export interface IReminder extends Document {
    user: Schema.Types.ObjectId;
    task?: Schema.Types.ObjectId;
    schedule?: Schema.Types.ObjectId;
    title: string;
    remindAt: Date;
    remindType: remindType;
    channel: channel;
    status: status;
    createdAt: Date;
    updatedAt: Date;
}

const reminderSchema = new Schema<IReminder>({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'User is required'],
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
        trim: true,
        maxlength: [100, 'Title cannot be more than 100 characters'],
    },
    remindAt: {
        type: Date,
        required: [true, 'Remind at is required'],
    },
    remindType: {
        type: String,
        enum: ['TASK', 'SCHEDULE'],
        required: [true, 'Remind type is required'],
    },
    channel: {
        type: String,
        enum: ['Email', 'In-app'],
        required: [true, 'Channel is required'],
    },
    status: {
        type: String,
        enum: ['PENDING', 'DONE', 'OVERDUE'],
        default: 'PENDING',
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
})

//Validation task or schedule
reminderSchema.pre("validate", function (next) {
    const hasTask = !!this.task;
    const hasSchedule = !!this.schedule;
    if (hasTask && hasSchedule) {
        return next(new Error("Cannot have both task and schedule"));
    }
    this.remindType = hasTask ? "TASK" : "SCHEDULE";
    next();
})

//Unique index: avoid duplicate remindAt
reminderSchema.index(
    { user: 1, task: 1, remindAt: 1, channel: 1 },
    { unique: true, partialFilterExpression: { task: { $exists: true, $type: "objectId" } } }
);

reminderSchema.index(
    { user: 1, scheduler: 1, remindAt: 1, channel: 1},
    { unique: true, partialFilterExpression: { schedule: { $exists: true, $type: "objectId" } } }
);

reminderSchema.index({ user: 1, status: 1, remindAt: 1 });
export const Reminder = model<IReminder>('Reminder', reminderSchema);
