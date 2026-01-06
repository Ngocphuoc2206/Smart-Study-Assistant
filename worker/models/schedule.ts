import { Schema, model, Document, Types } from "mongoose";

export type ScheduleType = "lecture" | "exam" | "assignment" | "other";

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
const schedueSchema = new Schema<ISchedule>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User is required"],
    },
    course: {
      type: Schema.Types.ObjectId,
      ref: "Course",
      required: false,
    },
    courseName: {
      type: String,
      trim: true,
      required: false,
    },
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      maxlength: [100, "Title cannot be more than 100 characters"],
    },
    type: {
      type: String,
      enum: ["lecture", "exam", "assignment", "other"],
      default: "assignment",
    },
    startTime: {
      type: Date,
      required: [true, "Start time is required"],
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
    },
  },
  {
    timestamps: true,
  }
);

schedueSchema.index({ user: 1, title: 1, startTime: 1 }, { unique: true });

schedueSchema.pre('save', async function(next) {
    const schedule = this as ISchedule;

    // Chỉ kiểm tra nếu startTime hoặc endTime bị thay đổi
    if (!schedule.isModified('startTime') && !schedule.isModified('endTime')) {
        return next();
    }

    // Xử lý trường hợp không có endTime (mặc định cho là 1 tiếng nếu không có)
    // Bạn nên bắt buộc có endTime để logic này chính xác nhất
    const checkEndTime = schedule.endTime || new Date(schedule.startTime.getTime() + 60 * 60 * 1000);

    const existingSchedule = await model('Schedule').findOne({
        user: schedule.user, // Chỉ check trùng của chính user đó
        _id: { $ne: schedule._id }, // Loại trừ chính nó (trường hợp đang update)
        $or: [
            // Logic trùng lặp:
            // (StartMới < EndCũ) VÀ (EndMới > StartCũ)
            {
                startTime: { $lt: checkEndTime },
                endTime: { $gt: schedule.startTime }
            }
        ]
    });

    if (existingSchedule) {
        const err = new Error('Thời gian này đã bị trùng với một lịch trình khác!');
        return next(err);
    }

    next();
}); 

export const Schedule = model<ISchedule>('Schedule', schedueSchema);
