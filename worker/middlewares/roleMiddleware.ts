import { Response, NextFunction } from "express";
import { AuthRequest } from "./authMiddleware";
import { User } from "../models/user";
import { logDebug, logError } from "../../shared/logger";

export const validateTeacher = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    // req.user được gán từ authMiddleware
    if (!req.user || !req.user.userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const user = await User.findById(req.user.userId);

    // Kiểm tra nếu không phải teacher
    if (!user || user.role !== "teacher") {
      logDebug(`[AUTH] Access denied. User ${req.user.userId} is not a teacher.`);
      return res.status(403).json({
        success: false,
        message: "Forbidden: Access is denied. Teacher role required."
      });
    }

    next();
  } catch (error) {
    logError("[AUTH] Error in validateTeacher middleware:", error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};