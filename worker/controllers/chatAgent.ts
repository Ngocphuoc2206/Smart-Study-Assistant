/* eslint-disable @typescript-eslint/no-explicit-any */
import { Response } from "express";
import { AuthRequest } from "../middlewares/authMiddleware";
import { NLPActionHandler } from "../services/actionHandler";
import { ChatMessage } from "../models/chatMessage";
import { logError } from "../../shared/logger";
import { error } from "../utils/apiResponse";
import { detectIntentCore } from "../services/nlpDetectCore";
import { generateFallbackReply } from "../services/llmChatService";
import { DetectCoreResult } from "@/shared/type";

export const handleChatMessage = async (req: AuthRequest, res: Response) => {
  try {
    const { message, pendingIntent, pendingEntities, selectedChannel } =
      req.body;

    const userId = req.user?.userId;

    // Save user message
    await ChatMessage.create({ user: userId, role: "user", content: message });

    // Get history chat
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

    // FOLLOW UP (thiếu field / thiếu remindChannel / validate lỗi)
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

    // SMALL TALK / DIRECT REPLY
    if (result.intent === "unknown" && (result as any).directly) {
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

    // UNKNOWN → FALLBACK LLM CHAT
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
        data: {
          reply,
          intent: result.intent,
          entities: result.entities,
          needsFollowUp: false,
          actionResult: null,
        },
      });
    }

    // EXECUTE PREVIEW (not confirm)
    if (
      result.kind === "execute" &&
      (result as DetectCoreResult).shouldExecuteAction === false
    ) {
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
          actionResult: null,
          pendingIntent: result.intent,
          pendingEntities: result.entities,
        },
      });
    }

    // confirm → handleAction
    const actionResult = await NLPActionHandler.handleAction(
      result.intent,
      result.entities
    );

    // Fallback
    const msg = (actionResult?.message || "").toLowerCase();

    const isBusinessError =
      actionResult?.code === "DUPLICATE_SCHEDULE" ||
      actionResult?.code === "DUPLICATE_TASK" ||
      actionResult?.code === "MISSING_INFO" ||
      actionResult?.code === "PAST_TIME" ||
      msg.includes("đã tồn tại") ||
      msg.includes("trùng") ||
      msg.includes("thiếu thông tin");

    const shouldFallback =
      (actionResult?.success === false && !isBusinessError) ||
      msg.includes("không hỗ trợ");

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
