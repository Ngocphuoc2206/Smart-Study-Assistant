import { Request, Response } from "express";
import { AuthRequest } from "../middlewares/authMiddleware";
import { Task } from "../models/task";
import { logDebug } from "../../shared/logger";
import * as ReminderService from "../services/reminderService";

// POST /task
export const createTask = async(req: AuthRequest, res: Response) => {
    try{
        logDebug("createTask", req.body);
        const userId = req.user?.userId;
        if (!userId){
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }
        const { reminders, ...taskPayload} = req.body;
        const task = await Task.create({
            ...taskPayload,
            user: userId,
        });
        //Create Reminders if provided
        const reminderDocs = ReminderService.buildForTask({
            userId: userId,
            taskId: task._id.toString(),
            title: task.title,
            dueDate: task.dueDate,
            reminders,
        })
        await ReminderService.createMany(reminderDocs as []);
        return res.status(201).json({
            success: true,
            data: task
        });
    }
    catch(error){
        return res.status(500).json({ success: false, message: error });
    }
}

// GET /task
export const getTasks = async(req: AuthRequest, res: Response) => {
    logDebug("getTasks", req.user);
    try{
        const userId = req.user?.userId;
        const tasks = await Task.find({ user: userId });
        return res.status(200).json({
            success: true,
            data: tasks
        });
    }catch(error){
        return res.status(500).json({ success: false, message: error });
    }
}

// GET /task/:id
export const getTaskById = async(req: AuthRequest, res: Response) => {
    logDebug("getTaskById", req.params.id);
    try{
        const task = await Task.findOne({
            _id: req.params.id,
            userId: req.user?.userId
        });
        if (!task){
            return res.status(404).json({ success: false, message: "Task not found" });
        }
        return res.status(200).json({
            success: true,
            data: task
        });
    }catch(error){
        return res.status(500).json({ success: false, message: error });
    }
}

// Patch /task/:id
export const updateTask = async(req: AuthRequest, res: Response) => {
    logDebug("updateTask by id", req.params.id);
    try{
        const task = await Task.findOneAndUpdate({
            _id: req.params.id,
            user: req.user?.userId
        }, 
        req.body, {
            new: true
        });
        if (!task) return res.status(404).json({ success: false, message: "Task not found" });
        return res.status(200).json({
            success: true,
            data: task
        });
    }catch(error){
        return res.status(500).json({ success: false, message: error });
    }
}

// DELETE /task/:id
export const deleteTask = async(req: AuthRequest, res: Response) => {
    logDebug("deleteTask by id", req.params.id);
    try{
        const task = await Task.findOneAndDelete({
            _id: req.params.id,
            user: req.user?.userId
        });
        if (!task) return res.status(404).json({ success: false, message: "Task not found" });
        await ReminderService.deleteByTask(req.user?.userId as string, req.params.id);
        return res.status(200).json({
            success: true,
            data: task
        });
    }catch(error){
        return res.status(500).json({ success: false, message: error });
    }
}