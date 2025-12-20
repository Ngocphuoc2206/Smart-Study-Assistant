/* eslint-disable @typescript-eslint/no-explicit-any */
import { Response } from "express";
import { logDebug } from "../../shared/logger";
import { VNIntentName } from "../../shared/type";
import { AuthRequest } from "../middlewares/authMiddleware";
import { NLPActionHandler } from "../services/actionHandler";
import { detectIntentCore } from "../services/nlpDetectCore";

export const detectIntentHandler = async (req: AuthRequest, res: Response) => {
  try {
    const {
      text,
      userId: rawUserId,
      pendingIntent,
      pendingEntities,
      selectedChannel,
    } = (req.body as any) || {};

    const userId = req.user?.userId || rawUserId;
    const result = await detectIntentCore({
      text: text || "",
      userId,
      pendingIntent,
      pendingEntities,
      selectedChannel,
    });

    if (result.kind === "execute") {
      const actionResult = await NLPActionHandler.handleAction(
        result.intent as VNIntentName,
        result.entities
      );

      return res.status(200).json({
        success: true,
        data: {
          intent: result.intent,
          entities: result.entities,
          responseText: actionResult?.message || result.responseText || "Ok!",
          actionResult,
          needsFollowUp: false,
        },
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        intent: result.intent,
        entities: result.entities,
        needsFollowUp: true,
        followUp: result.followUp,
        responseText: result.responseText,
        pendingIntent: result.pendingIntent,
        pendingEntities: result.pendingEntities,
      },
    });
  } catch (error) {
    logDebug("[NLPController] Error detecting intent: ", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};
