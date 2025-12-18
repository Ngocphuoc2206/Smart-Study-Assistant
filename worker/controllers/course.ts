/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request, Response } from "express";
import { AuthRequest } from "../middlewares/authMiddleware";
import { Course } from "../models/course";
import { logDebug } from "../../shared/logger";

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
        const newCourse = await Course.create({
            teacher: req.user?.userId,
            name,
            code,
            description,
            color,
            students: students || [] // default to empty array if not provided
        });
        

        logDebug("New course created: ", newCourse);

        return res.status(201).json({
            success: true,
            message: "Course created successfully",
            data: newCourse
        });

    } catch (error: any) {
        logDebug("Error creating course: ", error);

        // Fix handly validation by Mongoose 
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
        // 1. Lấy tham số từ URL (Query Params)
        const { teacher, student } = req.query;
        
        let query: any = {};

        // 2. Xây dựng bộ lọc
        if (teacher) {
            // Nếu muốn tìm theo giảng viên
            query.teacher = teacher;
        }

        if (student) {
            // Nếu muốn tìm khóa học mà sinh viên này tham gia
            // Mongoose tự động tìm xem ID này có nằm trong mảng 'students' không
            query.students = student;
        }

        // 3. Logic Fallback (Nếu không truyền gì trên URL)
        // Thì lấy khóa học của chính người đang đăng nhập (Logic cũ)
        if (!teacher && !student) {
             if (!req.user?.userId) {
                return res.status(401).json({ 
                    success: false, 
                    message: "Unauthorized: Please login or provide teacher/student ID" 
                });
             }
             const userId = req.user.userId;
             query = {
                $or: [
                    { teacher: userId },
                    { students: userId }
                ]
             };
        }

        logDebug("Fetching courses with query:", query);

        // 4. Thực hiện tìm kiếm
        const courses = await Course.find(query).sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            count: courses.length, // Thêm số lượng để dễ check
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

        // Find course by ID and make sure user has view permission (teacher or student)
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
        
        // 1. Get specific fields from body (Destructuring)
        const { name, code, description, color, students } = req.body;

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
            { _id: id, teacher: req.user.userId },
            updateData, 
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

        // Only teachers can delete courses
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

// GET /api/courses/:id/students
export const getCourseStudents = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;

        // 1. Find course by ID
        const course = await Course.findById(id).populate({
            path: 'students',
            select: 'firstName lastName email avatarUrl code' 
        });

        if (!course) {
            return res.status(404).json({ 
                success: false, 
                message: "Không tìm thấy khóa học" 
            });
        }

        // 2. Check permission: only teacher of the course can view student list
        
        if (req.user && (req.user as any)?.role === 'teacher' && course.teacher.toString() !== req.user.userId) {
             return res.status(403).json({ 
                 success: false, 
                 message: "Bạn không phải giáo viên của lớp này." 
             });
        }

        // 3. Return student list
        return res.status(200).json({
            success: true,
            count: course.students.length, 
            data: course.students         
        });

    } catch (error: any) {
        console.error("Lỗi lấy danh sách sinh viên:", error);
        return res.status(500).json({ 
            success: false, 
            message: "Lỗi server", 
            error: error.message 
        });
    }
};
