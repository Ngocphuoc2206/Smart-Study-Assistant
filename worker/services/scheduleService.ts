/* eslint-disable @typescript-eslint/no-explicit-any */
import { success } from "zod";
import { VNEntities } from "../../shared/type";
import { AuthRequest } from "../middlewares/authMiddleware";
import { Schedule } from "../models/schedule";
import * as ReminderService from "../services/reminderService";

export class ScheduleService {
  static async createFromNLP(entities: VNEntities) {
    if (!entities.userId) {
      return { success: false, message: "Missing userId in NLP entities" };
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
      //Create reminder docs
      if (schedule) {
        const channel = entities.remindChannel || "In-app";
        const reminder = entities.reminder;
        if (!Array.isArray(reminder)) return;
        const reminderInput = reminder.map((r) => ({
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
      };
    } catch (error) {
      return {
        success: false,
        message: `Tạo lịch thất bại, ${error}`,
      };
    }
  }
}
