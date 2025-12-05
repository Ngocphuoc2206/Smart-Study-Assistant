import { Response } from "express";
import { logDebug } from "../utils/logger";
import { generateResponse, NLPService } from "../services/nlpService";
import { DetectedIntent, mapIntentName, toVNEntities } from "../../shared/type";
import { AuthRequest } from "../middlewares/authMiddleware";
import { NLPActionHandler } from "../services/actionHandler";

import { ChatMessage } from "../models/chatMessage";
import { AuthRequest } from "../middlewares/authMiddleware";

export const detectIntentHandler = async (req: AuthRequest, res: Response) => {
    try{
        const { text } = req.body as { text: string } || {};
        //Get User ID from token(issue #10)
        const userId = req.user?.userId;

        logDebug("[NLPController] detectIntent request", { text });

        // (issue #10)1. Save user's question (role: 'user') as soon as the request is received
        if (userId){
            await ChatMessage.create({
                user: userId,
                role: 'user',
                content: text
            });
        }
        const intent = await NLPService.detectIntent(text || "");
        //(issue #8) Extract information
        const entities = NLPService.extractEntities(text || "");

        if (userId) {
            //(issue #10) Create content to save to DB (Example: Save analysis results as text or JSON)
            const botContent = `Đã hiểu ý định: ${intent}. Chi tiết: ${JSON.stringify(entities)}`;
            
            await ChatMessage.create({
                user: userId,
                role: 'assistant',
                content: botContent,
                intent: intent // Save intent
            });
        }
        return res.status(200).json({
            success: true,
            data: {
                intent,
                entities //(issue #8) Return entities 
            }
        });
    }catch(error){
        logDebug("[NLPController] Error detecting intent: ", error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
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
