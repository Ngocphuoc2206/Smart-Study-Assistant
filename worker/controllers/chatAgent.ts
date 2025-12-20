import { Response } from "express";
import { AuthRequest } from "../middlewares/authMiddleware";
import { NLPActionHandler } from "../services/actionHandler";
import { ChatMessage } from "../models/chatMessage";
import { logError } from "../../shared/logger";
import { error } from "../utils/apiResponse";
import { detectIntentCore } from "../services/nlpDetectCore";

export const handleChatMessage = async (req: AuthRequest, res: Response) => {
  try {
    const { message, pendingIntent, pendingEntities, selectedChannel } = req.body;
    const userId = req.user?.userId;
    await ChatMessage.create({ user: userId, role: "user", content: message });

    const result = await detectIntentCore({
      text: message || "",
      userId,
      pendingIntent,
      pendingEntities,
      selectedChannel,
    });

    if (result.kind === "follow_up") {
      await ChatMessage.create({
        user: userId,
        role: "assistant",
        content: result.responseText,
        intent: result.intent,
      });
  
      return res.status(200).json({
        success: true,
        data: {
          reply: result.responseText,
          intent: result.intent,
          entities: result.entities,
          needsFollowUp: true,
          followUp: result.followUp,
          pendingIntent: result.pendingIntent,
          pendingEntities: result.pendingEntities,
        },
      });
    }

    const actionResult = await NLPActionHandler.handleAction(result.intent, result.entities);
    const reply = actionResult?.message || result.responseText || "Ok!";
  
    await ChatMessage.create({
      user: userId,
      role: "assistant",
      content: reply,
      intent: result.intent,
    });
  
    return res.status(200).json({
      success: true,
      data: {
        reply,
        intent: result.intent,
        entities: result.entities,
        actionResult,
        needsFollowUp: false,
      },
    });
  } catch (err) {
    logError("[Chat] Error:", err);
    return error(res, err, "Internal Server Error");
  }
};
