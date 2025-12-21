/* eslint-disable @typescript-eslint/no-explicit-any */
import { Response } from "express";
import { AuthRequest } from "../middlewares/authMiddleware";
import { NLPActionHandler } from "../services/actionHandler";
import { ChatMessage } from "../models/chatMessage";
import { logError } from "../../shared/logger";
import { error } from "../utils/apiResponse";
import { detectIntentCore } from "../services/nlpDetectCore";
import { generateFallbackReply } from "../services/llmChatService";

export const handleChatMessage = async (req: AuthRequest, res: Response) => {
  try {
    const { message, pendingIntent, pendingEntities, selectedChannel } =
      req.body;
    const userId = req.user?.userId;
    await ChatMessage.create({ user: userId, role: "user", content: message });

    //Get history chat
    const recentHistory = userId
      ? await ChatMessage.find({ user: userId })
          .sort({ createdAt: -1 })
          .limit(10)
          .select({ content: 1, role: 1, _id: 0 })
          .lean()
      : [];

    const history = Array.isArray(recentHistory)
      ? recentHistory
          .reverse()
          .map((m: any) => ({ role: m.role, content: m.content }))
      : [];

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

    if (result.intent === "unknown" && result.directly) {
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
          needsFollowUp: false,
          actionResult: null,
        },
      });
    }

    if (result.intent === "unknown") {
      const reply = await generateFallbackReply({
        userText: message || "",
        detectedIntent: result.intent,
        entities: result.entities,
        history,
      });

      await ChatMessage.create({
        user: userId,
        role: "assistant",
        content: reply,
        intent: result.intent,
      });

      return res.status(200).json({
        success: true,
        data: { reply, intent: result.intent, entities: result.entities },
      });
    }
    //Save remind and task/schedule
    const actionResult = await NLPActionHandler.handleAction(
      result.intent,
      result.entities
    );

    //Fallback
    const shouldFallback =
      !actionResult?.success ||
      (typeof actionResult?.message === "string" &&
        actionResult.message.toLowerCase().includes("không hỗ trợ"));

    const reply = shouldFallback
      ? await generateFallbackReply({
          userText: message || "",
          detectedIntent: result.intent,
          entities: result.entities,
          history,
        })
      : actionResult?.message || result.responseText || "Ok!";

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
