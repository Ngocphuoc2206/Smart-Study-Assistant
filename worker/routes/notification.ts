import { Router } from "express";
import { getNotifications, markNotificationAsRead, snoozeNotification } from "../controllers/notification";

const notificationRouter = Router();

notificationRouter.get("/", getNotifications);
notificationRouter.patch("/:id/read", markNotificationAsRead);
notificationRouter.patch("/:id/snooze", snoozeNotification);

export default notificationRouter;