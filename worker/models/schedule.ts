import { Schema, model, Document, Types } from 'mongoose';

export type ScheduleType = 'lecture' | 'exam' | 'assignment' | 'other';

export interface ISchedule extends Document {
    user: Types.ObjectId;
    course: Types.ObjectId;
    courseName?: string;
    title: string; // – example “Lý thuyết chương 1”
    type: ScheduleType;
    startTime: Date;
    endTime?: Date;
    location?: string;
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
}

// Create Schema
const schedueSchema = new Schema<ISchedule>({
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
        required: false
    },
    title: {
        type: String,
        required: [true, 'Title is required'],
        trim: true,
        maxlength: [100, 'Title cannot be more than 100 characters'],
    },
    type: {
        type: String,
        enum: ['lecture', 'exam', 'assignment','other'],
        default: 'assignment',
    },
    startTime: {
        type: Date,
        required: [true, 'Start time is required'],
    },
    endTime: {
        type: Date,
    },
    location: {
        type: String,
        trim: true,
    },
    notes: {
        type: String,
        trim: true,
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

export const Schedule = model<ISchedule>('Schedule', schedueSchema);
