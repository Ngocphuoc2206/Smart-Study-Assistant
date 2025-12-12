import { Router } from "express";
import authMiddleware from "../middlewares/authMiddleware";
import { handleChatMessage } from "../controllers/chatAgent";

const chatRouter = Router();


// POST /api/chat/message
chatRouter.post("/message", handleChatMessage);

export default chatRouter;