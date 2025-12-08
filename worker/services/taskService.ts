import { VNEntities } from "../../shared/type";
import { Task } from "../models/task";

export class TaskService {
  static async createFromNLP(entities: VNEntities) {
    const task = await Task.create({
      title: entities.title,
      type: entities.type || "assignment",
      dueDate: new Date(`${entities.date}T${entities.timeStart}`),
      priority: "medium",
      user: entities.userId
    });
    return { success: true, created: task, preview: task };
  }
}
