import { Request, Response } from "express";
import { AuthRequest } from "../middlewares/authMiddleware";
import { Course } from "../models/course";
import { logDebug } from "../utils/logger";

// POST /api/courses
export const createCourse = async (req: AuthRequest, res: Response) => {
    try {
        // 1. Check Auth
        if (!req.user?.userId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized"
            });
        }

        const { name, code, description, color, students } = req.body;

        // 2. Validate required fields
        if (!name) {
            return res.status(400).json({
                success: false,
                message: "Missing required fields: name"
            });
        }

        // 3. Create Course
        // Tự động gán teacher là người đang đăng nhập
        const newCourse = await Course.create({
            user: req.user.userId,
            teacher: req.user.userId,
            name,
            code,
            description,
            color,
            students: students || [] // Mặc định mảng rỗng nếu không có
        });

        logDebug("New course created: ", newCourse);

        return res.status(201).json({
            success: true,
            message: "Course created successfully",
            data: newCourse
        });

    } catch (error: any) {
        logDebug("Error creating course: ", error);

        // Xử lý lỗi validation của Mongoose (ví dụ: tên quá dài, sai kiểu...)
        if (error.name === 'ValidationError') {
            return res.status(400).json({
                success: false,
                message: "Validation Error",
                error: error.message
            });
        }

        return res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    }
};

// GET /api/courses
export const getCourses = async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user?.userId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized"
            });
        }

        const userId = req.user.userId;
        logDebug("getCourses for user:", userId);

        // Lấy danh sách khóa học mà user là Giảng viên (teacher) HOẶC là Học viên (students)
        const courses = await Course.find({
            $or: [
                { teacher: userId },
                { students: userId }
            ]
        }).sort({ createdAt: -1 }); // Mới nhất lên đầu

        return res.status(200).json({
            success: true,
            data: courses
        });

    } catch (error) {
        logDebug("Error fetching courses: ", error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    }
};

// GET /api/courses/:id
export const getCourseById = async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user?.userId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized"
            });
        }

        const { id } = req.params;
        const userId = req.user.userId;

        // Tìm course theo ID và đảm bảo user có quyền xem (là GV hoặc SV)
        const course = await Course.findOne({
            _id: id,
            $or: [
                { teacher: userId },
                { students: userId }
            ]
        });

        if (!course) {
            return res.status(404).json({
                success: false,
                message: "Course not found or unauthorized"
            });
        }

        return res.status(200).json({
            success: true,
            data: course
        });

    } catch (error) {
        logDebug("Error fetching course by id: ", error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    }
};

// PUT /api/courses/:id
export const updateCourse = async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user?.userId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized"
            });
        }

        const { id } = req.params;
        
        // 1. Lấy cụ thể từng trường từ body (Destructuring)
        const { name, code, description, color, students } = req.body;

        // 2. Tạo một object mới, CHỈ NHÉT những gì được phép sửa vào đây
        const updateData: any = {};
        
        // Chỉ cập nhật nếu người dùng có gửi lên (khác undefined)
        if (name !== undefined) updateData.name = name;
        if (code !== undefined) updateData.code = code;
        if (description !== undefined) updateData.description = description;
        if (color !== undefined) updateData.color = color;
        if (students !== undefined) updateData.students = students;
        // 3. Thực hiện Update với dữ liệu sạch (updateData)
        const updatedCourse = await Course.findOneAndUpdate(
            { _id: id, teacher: req.user.userId },
            updateData, // Chỉ chứa name, code, color...
            { new: true, runValidators: true }
        );

        if (!updatedCourse) {
            return res.status(404).json({
                success: false,
                message: "Course not found or unauthorized"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Course updated successfully",
            data: updatedCourse
        });

    } catch (error: any) {
        logDebug("Error updating course: ", error);

        if (error.name === 'ValidationError') {
            return res.status(400).json({
                success: false,
                message: "Validation Error",
                error: error.message
            });
        }

        return res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    }
};

// DELETE /api/courses/:id
export const deleteCourse = async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user?.userId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized"
            });
        }

        const { id } = req.params;
        logDebug("deleteCourse id:", id);

        // Chỉ cho phép Giảng viên (teacher) xóa khóa học
        const deletedCourse = await Course.findOneAndDelete({
            _id: id,
            teacher: req.user.userId
        });

        if (!deletedCourse) {
            return res.status(404).json({
                success: false,
                message: "Course not found or unauthorized"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Course deleted successfully"
        });

    } catch (error) {
        logDebug("Error deleting course: ", error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    }
};