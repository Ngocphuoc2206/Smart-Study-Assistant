import { Response } from "express";
import { logDebug } from "../utils/logger";
import { generateResponse, NLPService } from "../services/nlpService";
import { DetectedIntent, mapIntentName, toVNEntities, VNIntentName } from "../../shared/type";
import { AuthRequest } from "../middlewares/authMiddleware";
import { NLPActionHandler } from "../services/actionHandler";

export const detectIntentHandler = async (req: AuthRequest, res: Response) => {
  try {
    const { text, userId: rawUserId } =
      (req.body as { text?: string; userId?: string }) || {};
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
    const name = mapIntentName(intentStr);

    if (userId) entities.userId = userId;
    const detected: DetectedIntent = {
      name,
      entities,
    };

    let actionResult = null;
    const autoCreateIntents = ["add_event", "add_events", "create_task"];
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
