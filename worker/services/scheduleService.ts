/* eslint-disable @typescript-eslint/no-explicit-any */
import { success } from "zod";
import { VNEntities } from "../../shared/type";
import { AuthRequest } from "../middlewares/authMiddleware";
import { Schedule } from "../models/schedule";
import * as ReminderService from "../services/reminderService";

export class ScheduleService {
  static async createFromNLP(entities: VNEntities) {
    if (!entities.userId) {
      return {
        success: false,
        code: "MISSING_USER",
        message: "Missing userId",
      };
    }

    try {
      const schedule = await Schedule.create({
        title: entities.title,
        type: entities.type || "lecture",
        courseName: entities.courseName,
        startTime: new Date(`${entities.date}T${entities.timeStart}`),
        endTime: entities.timeEnd
          ? new Date(`${entities.date}T${entities.timeEnd}`)
          : undefined,
        location: entities.location,
        notes: "Tạo tự động từ chatbot",
        reminders: entities.reminder,
        user: entities.userId,
      });

      if (
        schedule &&
        Array.isArray(entities.reminder) &&
        entities.reminder.length > 0 &&
        entities.remindChannel
      ) {
        const startTime = new Date(
          `${entities.date}T${entities.timeStart}:00+07:00`
        );

        if (isNaN(startTime.getTime())) {
          return {
            success: false,
            code: "MISSING_INFO",
            message: "INVALID_DATETIME",
          };
        }

        const now = new Date();
        if (startTime.getTime() < now.getTime()) {
          return {
            success: false,
            code: "PAST_TIME",
            message:
              "Thời gian bạn nhập đã ở quá khứ. Bạn nhập lại giúp mình nhé.",
          };
        }
        const channel = entities.remindChannel;

        const reminderInput = entities.reminder.map((r) => ({
          offsetSec: r,
          channel,
        }));

        const reminderDocs = ReminderService.buildForSchedule({
          userId: entities.userId.toString(),
          scheduleId: schedule._id.toString(),
          title: schedule.title,
          startTime: schedule.startTime,
          reminders: reminderInput,
        });

        await ReminderService.createMany(reminderDocs as any[]);
      }

      return {
        success: true,
        created: schedule,
        preview: {
          title: schedule.title,
          startTime: schedule.startTime,
          location: schedule.location,
        },
        message: "Đã tạo lịch thành công.",
      };
    } catch (error: any) {
      if (error?.code === 11000) {
        return {
          success: false,
          code: "DUPLICATE_SCHEDULE",
          message: "Lịch này đã tồn tại (bị trùng).",
        };
      }

      return {
        success: false,
        code: "SCHEDULE_CREATE_FAILED",
        message: "Tạo lịch thất bại. Vui lòng thử lại.",
      };
    }
  }
}
