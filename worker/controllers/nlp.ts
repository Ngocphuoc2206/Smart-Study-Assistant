import { Request, Response } from "express";
import { logDebug } from "../utils/logger";
import { NLPService } from "../services/nlpService";
import { en } from "chrono-node";

export const detectIntentHandler = async (req: Request, res: Response) => {
    try{
        const { text } = req.body as { text: string } || {};
        logDebug("[NLPController] detectIntent request", { text });
        const intent = await NLPService.detectIntent(text || "");
        //(issue #8) Extract information
        const entities = NLPService.extractEntities(text || "");

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
}