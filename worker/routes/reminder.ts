import { Router } from "express";
import { getReminder } from "../controllers/reminder";

const remindRouter = Router();
remindRouter.get("/", getReminder);

export default remindRouter;
