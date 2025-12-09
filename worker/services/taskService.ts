import { VNEntities } from "../../shared/type";
import { Task } from "../models/task";

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
      return { success: true, created: task, preview: task };
    }
    catch (error) {
      return { success: false, message: `Tạo task thất bại, ${error}` };
    }
  }
}
