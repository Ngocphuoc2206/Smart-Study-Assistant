/* eslint-disable @typescript-eslint/no-explicit-any */

import type { Response } from "express";
import { AuthRequest } from "../middlewares/authMiddleware";
import { Task } from "../models/task";
import { logDebug } from "../../shared/logger";
import * as ReminderService from "../services/reminderService";

/**
 * ✅ Helper: convert params value to string safely
 * Some typings may infer params as string | string[]
 */
function toParamString(v: string | string[] | undefined): string | undefined {
  if (!v) return undefined;
  return Array.isArray(v) ? v[0] : v;
}

// POST /task
export const createTask = async (req: AuthRequest, res: Response) => {
  try {
    logDebug("createTask", req.body);

    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const { reminders, ...taskPayload } = req.body;

    const task = await Task.create({
      ...taskPayload,
      user: userId,
    });

    // Create Reminders if provided
    const reminderDocs = ReminderService.buildForTask({
      userId,
      taskId: task._id.toString(),
      title: task.title,
      dueDate: task.dueDate,
      reminders,
    });

    await ReminderService.createMany(reminderDocs as any[]);

    return res.status(201).json({
      success: true,
      data: task,
    });
  } catch (error: any) {
    logDebug("createTask error", error);
    return res.status(500).json({
      success: false,
      message: error?.message || String(error),
    });
  }
};

// GET /task
export const getTasks = async (req: AuthRequest, res: Response) => {
  logDebug("getTasks", req.user);

  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const tasks = await Task.find({ user: userId });

    return res.status(200).json({
      success: true,
      data: tasks,
    });
  } catch (error: any) {
    logDebug("getTasks error", error);
    return res.status(500).json({
      success: false,
      message: error?.message || String(error),
    });
  }
};

// GET /task/:id
export const getTaskById = async (req: AuthRequest, res: Response) => {
  logDebug("getTaskById", (req.params as any)?.id);

  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const id = toParamString((req.params as any).id);
    if (!id) {
      return res
        .status(400)
        .json({ success: false, message: "Missing task id" });
    }

    // ✅ Fix query: use field "user" not "userId"
    const task = await Task.findOne({
      _id: id,
      user: userId,
    });

    if (!task) {
      return res
        .status(404)
        .json({ success: false, message: "Task not found" });
    }

    return res.status(200).json({
      success: true,
      data: task,
    });
  } catch (error: any) {
    logDebug("getTaskById error", error);
    return res.status(500).json({
      success: false,
      message: error?.message || String(error),
    });
  }
};

// PATCH /task/:id
export const updateTask = async (req: AuthRequest, res: Response) => {
  logDebug("updateTask by id", (req.params as any)?.id);

  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const id = toParamString((req.params as any).id);
    if (!id) {
      return res
        .status(400)
        .json({ success: false, message: "Missing task id" });
    }

    const task = await Task.findOneAndUpdate(
      {
        _id: id,
        user: userId,
      },
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!task) {
      return res
        .status(404)
        .json({ success: false, message: "Task not found" });
    }

    return res.status(200).json({
      success: true,
      data: task,
    });
  } catch (error: any) {
    logDebug("updateTask error", error);
    return res.status(500).json({
      success: false,
      message: error?.message || String(error),
    });
  }
};

// DELETE /task/:id
export const deleteTask = async (req: AuthRequest, res: Response) => {
  logDebug("deleteTask by id", (req.params as any)?.id);

  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const id = toParamString((req.params as any).id);
    if (!id) {
      return res
        .status(400)
        .json({ success: false, message: "Missing task id" });
    }

    const task = await Task.findOneAndDelete({
      _id: id,
      user: userId,
    });

    if (!task) {
      return res
        .status(404)
        .json({ success: false, message: "Task not found" });
    }

    // Delete reminders
    await ReminderService.deleteByTask(userId, id);

    return res.status(200).json({
      success: true,
      data: task,
    });
  } catch (error: any) {
    logDebug("deleteTask error", error);
    return res.status(500).json({
      success: false,
      message: error?.message || String(error),
    });
  }
};
