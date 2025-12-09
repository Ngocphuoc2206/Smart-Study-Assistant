import { Router } from "express";

import { validateTeacher } from "../middlewares/roleMiddleware";
import { getMyStudents } from "../controllers/teacher";

const teacherRouter = Router();


teacherRouter.use(validateTeacher);

// GET /api/teacher/students
teacherRouter.get("/students", getMyStudents);

export default teacherRouter;