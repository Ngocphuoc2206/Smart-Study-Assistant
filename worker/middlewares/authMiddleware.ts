import { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../utils/jwt";
import { success } from "zod";

const EXCEPT_PATHS = [
  "/api/auth/login", 
  "/api/auth/register"
];

export interface AuthRequest extends Request {
  user?: {
    userId: string;
  };
}

const authMiddleware = async (req: AuthRequest, res: Response, next: NextFunction) => {
  if (EXCEPT_PATHS.includes(req.path)) {
    return next();
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = verifyAccessToken(token);
    req.user = { userId: decoded.userId };
    next();
  } catch (error) {
    return res.status(401).json({success: false, message: "Token not valid" });
  }

}

export default authMiddleware;