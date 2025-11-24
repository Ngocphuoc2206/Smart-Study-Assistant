import { Request, Response} from "express";
import { AuthRequest } from "../middlewares/authMiddleware";
import { Schedule } from "../models/schedule";
import { logDebug } from "../utils/logger";
import { populate } from "dotenv";
import { Course } from "../models/course";

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
// GET /api/schedule
export const getSchedule = async (req: AuthRequest, res: Response) => {
    try {
        // Check Auth
        if (!req.user?.userId) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }

        const { from, to } = req.query;
        const userId = req.user.userId;

        let query: any = { user: userId };

        if (from && to) {
            query.startTime = {
                $gte: new Date(from as string), 
                $lte: new Date(to as string)    
            };
        }

        // Query DB
        const schedules = await Schedule.find(query)
            .populate('course', 'name code color') 
            .sort({ startTime: 1 });

        return res.status(200).json({
            success: true,
            data: schedules
        });

    } catch (error) {
        logDebug("Error fetching schedules: ", error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    }
};

// PUT /api/schedules/:id
export const updateSchedule = async (req: AuthRequest, res: Response) => {
    try {
        // 1. Check Auth
        if (!req.user?.userId) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }

        const { id } = req.params;
        const updateData = req.body;

        // 2. Find và Update
        const updatedSchedule = await Schedule.findOneAndUpdate(
            { _id: id, user: req.user.userId }, 
            updateData,
            { new: true, runValidators: true } // new: true để trả về data mới sau khi sửa
        );

        if (!updatedSchedule) {
            return res.status(404).json({
                success: false,
                message: "Schedule not found or unauthorized"
            });
        }

        logDebug("Schedule updated: ", updatedSchedule);

        return res.status(200).json({
            success: true,
            message: "Schedule updated successfully",
            data: updatedSchedule
        });

    } catch (error: any) {
        logDebug("Error updating schedule: ", error);

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

// DELETE /api/schedules/:id
export const deleteSchedule = async (req: AuthRequest, res: Response) => {
    try {
        // 1. Check Auth
        if (!req.user?.userId) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }

        const { id } = req.params;

        // 2. Find and Delete
        const deletedSchedule = await Schedule.findOneAndDelete({
            _id: id,
            user: req.user.userId 
        });

        if (!deletedSchedule) {
            return res.status(404).json({
                success: false,
                message: "Schedule not found or unauthorized"
            });
        }

        logDebug("Schedule deleted: ", id);

        return res.status(200).json({
            success: true,
            message: "Schedule deleted successfully"
        });

    } catch (error) {
        logDebug("Error deleting schedule: ", error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    }
};