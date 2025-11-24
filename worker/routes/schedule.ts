import {Router} from "express";
import { createSchedule} from "../controllers/schedule";

const scheduleRouter = Router();

scheduleRouter.post("/", createSchedule);

export default scheduleRouter;