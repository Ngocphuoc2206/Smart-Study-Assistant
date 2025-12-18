/* eslint-disable @typescript-eslint/no-explicit-any */
import { Response } from "express";
import { AuthRequest } from "../middlewares/authMiddleware";
import { ChatMessage } from "../models/chatMessage";
import { logDebug } from "../../shared/logger";
import { Chat } from "openai/resources/index.mjs";

// GET /chat/history
export const getChatHistory = async (req: AuthRequest, res: Response) => {
    try {
        // 1. Check Auth
        if (!req.user?.userId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized"
            });
        }

        const userId = req.user.userId;
        //Xử lý Pagination riêng biệt (Để test logic)
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 4;
        const skip = (page - 1) * limit;
        logDebug(`getChatHistoryPagination user: ${userId}, page: ${page}, limit: ${limit}`);
        //Đếm tổng số tin nhắn để tính tổng số trang
        const totalMessages = await ChatMessage.countDocuments({ user: userId });
        const totalPages = Math.ceil(totalMessages / limit);

        //
        const messages = await ChatMessage.find({ user: userId })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);
        //Đảo ngược mảng lại để hiển thị tin nhắn theo thứ tự thời gian
       const chronologicalMessages = messages.reverse();

        return res.status(200).json({
            success: true,
            data: {
                messages: chronologicalMessages,
                pagination: {
                    currentPage: page,
                    totalPages: totalPages,
                    totalMessages: totalMessages,
                    limit: limit,
                    hasNextPage: page < totalPages,
                    hasPrevPage: page > 1
                }
            }
        });

    } catch (error) {
        logDebug("Error fetching chat history pagination: ", error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    }
};

//Post /chat/history

export const createChatMessage = async (req: AuthRequest, res: Response) => {
    try {
        // 1. Check Auth    
        if (!req.user?.userId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized"
            });
        }

        const { role, content, intent } = req.body;

        //2.Validate required fields
        if (!role || !content) {
            return res.status(400).json({
                success: false,
                message: "Missing required fields: role, content"
            });
        }

        // Validate role value
        if(role !=='user' && role !== 'assistant'){
            return res.status(400).json({
                success: false,
                message: "Role must be 'user' or 'assistant'"
            });
        }
        // 3. Create Chat Message
        const newMessage = await ChatMessage.create({
            user: req.user.userId,
            role,
            content,
            intent
        });
        logDebug("New chat message created: ", newMessage);

        return res.status(201).json({
            success: true,
            message: "Chat message created successfully",
            data: newMessage
        });

    } catch (error: any) {
        logDebug("Error creating chat message: ", error);

        // Fix handly validation by Mongoose 
        if (error.name === 'ValidationError') {
            return res.status(400).json({
                success: false,
                message: "Validation Error",
                error: error.message
            });
        }   
        return res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    }   
};

// DELETE /chat/history (delete all chat messages for the user)
export const clearChatHistory = async (req: AuthRequest, res: Response) => {
    try {
        // 1. Check Auth
        if (!req.user?.userId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized"
            });
        }

        const userId = req.user.userId;
        logDebug("clearChatHistory for user:", userId);

        // Delete all chat messages for the user
        await ChatMessage.deleteMany({ user: userId });

        return res.status(200).json({
            success: true,
            message: "Chat history cleared successfully"
        });

    } catch (error) {
        logDebug("Error clearing chat history: ", error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    }
};

// DELETE /chat/history/:id (delete a specific chat message by id)
export const deleteChatMessageById = async (req: AuthRequest, res: Response) => {
    try {
        // 1. Check Auth    
        if (!req.user?.userId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized"
            });
        }

        const { id } = req.params;
        logDebug("deleteChatMessageById id:", id);

        // 2. Find and Delete
        const deletedMessage = await ChatMessage.findOneAndDelete({
            _id: id,
            user: req.user.userId
        });

        if (!deletedMessage) {
            return res.status(404).json({
                success: false,
                message: "Chat message not found or unauthorized"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Chat message deleted successfully",
            data: deletedMessage
        });

    } catch (error) {
        logDebug("Error deleting chat message: ", error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    }
};



