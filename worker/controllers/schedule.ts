/* eslint-disable prefer-const */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request, Response } from "express";
import { AuthRequest } from "../middlewares/authMiddleware";
import { Schedule } from "../models/schedule";
import { logDebug } from "../../shared/logger";
import { populate } from "dotenv";
import { Course } from "../models/course";
import * as ReminderService from "../services/reminderService";
import { Types } from "mongoose";

//Post /schedules
export const createSchedule = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const {
      course,
      title,
      type,
      startTime,
      endTime,
      location,
      notes,
      reminders,
    } = req.body;

    if (!course || !title || !startTime) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: course, title, startTime",
      });
    }

    const normalizedTitle = title?.trim();
    const normalizedStartTime = new Date(startTime);

    const existing = await Schedule.findOne({
      user: req.user.userId,
      course,
      title: normalizedTitle,
      startTime: normalizedStartTime,
    });

    if (existing) {
      console.log("Duplicate Check: Đã có lịch y hệt trong DB:", { 
          title: normalizedTitle, 
          start: normalizedStartTime 
      });
      return res.status(409).json({
        success: false,
        message: "Schedule already exists (duplicate).",
        data: existing,
      });
    }
    // ------- KIỂM TRA TRÙNG LẶP THỜI GIAN ------
    const checkStartTime = new Date(startTime);
    const checkEndTime = endTime 
      ? new Date(endTime) 
      : new Date(checkStartTime.getTime() + 60 * 60 * 1000); // Mặc định 1 tiếng

    // 2. Query tìm sự kiện bị trùng
    const overlapSchedule = await Schedule.findOne({
      user: req.user.userId,
      startTime: { $lt: checkEndTime }, // Start của sự kiện cũ < End của sự kiện mới
      endTime: { $gt: checkStartTime }, // End của sự kiện cũ > Start của sự kiện mới
    });

    if (overlapSchedule) {
      // Format giờ để hiển thị thông báo lỗi đẹp hơn
      const sTime = new Date(overlapSchedule.startTime);
      const eTime = overlapSchedule.endTime ? new Date(overlapSchedule.endTime) : null;
      const timeString = `${sTime.getHours()}:${sTime.getMinutes().toString().padStart(2, '0')}` + 
                         (eTime ? ` - ${eTime.getHours()}:${eTime.getMinutes().toString().padStart(2, '0')}` : '');
      console.log(`Overlap Check: Lịch mới đụng độ với lịch cũ ID: ${overlapSchedule._id}`);
      console.log(`    -> Lịch cũ: "${overlapSchedule.title}" (${timeString})`);
      return res.status(409).json({
        success: false,
        // Trả về message chi tiết để FE hiển thị
        message: `Trùng thời gian với sự kiện: "${overlapSchedule.title}" (${timeString}).`,
        conflictId: overlapSchedule._id
      });
    }
    // -------
    const newSchedule = await Schedule.create({
      user: req.user.userId,
      course,
      title,
      type: type || "lecture",
      startTime,
      endTime,
      location,
      notes,
      reminders,
    });

    //Create reminder docs
    const reminderDocs = ReminderService.buildForSchedule({
      userId: req.user.userId,
      scheduleId: newSchedule._id.toString(),
      title: newSchedule.title,
      startTime: newSchedule.startTime,
      reminders,
    });
    await ReminderService.createMany(reminderDocs as any[]);
    console.log(" [BE] Tạo lịch thành công:", newSchedule._id);
    logDebug("New schedule created: ", newSchedule);

    return res.status(201).json({
      success: true,
      message: "Schedule created successfully",
      data: newSchedule,
    });
  } catch (err: any) {
    console.error("[BE] Lỗi Exception:", err);
    if (err?.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Schedule already exists (duplicate).",
      });
    }
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};
// GET /api/schedule
export const getSchedule = async (req: AuthRequest, res: Response) => {
  try {
    // Check Auth
    if (!req.user?.userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const { from, to } = req.query;
    const userId = req.user?.userId;

    // By default include schedules owned by the user
    // Also include schedules that belong to courses the user is a member of (student) or teaches (teacher)
    // This lets students see events created by teachers for their courses.
    const courseDocs = await Course.find({
      $or: [{ teacher: userId }, { students: new Types.ObjectId(userId) }],
    })
      .select("_id")
      .lean();

    const courseIds = courseDocs.map((d: any) => d._id);

    const query: any = { $or: [{ user: userId }] };
    if (courseIds.length > 0) {
      query.$or.push({ course: { $in: courseIds } });
    }

    if (from && to) {
      query.startTime = {
        $gte: new Date(from as string),
        $lte: new Date(to as string),
      };
    }

    // Query DB
    const schedules = await Schedule.find(query)
      .populate("course", "name code color")
      .sort({ startTime: 1 });

    return res.status(200).json({
      success: true,
      data: schedules,
    });
  } catch (error) {
    logDebug("Error fetching schedules: ", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

// PUT /api/schedules/:id
export const updateSchedule = async (req: AuthRequest, res: Response) => {
  try {
    // 1. Check Auth
    if (!req.user?.userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const { id } = req.params;
    const updateData = req.body;

    // 2. Find và Update
    const updatedSchedule = await Schedule.findOneAndUpdate(
      { _id: id, user: req.user.userId },
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedSchedule) {
      return res.status(404).json({
        success: false,
        message: "Schedule not found or unauthorized",
      });
    }

    logDebug("Schedule updated: ", updatedSchedule);

    return res.status(200).json({
      success: true,
      message: "Schedule updated successfully",
      data: updatedSchedule,
    });
  } catch (error: any) {
    logDebug("Error updating schedule: ", error);
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

// DELETE /api/schedules/:id
export const deleteSchedule = async (req: AuthRequest, res: Response) => {
  try {
    logDebug("deleteSchedule by id", req.params.id);
    // 1. Check Auth
    if (!req.user?.userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const { id } = req.params;

    // 2. Find and Delete
    const deletedSchedule = await Schedule.findOneAndDelete({
      _id: id,
      user: req.user.userId,
    });

    if (!deletedSchedule) {
      return res.status(404).json({
        success: false,
        message: "Schedule not found or unauthorized",
      });
    }
    //Delete reminder
    await ReminderService.deleteBySchedule(req.user.userId, id);

    return res.status(200).json({
      success: true,
      message: "Schedule deleted successfully",
    });
  } catch (error) {
    logDebug("Error deleting schedule: ", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};
