import { NextFunction, Request, Response } from "express";
import { success } from "zod";

export const errorHandler = (
    err: any,
    _req: Request,
    res: Response,
    _next: NextFunction
) => {
    console.log("[ERROR] Middleware", err);
    const status = err.status || 500;
    const message = err.message || "Something went wrong";
    res.status(status).json({ success: true, message });
}

export default errorHandler;

