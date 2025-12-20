import { NextFunction, Response } from "express";
import { AuthRequest } from "./authMiddleware";
import { User } from "../models/user";

export const validateAdmin = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user?.userId) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  const user = await User.findById(req.user.userId);
  if (!user || user.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Forbidden: Access is denied. Admin role required.",
    });
  }
  next();
};
