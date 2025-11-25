import { NextFunction, Request, Response } from "express";
import crypto from "crypto";

interface RequestWithId extends Request {
    id?: string;
}
  
export default function requestId(req: RequestWithId, res: Response, next: NextFunction) {
    const requestId = crypto.randomUUID();
    
    req.id = requestId;
    res.setHeader("X-Request-Id", requestId);
    next();
}