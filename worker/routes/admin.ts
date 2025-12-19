import { Router } from "express";
import { getCourses } from "../controllers/course";
import { validateAdmin } from "../middlewares/adminMiddleware";
import {
  createUser,
  deleteUser,
  getAdminAnalytics,
  getAdminStats,
  listNLPLogs,
  listUsers,
  updateUser,
} from "../controllers/admin";

const adminRoute = Router();

adminRoute.use(validateAdmin);
adminRoute.get("/analytics", getAdminAnalytics);

adminRoute.get("/stats", getAdminStats);

adminRoute.get("/users", listUsers);
adminRoute.post("/users", createUser);
adminRoute.patch("/users/:id", updateUser);
adminRoute.delete("/users/:id", deleteUser);

adminRoute.get("/nlp/logs", listNLPLogs);

export default adminRoute;
