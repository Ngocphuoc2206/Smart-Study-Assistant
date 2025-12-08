import { Response } from "express";
import { AuthRequest } from "../middlewares/authMiddleware";
import { Course } from "../models/course";
import { User } from "../models/user";
import { logDebug, logError } from "../utils/logger";
import { ok, error } from "../utils/apiResponse";

// GET /api/teacher/students
export const getMyStudents = async (req: AuthRequest, res: Response) => {
  try {
    const teacherId = req.user?.userId;
    logDebug(`[TEACHER] getMyStudents (Basic logic) request by: ${teacherId}`);

    // BƯỚC 1: Tìm các lớp thầy đang dạy
    const courses = await Course.find({ teacher: teacherId }).select("students");

    if (!courses || courses.length === 0) {
      return ok(res, [], "No courses found");
    }

    // BƯỚC 2: Gom tất cả ID học sinh vào một mảng (Dùng vòng lặp for)
    // Tạo một mảng rỗng để chứa kết quả tạm
    let allStudentIds: string[] = [];

    // Chạy vòng lặp qua từng khóa học
    for (let i = 0; i < courses.length; i++) {
        const currentCourse = courses[i];
        
        // Nếu khóa học có học sinh
        if (currentCourse.students && currentCourse.students.length > 0) {
            // Chạy vòng lặp qua từng học sinh trong khóa học đó
            for (let j = 0; j < currentCourse.students.length; j++) {
                const studentId = currentCourse.students[j];
                // Nếu tồn tại thì ghi vào danh sách 
                allStudentIds.push(studentId.toString());
            }
        }
    }

    // BƯỚC 3: Lọc bỏ các ID bị trùng lặp (Dùng vòng lặp for)
    // Ví dụ: Học sinh A học 2 môn, thì ID của A xuất hiện 2 lần -> Cần giữ lại 1
    let uniqueStudentIds: string[] = [];

    for (let i = 0; i < allStudentIds.length; i++) {
        const idCanKiemTra = allStudentIds[i];

        // Kiểm tra: Nếu trong danh sách kết quả CHƯA có ID này -> Thì mới thêm vào
        if (!uniqueStudentIds.includes(idCanKiemTra)) {
            uniqueStudentIds.push(idCanKiemTra);
        }
    }

    // Kiểm tra nếu không có học sinh nào
    if (uniqueStudentIds.length === 0) {
        return ok(res, [], "No students found");
    }

    // BƯỚC 4: Lấy thông tin chi tiết từ bảng User
    // (Bước này vẫn dùng $in vì đây là cách tối ưu nhất của Database, 
    // không nên dùng vòng lặp để query DB vì sẽ rất chậm)
    const students = await User.find({
      _id: { $in: uniqueStudentIds }, // Tìm những ai có ID nằm trong danh sách uniqueStudentIds
      role: "student",
    }).select("firstName lastName email avatarUrl");

    logDebug(`[TEACHER] Found ${students.length} unique students`);
    return ok(res, students);

  } catch (err) {
    logError("[TEACHER] getMyStudents error:", err);
    return error(res, err, "Internal Server Error");
  }
};