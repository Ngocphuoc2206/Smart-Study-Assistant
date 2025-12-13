/* eslint-disable @typescript-eslint/no-explicit-any */
import { Response } from "express";
import { logDebug } from "../utils/logger";
import { generateResponse, NLPService } from "../services/nlpService";
import { DetectedIntent, mapIntentName, toVNEntities, VNIntentName } from "../../shared/type";
import { AuthRequest } from "../middlewares/authMiddleware";
import { NLPActionHandler } from "../services/actionHandler";

import { ChatMessage } from "../models/chatMessage";
import { success } from "zod";

export const detectIntentHandler = async (req: AuthRequest, res: Response) => {
  try {
    const { text, userId: rawUserId, pendingIntent, pendingEntities, selectedChannel } =
      (req.body as any) || {};
    logDebug("[NLPController] detectIntent request", { text });
    const intentRaw = await NLPService.detectIntent(text || "");
    const intentStr =
    typeof intentRaw === "string"
      ? intentRaw
      : (typeof intentRaw === "object" && intentRaw !== null && "intent" in intentRaw
          ? String((intentRaw as { intent?: unknown }).intent || "")
          : "");
    const extracted = NLPService.extractEntities(text || "");
    const entities = toVNEntities(extracted);
    const userId = req.user?.userId || rawUserId;
    if (userId) {
      entities.userId = userId;
    }
    const name = mapIntentName(intentStr);
    const detected: DetectedIntent = {
      name,
      entities,
    }
    //Check pendingItent & pendingEntities && has selectedChannel
    if (pendingIntent === "create_task" && pendingEntities && selectedChannel){
      const merged = {...pendingEntities, reminderChannel: selectedChannel, userId: userId ?? ""}
      const actionResult = await NLPActionHandler.handleAction("create_task" as VNIntentName, merged);
      const responseText = actionResult?.success ? 
      `Ok, mình sẽ nhắc bạn qua **${selectedChannel}**. Mình đã tạo task rồi nhé!` 
      : actionResult?.message || "Không thể tạo task, vui lòng thử lại!";
      return res.status(200).json({
        success: true,
        data: {
          intent: pendingIntent,
          responseText,
          entities: merged,
          actionResult,
          needsFollowUp: false,
        }
      })
    }
    //Check if doesn't has selectedchannel
    if (detected.name === "create_task" 
      && Array.isArray(detected.entities?.reminder) 
      && detected.entities?.reminder.length > 0 
      && !detected.entities?.remindChannel){
        return res.status(200).json({
          success: true,
          data: {
            intent: detected.name,
            entities: detected.entities,
            needsFollowUp: true,
            followUp: {
              question: "Bạn muốn tôi nhắc nhở ở đâu",
              field: "reminderChannel",
              options: ["Email", "In-app"],
            },
            responseText: "Bạn muốn tôi nhắc nhở ở đâu? **Email** hoặc **In-app**",
          }
        })
      }

    let actionResult = null;
    const autoCreateIntents = ["add_event", "add_events"];
    if (autoCreateIntents.includes(detected.name as VNIntentName)) {
      actionResult = await NLPActionHandler.handleAction(detected.name as VNIntentName, detected.entities);
    }

    const responseText = generateResponse(detected);
    logDebug("[NLPController] detectIntent response", { responseText, actionResult });
    return res.status(200).json({
      success: true,
      data: {
        intent: detected.name,
        responseText,
        entities: detected.entities,
        actionResult,
        extractedEntities: extracted,
      },
    });
  } catch (error) {
    logDebug("[NLPController] Error detecting intent: ", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};
