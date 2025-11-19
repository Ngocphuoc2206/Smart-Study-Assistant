import { da } from "date-fns/locale";
import { Response } from "express";
import { StatusCodes } from "http-status-codes";
import { success } from "zod";

// OK
export const ok = (res: Response, data: any, message = "Success") => {
  return res.status(StatusCodes.OK).json({ success: true, message, data });
};

// CREATED
export const crated = (res: Response, data: any, message = "Success") => {
  return res.status(StatusCodes.CREATED).json({ success: true, message, data });
};

// BAD REQUEST
export const error = (res: Response, data: any, message: String, details?: any) => {
  return res.status(StatusCodes.BAD_REQUEST).json({ success: false, message, data });
};


