import { Response } from "express";
import { AuthRequest } from "../middlewares/authMiddleware";
import { NLPService } from "../services/nlpService";
import { NLPActionHandler } from "../services/actionHandler";
import { ChatMessage } from "../models/chatMessage";
import { logDebug, logError } from "../utils/logger";
import { ok, error } from "../utils/apiResponse";
// [UPDATE 1] Import thêm hàm mapIntentName từ shared/type
import { toVNEntities, DetectedIntent, VNIntentName, mapIntentName } from "../../shared/type";

export const handleChatMessage = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { message } = req.body;

    if (!userId) return res.status(401).json({ message: "Unauthorized" });
    if (!message) return error(res, null, "Message is required");

    // B1: Lưu User Message
    await ChatMessage.create({ user: userId, role: "user", content: message });

    // B2: Gọi NLP (Brain)
    // Lấy intent thô từ NLP (VD: "create_event")
    const rawIntentName = await NLPService.detectIntent(message);
    
    // [UPDATE 2] Gọi hàm map để chuẩn hóa tên Intent ngay lập tức
    // create_event -> add_event
    // create_exercise -> create_task
    const intentName = mapIntentName(rawIntentName);

    // Xử lý Entities
    const rawEntities = NLPService.extractEntities(message);
    const entities = toVNEntities(rawEntities);
    entities.userId = userId;

    logDebug(`[Chat] Raw Intent: ${rawIntentName} -> Mapped: ${intentName}`, entities);

    // B3: Xử lý Hành động (Hands)
    let actionResult = null;
    let botReply = "";
    
    // [UPDATE 3] Danh sách này chỉ cần chứa các intent đích (đã map) mà ActionHandler hỗ trợ
    // (Bỏ 'create_event' thừa đi vì đã được map thành 'add_event' rồi)
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
