import { Router } from "express";
import { getChatHistory, createChatMessage, clearChatHistory, deleteChatMessageById} from "../controllers/chatHistory";
import authMiddleware from "../middlewares/authMiddleware";
const chatHistoryRouter = Router();

//Protect all routes with tokens
chatHistoryRouter.use(authMiddleware);


chatHistoryRouter.get("/", getChatHistory);
chatHistoryRouter.post("/", createChatMessage);
chatHistoryRouter.delete("/", clearChatHistory);
chatHistoryRouter.delete("/:id", deleteChatMessageById);

export default chatHistoryRouter;