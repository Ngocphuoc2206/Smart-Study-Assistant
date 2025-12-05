import { success } from "zod";
import { VNEntities, VNIntentName } from "../../shared/type";
import { ScheduleService } from "./scheduleService";
import { TaskService } from "./taskService";

export class NLPActionHandler {
    static async handleAction (intent: VNIntentName, entities: VNEntities) {
        const missing = this.validateEntities(intent, entities);
        if (missing.length){
            return {
                success: false,
                message: `Thiếu thông tin: ${missing.join(', ')}`
            };
        }
        switch (intent) {
            case "add_event":
              return await ScheduleService.createFromNLP(entities);
          
            case "create_task":
              return await TaskService.createFromNLP(entities);
          
            default:
              return { success: false, message: "Intent không hỗ trợ tự động tạo." };
        }
    }
    static validateEntities(intent: VNIntentName, entities: VNEntities): string[] {
        const required =
          intent === "create_task"
            ? ["title", "date"]
            : ["title", "date", "timeStart"];
      
        return required.filter(k => !(entities as any)[k]);
    }
}