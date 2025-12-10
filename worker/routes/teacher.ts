import { Router } from "express";
import authMiddleware from "../middlewares/authMiddleware";
import { validateTeacher } from "../middlewares/roleMiddleware";
import { getMyStudents } from "../controllers/teacher";

const teacherRouter = Router();

teacherRouter.use(authMiddleware);
teacherRouter.use(validateTeacher);

// GET /api/teacher/students
teacherRouter.get("/students", getMyStudents);

export default teacherRouter;