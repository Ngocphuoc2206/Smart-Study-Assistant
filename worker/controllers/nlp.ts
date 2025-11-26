import { Request, Response } from "express";
import { logDebug } from "../utils/logger";
import { NLPService } from "../services/nlpService";

export const detectIntentHandler = (req: Request, res: Response) => {
    try{
        const { text } = req.body as { text: string } || {};
        logDebug("[NLPController] detectIntent request", { text });
        const intent = NLPService.detectIntent(text || "");
        return res.status(200).json({
            success: true,
            data: {
                intent
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