/* eslint-disable @typescript-eslint/no-explicit-any */
import { AuthRequest } from "../middlewares/authMiddleware";
import { Response } from "express";
import { logDebug } from "../utils/logger";
import { Reminder } from "../models/reminder";


export const getReminder = async (req: AuthRequest, res: Response) => {
    try{
        const userId = req.user?.userId;
        if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });
        const { status, from, to } = req.query;
        const query: any = { user: userId };
        if (status) query.status = status;
        // gte: greater than or equal
        // lte: less than or equal
        if (from || to) {
            query.remindAt = {};
            if (from) query.remindAt.$gte = new Date(from as string);
            if (to) query.remindAt.$lte = new Date(to as string);
        }
        const data = await Reminder.find(query).sort({ remindAt: 1 });
        return res.status(200).json({ success: true, data });
    } catch(e) {
        logDebug("Error getting reminder: ", e);
        return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
}