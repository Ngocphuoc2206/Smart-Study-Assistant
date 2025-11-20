import { NextFunction, Request, Response } from "express";
import { v4 as uuid } from "uuid";

interface RequestWithId extends Request {
    id?: string;
}
  
export default function requestId(req: RequestWithId, res: Response, next: NextFunction) {
    const requestId = uuid();
    req.id = requestId;
    res.setHeader("X-Request-Id", requestId);
    next();
}