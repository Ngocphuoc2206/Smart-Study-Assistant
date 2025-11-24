import { Response } from "express";
import { StatusCodes } from "http-status-codes";

// OK
export const ok = (res: Response, data: any, message = "Success") => {
  return res.status(StatusCodes.OK).json({ success: true, message, data });
};

// CREATED
export const created = (res: Response, data: any, message = "Success") => {
  return res.status(StatusCodes.CREATED).json({ success: true, message, data });
};

// BAD REQUEST
export const error = (res: Response, data: any, message: String, details?: any) => {
  return res.status(StatusCodes.BAD_REQUEST).json({ success: false, message, data });
};
