import { Request, Response } from "express";
import { AuthRequest } from "../middlewares/authMiddleware";
import { Task } from "../models/task";
import { logDebug } from "../utils/logger";
import { log } from "console";

// POST /task
export const createTask = async(req: AuthRequest, res: Response) => {
    try{
        logDebug("createTask", req.body);
        const userId = req.user?.userId;
        if (!userId){
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }
        const task = await Task.create({
            ...req.body,
            user: userId,
        });
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
    try{
        const task = await Task.findOneAndDelete({
            _id: req.params.id,
            user: req.user?.userId
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