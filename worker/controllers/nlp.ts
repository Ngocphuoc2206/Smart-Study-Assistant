import { Request, Response } from "express";
import { logDebug } from "../utils/logger";
import { generateResponse, NLPService } from "../services/nlpService";
import { DetectedIntent, mapIntentName } from "../../shared/type";

export const detectIntentHandler = async (req: Request, res: Response) => {
    try{
        const { text } = req.body as { text: string } || {};
        logDebug("[NLPController] detectIntent request", { text });
        const intent = await NLPService.detectIntent(text || "");
        //(issue #8) Extract information
        const entities = NLPService.extractEntities(text || "");
        const detected: DetectedIntent = {
            name: mapIntentName(intent),
            entities: entities,
        };
        const responseText = generateResponse(detected);
        logDebug("[NLPController] detectIntent response", { responseText });

        return res.status(200).json({
            success: true,
            data: {
                intent: detected.name,
                responseText,
                entities: detected.entities //(issue #8) Return entities 
            }
        });
    }catch(error){
        logDebug("[NLPController] Error detecting intent: ", error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    }
}