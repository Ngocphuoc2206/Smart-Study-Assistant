/* eslint-disable @typescript-eslint/no-explicit-any */
import { VNEntities } from "../../shared/type";
import { Task } from "../models/task";
import * as ReminderService from "../services/reminderService";

export class TaskService {
  static async createFromNLP(entities: VNEntities) {
    try {
      const task = await Task.create({
        title: entities.title,
        type: entities.type || "assignment",
        courseName: entities.courseName,
        dueDate: new Date(`${entities.date}T${entities.timeStart}`),
        description: "Tạo tự động từ chatbot",
        status: "pending",
        priority: "medium",
        user: entities.userId
      });

      //Create reminder
      if (task && Array.isArray(entities.reminder) && entities.reminder.length > 0) {
        const channel = entities.remindChannel || "In-app";
        const reminderInput = entities.reminder.map(r => ({ offsetSec: r, channel }));
        const reminderDocs = ReminderService.buildForTask({
          userId: entities.userId?.toString(),
          taskId: task._id.toString(),
          title: task.title,
          dueDate: task.dueDate,
          reminders: reminderInput
        })
        console.log(reminderDocs);
        await ReminderService.createMany(reminderDocs as any[]);
      }
        return { success: true, created: task, preview: task };
    }
    catch (error) {
      return { success: false, message: `Tạo task thất bại, ${error}` };
    }
  }
}
