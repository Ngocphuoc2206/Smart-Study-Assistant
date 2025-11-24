import { Request, Response} from "express";
import { AuthRequest } from "../middlewares/authMiddleware";
import { Schedule } from "../models/schedule";
import { logDebug } from "../utils/logger";

//Post /schedules
export const createSchedule = async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user?.userId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized"
            });
        }

        const { course, title, type, startTime, endTime, location, notes } = req.body;

        if (!course || !title || !startTime ) {
            return res.status(400).json({
                success: false,
                message: "Missing required fields: course, title, startTime"
            });
        }

        const newSchedule = await Schedule.create({
            user: req.user.userId,
            course,
            title,
            type: type || 'lecture',
            startTime,
            endTime,
            location,
            notes
        });
        logDebug("New schedule created: ", newSchedule);

        return res.status(201).json({
            success: true,
            message: "Schedule created successfully",
            data: newSchedule
        });
    }
    catch (error: any) {
        logDebug("Error creating schedule: ", error);

        if (error.name === 'ValidationError') {
            return res.status(400).json({
                success: false,
                message: "Validation Error",
                error: error.message
            });
        }

        return res.status(500).json({
            success: false,
            message: "Internal Server Error"
            });
    }
};
