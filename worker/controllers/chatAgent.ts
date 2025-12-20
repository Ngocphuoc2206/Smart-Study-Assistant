import { Response } from "express";
import { AuthRequest } from "../middlewares/authMiddleware";
import { NLPService } from "../services/nlpService";
import { NLPActionHandler } from "../services/actionHandler";
import { ChatMessage } from "../models/chatMessage";
import { logDebug, logError } from "../../shared/logger";
import { ok, error } from "../utils/apiResponse";
// [UPDATE 1] Import thêm hàm mapIntentName từ shared/type
import { toVNEntities, DetectedIntent, VNIntentName, mapIntentName } from "../../shared/type";

export const handleChatMessage = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { message } = req.body;

    if (!userId) return res.status(401).json({ message: "Unauthorized" });
    if (!message) return error(res, null, "Message is required");
    await ChatMessage.create({ user: userId, role: "user", content: message });

    const rawIntentName = await NLPService.detectIntent(message);
    
    // create_event -> add_event
    // create_exercise -> create_task
    const intentName = mapIntentName(rawIntentName);

    // handle Entities
    const rawEntities = NLPService.extractEntities(message);
    const entities = toVNEntities(rawEntities);
    entities.userId = userId;

    let actionResult = null;
    let botReply = "";
    
    const ACTION_INTENTS = ["add_event", "create_task"];

    if (ACTION_INTENTS.includes(intentName)) {
        // Gọi Action Handler với intentName đã được chuẩn hóa
        actionResult = await NLPActionHandler.handleAction(intentName as VNIntentName, entities);
        
        // Dùng 'as any' để tránh lỗi TypeScript truy cập property động
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const resultAny = actionResult as any;

        if (actionResult.success) {
            const title = resultAny.created?.title || entities.title || "Công việc";
            botReply = `Đã tạo thành công: "${title}"`;
        } else {
            // Nếu Action trả về lỗi (VD: Intent không hỗ trợ, lỗi DB...)
            botReply = actionResult.message || "Không thể thực hiện yêu cầu.";
        }
    } else {
        // Nếu là hỏi đáp thông thường (ask_schedule, unknown...) -> Sinh text
        const detectedIntent: DetectedIntent = {
            name: intentName as VNIntentName,
            entities: entities 
        };
        botReply = NLPService.generateResponse(detectedIntent);
    }

    // B4: Lưu Bot Message & Trả về
    await ChatMessage.create({ 
        user: userId,
        role: "assistant", 
        content: botReply,
        intent: intentName
    });

    return ok(res, {
      reply: botReply,
      intent: intentName,
      entities: entities,
      actionResult: actionResult
    });

  } catch (err) {
    logError("[Chat] Error:", err);
    return error(res, err, "Internal Server Error");
  }
};
