import { Response } from "express";
import { AuthRequest } from "../middlewares/authMiddleware";
import { Course } from "../models/course";
import { logDebug, logError } from "../utils/logger";

import { ok, error } from "../utils/apiResponse"; 

// GET /api/teacher/students?courseId=...&search=...
export const getMyStudents = async (req: AuthRequest, res: Response) => {
  try {
    const teacherId = req.user?.userId;

    
    if (!teacherId) {
        return res.status(401).json({ 
            success: false, 
            message: "Unauthorized: User ID missing" 
        });
    }

    // Lấy tham số từ URL
    const { courseId, search } = req.query; 

    logDebug(`[TEACHER] getMyStudents request by: ${teacherId}`, { courseId, search });

    // 1. Tạo bộ lọc
    let courseFilter: any = { teacher: teacherId };
    
    if (courseId && typeof courseId === 'string') {
        courseFilter._id = courseId; 
    }

    // 2. Query Database
    const courses = await Course.find(courseFilter)
      .select("name code students")
      .populate({
        path: "students",
        select: "firstName lastName email avatarUrl",
        model: "User"
      });

    
    if (!courses || courses.length === 0) {
      return res.status(200).json({
          success: true,
          message: "No courses found",
          data: [] 
      });
    }

    // 3. Logic lọc thủ công (Dùng vòng lặp for dễ hiểu)
    let resultList: any[] = [];
    const searchKeyword = (search as string)?.toLowerCase().trim();

    for (let i = 0; i < courses.length; i++) {
      const currentCourse = courses[i];
      const studentsInCourse = currentCourse.students as any[];

      if (studentsInCourse && studentsInCourse.length > 0) {
        for (let j = 0; j < studentsInCourse.length; j++) {
          const student = studentsInCourse[j];
          const fullName = `${student.firstName} ${student.lastName}`;
          
          // Logic tìm kiếm
          if (searchKeyword) {
             const matchName = fullName.toLowerCase().includes(searchKeyword);
             const matchEmail = student.email.toLowerCase().includes(searchKeyword);
             const matchCourse = currentCourse.name.toLowerCase().includes(searchKeyword);
             
             if (!matchName && !matchEmail && !matchCourse) {
                 continue; 
             }
          }

          const rowData = {
            studentId: student._id,
            fullName: fullName,
            email: student.email,
            avatarUrl: student.avatarUrl,
            courseName: currentCourse.name,
            courseCode: currentCourse.code,
            courseId: currentCourse._id
          };

          resultList.push(rowData);
        }
      }
    }

    logDebug(`[TEACHER] Returned ${resultList.length} students after filter`);
    
    // [MÃ 200]: Thành công, trả về dữ liệu
    return res.status(200).json({
        success: true,
        message: "Success",
        data: resultList
    });

  } catch (err) {
    logError("[TEACHER] getMyStudents error:", err);
    
    
    return res.status(500).json({
        success: false,
        message: "Internal Server Error",
        error: err 
    });
  }
};