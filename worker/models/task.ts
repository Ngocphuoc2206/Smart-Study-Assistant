import {Schema, model, Document} from "mongoose";

export type TaskStatus = "pending" | "in-progress" | "completed" | "overdue";
export type TaskPriority = 'low' | 'medium' | 'high';

export interface ITask extends Document{
    user: Schema.Types.ObjectId;
    course: Schema.Types.ObjectId;
    courseName?: string;
    title: string;
    description?: string;
    status: TaskStatus;
    priority: TaskPriority;
    type?: string;
    dueDate: Date;
    createdAt: Date;
    updatedAt: Date;
};

// Create Schema
const taskSchema = new Schema<ITask>({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'User is required'],
    },
    course: {
        type: Schema.Types.ObjectId,
        ref: 'Course',
        required: false
    },
    courseName: {
        type: String,
        trim: true,
        required: true
    },
    title: {
        type: String,
        required: [true, 'Title is required'],
        trim: true,
        maxlength: [100, 'Title cannot be more than 100 characters'],
    },
    description: {
        type: String,
        trim: true,
        maxlength: [1000, 'Description cannot be more than 1000 characters'],
    },
    status: {
        type: String,
        enum: ['pending', 'in-progress', 'completed', 'overdue'],
        default: 'pending',
    },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high'],
        default: 'low',
    },
    dueDate: {
        type: Date,
        required: [true, 'Due date is required'],
    },
    type: {
        type: String,
        trim: true,
        default: "assignment"
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    }
}, {
    timestamps: true,
});

export const Task = model<ITask>('Task', taskSchema);
