import { Router } from "express";
import { createCourse, getCourses, updateCourse, deleteCourse } from "../controllers/course";
import { validate } from "uuid";
import { validateTeacher } from "../middlewares/roleMiddleware";

const courseRouter = Router();

courseRouter.post("/",validateTeacher, createCourse);
courseRouter.get("/", validateTeacher, getCourses);
courseRouter.put("/:id", validateTeacher, updateCourse);
courseRouter.delete("/:id", validateTeacher, deleteCourse);

export default courseRouter; 
