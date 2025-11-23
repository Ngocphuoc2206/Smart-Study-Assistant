import { NextFunction, Request, Response } from "express";
// 1. Xóa dòng import uuid cũ
// import { v4 as uuid } from "uuid"; 

// 2. Import crypto của Node.js
import crypto from "crypto";

interface RequestWithId extends Request {
    id?: string;
}
  
export default function requestId(req: RequestWithId, res: Response, next: NextFunction) {
    // 3. Sử dụng crypto.randomUUID() thay cho uuid()
    const requestId = crypto.randomUUID();
    
    req.id = requestId;
    res.setHeader("X-Request-Id", requestId);
    next();
}