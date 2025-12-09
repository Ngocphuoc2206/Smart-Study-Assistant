import { success } from "zod";
import { VNEntities } from "../../shared/type";
import { AuthRequest } from "../middlewares/authMiddleware";
import { Schedule } from "../models/schedule";

export class ScheduleService {
    static async createFromNLP(entities: VNEntities){
        try{
            const schedule = await Schedule.create({
                title: entities.title,
                type: entities.type || "lecture",
                courseName: entities.courseName,
                startTime: new Date(`${entities.date}T${entities.timeStart}`),
                endTime: entities.timeEnd ? new Date(`${entities.date}T${entities.timeEnd}`) : undefined,
                location: entities.location,
                notes: "Tạo tự động từ chatbot",
                reminders: entities.reminder,
                user: entities.userId
            })
            return {
                success: true,
                created: schedule,
                preview: {
                  title: schedule.title,
                  startTime: schedule.startTime,
                  location: schedule.location
                }
            };
        }
        catch(error){
            return {
                success: false,
                message: `Tạo lịch thất bại, ${error}`
            }
        }
    }
}