import { AuthRequest } from "../middlewares/authMiddleware";
import { Response } from "express";
import bcrypt from "bcrypt";

import { User } from "../models/user";
import { Course } from "../models/course";
import { Task } from "../models/task";
import { Schedule } from "../models/schedule";
import { ChatMessage } from "../models/chatMessage";
import { logDebug } from "../../shared/logger";
const SALT_ROUNDS = 10;

export const getAdminStats = async (req: AuthRequest, res: Response) => {
  const [users, courses, tasks, schedules, messages] = await Promise.all([
    User.countDocuments(),
    Course.countDocuments(),
    Task.countDocuments(),
    Schedule.countDocuments(),
    ChatMessage.countDocuments(),
  ]);
  return res.status(200).json({
    users,
    courses,
    tasks,
    schedules,
    messages,
  });
};

export const getAdminAnalytics = async (req: AuthRequest, res: Response) => {
  const day = Math.min(Math.max(parseInt(req.query.day as string) || 7, 1), 90);
  const from = new Date(Date.now() - day * 24 * 60 * 60 * 1000);
  //intent distribution
  const intentDistribution = await ChatMessage.aggregate([
    { $match: { createdAt: { $gte: from } } },
    { $group: { _id: "$intent", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);

  const totalIntent = intentDistribution.reduce(
    (acc, cur) => acc + cur.count,
    0
  );
  const intents = intentDistribution.map((x) => ({
    intent: x._id,
    count: x.count,
    percent: totalIntent ? Math.round((x.count / totalIntent) * 1000) / 10 : 0,
  }));

  // Activity by day
  const dailyAgg = await ChatMessage.aggregate([
    { $match: { createdAt: { $gte: from } } },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        messages: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  const activity = dailyAgg.map((d) => ({ date: d._id, messages: d.messages }));

  return res.json({
    success: true,
    data: { rangeDays: day, intents, activity },
  });
};

export const listUsers = async (req: AuthRequest, res: Response) => {
  logDebug("[Admin] Get List Users");
  const page = Math.max(parseInt(req.query.page as string) || 1, 1);
  const limit = Math.min(
    Math.max(parseInt(req.query.limit as string) || 10, 1),
    100
  );
  const search = ((req.query.search as string) || "").trim();
  const filter = search
    ? {
        $or: [
          { name: { $regex: search, $options: "i" } },
          { firstName: { $regex: search, $options: "i" } },
          { lastName: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
        ],
      }
    : {};
  const [items, total] = await Promise.all([
    User.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    User.countDocuments(filter),
  ]);

  return res.status(200).json({
    items,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  });
};

export const createUser = async (req: AuthRequest, res: Response) => {
  logDebug("[Admin] Create User...");
  const { name, email, password, role } = req.body;
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const user = await User.create({ name, email, passwordHash, role });
  return res.status(201).json(user);
};

export const updateUser = async (req: AuthRequest, res: Response) => {
  logDebug("[Admin] Update User...");
  const { id } = req.params;
  const { name, role } = req.body;
  const user = await User.findByIdAndUpdate(
    id,
    {
      ...(name !== undefined ? { name } : {}),
      ...(role !== undefined ? { role } : {}),
    },
    { new: true }
  );
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }
  return res.status(200).json({ success: true, data: user });
};

export const deleteUser = async (req: AuthRequest, res: Response) => {
  logDebug("[Admin] Delete User...");
  const { id } = req.params;

  const user = await User.findByIdAndDelete(id);
  if (!user)
    return res.status(404).json({ success: false, message: "User not found" });

  return res.json({ success: true });
};

export const listNLPLogs = async (req: AuthRequest, res: Response) => {
  logDebug("[Admin] Getting List NLP Logs...");
  const page = Math.max(parseInt(req.query.page as string) || 1, 1);
  const limit = Math.min(
    Math.max(parseInt(req.query.limit as string) || 10, 1),
    100
  );
  const search = ((req.query.search as string) || "").trim();

  const filter = search
    ? {
        $or: [
          { intent: { $regex: search, $options: "i" } },
          { content: { $regex: search, $options: "i" } },
        ],
      }
    : {};

  const [items, total] = await Promise.all([
    ChatMessage.find(filter)
      .sort({ createAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("user", "email firstName lastName role"),
    ChatMessage.countDocuments(filter),
  ]);

  return res.status(200).json({
    success: true,
    data: {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  });
};
