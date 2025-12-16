import { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../utils/jwt";

const EXCEPT_PATHS = [
  "/api/auth/login", 
  "/api/auth/register",
  "/api/auth/me",
  "/api/nlp/detect-intent",
  "/api/schedule",
  "/api/course",
];

export interface AuthRequest extends Request {
  user?: {
    userId: string;
  };
}

const authMiddleware = async (req: AuthRequest, res: Response, next: NextFunction) => {
  console.log("PATH:", req.path, "ORIGINAL:", req.originalUrl);
  if (EXCEPT_PATHS.includes(req.path)) {
    return next();
  }

  // Dev bypass: allow anonymous in dev when env set
  if (process.env.ALLOW_ANONYMOUS === 'true') {
    req.user = { userId: process.env.ANON_USER_ID || '000000000000000000000000' };
    return next();
  }

  // 1) Session-based auth (cookie)
  const sessionUser = (req as any).session?.user;
  if (sessionUser && sessionUser.userId) {
    req.user = { userId: sessionUser.userId };
    return next();
  }

  // 2) Bearer token fallback
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
