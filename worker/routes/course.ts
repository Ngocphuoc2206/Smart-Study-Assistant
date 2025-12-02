import { Router } from "express";
import { createCourse, getCourses, updateCourse, deleteCourse } from "../controllers/course";

const courseRouter = Router();

courseRouter.post("/", createCourse);
courseRouter.get("/", getCourses);
courseRouter.put("/:id", updateCourse);
courseRouter.delete("/:id", deleteCourse);

export default courseRouter; 
