/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request, Response } from "express";
import { AuthRequest } from "../middlewares/authMiddleware";
import { Course } from "../models/course";
import { logDebug } from "../../shared/logger";
import { User } from "../models/user";

// POST /api/courses
export const createCourse = async (req: AuthRequest, res: Response) => {
  try {
    // 1. Check Auth
    if (!req.user?.userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const { name, code, description, color, students } = req.body;

    // 2. Validate required fields
    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: name",
      });
    }

    // 3. Check duplicate name (same teacher)
    const existingByName = await Course.findOne({
      teacher: req.user.userId,
      name: name.trim(),
    });

    if (existingByName) {
      return res.status(409).json({
        success: false,
        message: `Bạn đã có khóa học có tên "${name}" rồi.`,
      });
    }

    // 4. Check duplicate code (system-wide)
    if (code && code.trim()) {
      const existingByCode = await Course.findOne({
        code: code.trim(),
      });

      if (existingByCode) {
        return res.status(409).json({
          success: false,
          message: `Mã khóa học "${code}" đã tồn tại trong hệ thống.`,
        });
      }
    }

    // 5. Create Course
    const newCourse = await Course.create({
      teacher: req.user?.userId,
      name,
      code,
      description,
      color,
      students: students || [], // default to empty array if not provided
    });

    logDebug("New course created: ", newCourse);

    return res.status(201).json({
      success: true,
      message: "Course created successfully",
      data: newCourse,
    });
  } catch (error: any) {
    logDebug("Error creating course: ", error);

    // Fix handly validation by Mongoose
    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: "Validation Error",
        error: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

// GET /api/courses
export const getCourses = async (req: any, res: Response) => {
  try {
    const { teacher, student } = req.query;
    let query: any = {};

    if (!teacher && !student) {
      const userId = req.user.userId;
      const currentUser = await User.findById(userId);

      if (currentUser?.role === "student" || currentUser?.role === "admin") {
        query = {};
      } else {
        query = {
          $or: [{ teacher: userId }, { students: userId }],
        };
      }
    } else {
      if (teacher) query.teacher = teacher;
      if (student) query.students = student;
    }

    console.log("Query get course:", JSON.stringify(query));

    const courses = await Course.find(query)
      .populate({ path: "teacher", select: "firstName lastName email" })
      .populate({ path: "students", select: "_id firstName lastName email avatarUrl" })
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: courses,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Error Server" });
  }
};

// GET /api/courses/:id
export const getCourseById = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const { id } = req.params;
    const userId = req.user.userId;

    // Find course by ID and make sure user has view permission (teacher or student)
    const course = await Course.findOne({
      _id: id,
      $or: [{ teacher: userId }, { students: userId }],
    });

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found or unauthorized",
      });
    }

    return res.status(200).json({
      success: true,
      data: course,
    });
  } catch (error) {
    logDebug("Error fetching course by id: ", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

// PUT /api/courses/:id
export const updateCourse = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const { id } = req.params;

    // 1. Get specific fields from body (Destructuring)
    const { name, code, description, color, students } = req.body;
    const userId = req.user.userId; // Lấy userId để check trùng tên theo giáo viên

    // 1. Kiểm tra trùng TÊN (Với các khóa học khác của cùng giáo viên này)
    if (name !== undefined) {
      const existingName = await Course.findOne({
        teacher: userId,
        name: name.trim(),
        _id: { $ne: id }, // Quan trọng: Loại trừ chính khóa học đang sửa
      });

      if (existingName) {
        return res.status(409).json({
          success: false,
          message: `Bạn đã có khóa học khác tên "${name}" rồi. Vui lòng chọn tên khác.`,
        });
      }
    }

    // 2. Kiểm tra trùng CODE (Trên toàn hệ thống)
    if (code !== undefined && code.trim() !== "") {
      const existingCode = await Course.findOne({
        code: code.trim(),
        _id: { $ne: id }, // Quan trọng: Loại trừ chính khóa học đang sửa
      });

      if (existingCode) {
        return res.status(409).json({
          success: false,
          message: `Mã khóa học "${code}" đã tồn tại ở một khóa học khác.`,
        });
      }
    }
    
    // 2. Create a new object, ONLY put what is allowed to be edited in here
    const updateData: any = {};

    // Only update if user submits (other than undefined)
    if (name !== undefined) updateData.name = name;
    if (code !== undefined) updateData.code = code;
    if (description !== undefined) updateData.description = description;
    if (color !== undefined) updateData.color = color;
    if (students !== undefined) updateData.students = students;
    // 3. Perform Update
    const updatedCourse = await Course.findOneAndUpdate(
      { _id: id },
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedCourse) {
      return res.status(404).json({
        success: false,
        message: "Course not found or unauthorized",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Course updated successfully",
      data: updatedCourse,
    });
  } catch (error: any) {
    logDebug("Error updating course: ", error);

    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: "Validation Error",
        error: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

// DELETE /api/courses/:id
export const deleteCourse = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const { id } = req.params;
    logDebug("deleteCourse id:", id);

    // Only teachers can delete courses
    const deletedCourse = await Course.findOneAndDelete({
      _id: id,
    });

    if (!deletedCourse) {
      return res.status(404).json({
        success: false,
        message: "Course not found or unauthorized",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Course deleted successfully",
    });
  } catch (error) {
    logDebug("Error deleting course: ", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

// GET /api/courses/:id/students
export const getCourseStudents = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    // 1. Find course by ID
    const course = await Course.findById(id).populate({
      path: "students",
      select: "firstName lastName email avatarUrl code",
    });

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy khóa học",
      });
    }

    // 2. Check permission: only teacher of the course can view student list

    if (
      req.user &&
      (req.user as any)?.role === "teacher" &&
      course.teacher.toString() !== req.user.userId
    ) {
      return res.status(403).json({
        success: false,
        message: "Bạn không phải giáo viên của lớp này.",
      });
    }

    // 3. Return student list
    return res.status(200).json({
      success: true,
      count: course.students.length,
      data: course.students,
    });
  } catch (error: any) {
    console.error("Lỗi lấy danh sách sinh viên:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi server",
      error: error.message,
    });
  }
};

// POST /api/courses/:id/register

export const registerCourse = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const userId = req.user?.userId;

        const updatedCourse = await Course.findByIdAndUpdate(
            id,
            { $addToSet: { students: userId } },
            { new: true }
        );

        if (!updatedCourse) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy khóa học"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Đăng ký khóa học thành công",
            data: updatedCourse
        });

    } catch (error: any) {
        console.error("Lỗi đăng ký khóa học:", error);
        return res.status(500).json({
            success: false,
            message: "Lỗi server",
            error: error.message
        });
    }   
};
// POST /api/courses/remove-student

export const removeStudentFromCourse = async (req: AuthRequest, res: Response) => {
    try {
        const { courseId, studentId } = req.body;

        if (!courseId || !studentId) {
            return res.status(400).json({ success: false, message: "Thiếu thông tin courseId hoặc studentId" });
        }

        // Cách 1: Dùng $pull (Nhanh, gọn) - Code bạn đang dùng
        const updatedCourse = await Course.findByIdAndUpdate(
            courseId,
            { $pull: { students: studentId } },
            { new: true }
        );

        if (!updatedCourse) {
            return res.status(404).json({ success: false, message: "Không tìm thấy khóa học!" });
        }

        return res.status(200).json({
            success: true,
            message: "Đã xóa sinh viên thành công!",
            data: updatedCourse
        });

    } catch (error) {
        console.error("Lỗi server:", error);
        return res.status(500).json({ success: false, message: "Lỗi Server" });
    }
};
