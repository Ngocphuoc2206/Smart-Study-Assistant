/* eslint-disable @typescript-eslint/no-explicit-any */
import { ActionResult, VNEntities } from "../../shared/type";
import { Task } from "../models/task";
import * as ReminderService from "../services/reminderService";

export class TaskService {
  static async createFromNLP(entities: VNEntities): Promise<ActionResult> {
    try {
      if (!entities.userId) {
        return {
          success: false,
          code: "MISSING_INFO",
          message: "Thiếu userId.",
        };
      }

      if (!entities.title || !entities.date) {
        return {
          success: false,
          code: "MISSING_INFO",
          message: "Thiếu thông tin để tạo task (title/date).",
        };
      }
      const time = entities.timeStart || "08:00";
      const dueDate = new Date(`${entities.date}T${time}`);

      const task = await Task.create({
        title: entities.title,
        type: entities.type || "assignment",
        courseName: entities.courseName,
        dueDate,
        description: "Tạo tự động từ chatbot",
        status: "pending",
        priority: "medium",
        user: entities.userId,
      });
      if (
        task &&
        Array.isArray(entities.reminder) &&
        entities.reminder.length > 0
      ) {
        if (!entities.remindChannel) {
          return {
            success: true,
            created: task,
            preview: {
              title: task.title,
              dueDate: task.dueDate,
              courseName: task.courseName,
            },
            message:
              "Đã tạo task. Bạn muốn nhắc nhở qua Email hay In-app để mình tạo nhắc nhở?",
          };
        }

        const channel = entities.remindChannel;
        const reminderInput = entities.reminder.map((r) => ({
          offsetSec: r,
          channel,
        }));

        const dueDate = new Date(
          `${entities.date}T${entities.timeStart}:00+07:00`
        );

        if (isNaN(dueDate.getTime())) {
          return {
            success: false,
            code: "INVALID_DATETIME",
            message: "Thông tin thời gian không hợp lệ",
          };
        }
        if (dueDate.getTime() < Date.now()) {
          return {
            success: false,
            code: "PAST_TIME" as const,
            message: "Deadline này đã ở quá khứ. Bạn nhập lại ngày/giờ nhé.",
          };
        }

        const reminderDocs = ReminderService.buildForTask({
          userId: entities.userId.toString(),
          taskId: task._id.toString(),
          title: task.title,
          dueDate: task.dueDate,
          reminders: reminderInput,
        });

        await ReminderService.createMany(reminderDocs as any[]);
      }

      return {
        success: true,
        created: task,
        preview: {
          title: task.title,
          dueDate: task.dueDate,
          courseName: task.courseName,
          status: task.status,
          priority: task.priority,
        },
        message: "Đã tạo task thành công.",
      };
    } catch (error: any) {
      if (error?.code === 11000) {
        return {
          success: false,
          code: "DUPLICATE_TASK",
          message: "Task này đã tồn tại (bị trùng).",
        };
      }

      return {
        success: false,
        code: "TASK_CREATE_FAILED",
        message: `Tạo task thất bại: ${error?.message || String(error)}`,
      };
    }
  }
}
