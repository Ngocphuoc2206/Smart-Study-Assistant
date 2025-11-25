import {Router} from "express";
import { createSchedule, getSchedule, updateSchedule, deleteSchedule} from "../controllers/schedule";
import { get } from "http";
///
const scheduleRouter = Router();

scheduleRouter.post("/", createSchedule);
scheduleRouter.get("/", getSchedule);
scheduleRouter.put("/:id", updateSchedule);
scheduleRouter.delete("/:id", deleteSchedule);



export default scheduleRouter;