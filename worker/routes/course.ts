import { Router } from "express";
import { createCourse, getCourses, updateCourse, deleteCourse, getCourseStudents, registerCourse , removeStudentFromCourse } from "../controllers/course";
import { validate } from "uuid";
import { validateTeacher } from "../middlewares/roleMiddleware";

const courseRouter = Router();

courseRouter.post("/",validateTeacher, createCourse);
courseRouter.get("/", getCourses);
courseRouter.put("/:id", validateTeacher, updateCourse);
courseRouter.delete("/:id", validateTeacher, deleteCourse);
courseRouter.get("/:id/students", getCourseStudents);
courseRouter.post("/:id/register", registerCourse)
courseRouter.post("/remove-student", validateTeacher, removeStudentFromCourse)
export default courseRouter; 
