/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  NormalizedReminder,
  ReminderChannel,
  ReminderInput,
} from "@/shared/type";
import { Schema, Types } from "mongoose";
import { Reminder } from "../models/reminder";
import { logDebug } from "../../shared/logger";

const normalizeChannel = (ch?: ReminderChannel): "Email" | "In-app" => {
  if (!ch) return "In-app";
  const v = ch.toLowerCase();
  return v === "email" ? "Email" : "In-app";
};

const normalizeInputs = (reminders?: ReminderInput[]): NormalizedReminder[] => {
  if (!Array.isArray(reminders)) return [];
  return reminders
    .map((r) => {
      if (typeof r === "number")
        return { offsetSec: r, channel: "In-app" as const };
      return { offsetSec: r.offsetSec, channel: normalizeChannel(r.channel) };
    })
    .filter((r) => Number.isFinite(r.offsetSec));
};

export const buildForTask = (args: {
  userId?: string;
  taskId: string;
  title: string;
  dueDate: Date;
  reminders?: ReminderInput[];
}) => {
  // Standardize reminders
  const list = normalizeInputs(args.reminders);
  const base = new Date(args.dueDate);

  const seen = new Set<string>();
  return list
    .map((r) => {
      const remindAt = new Date(base.getTime() + r.offsetSec * 1000);
      const key = `${remindAt.toISOString()}|${r.channel}`;
      if (seen.has(key)) return null;
      seen.add(key);
      return {
        user: args.userId,
        task: new Types.ObjectId(args.taskId),
        title: args.title,
        remindAt,
        channel: r.channel,
        status: "PENDING",
      };
    })
    .filter(Boolean);
};

export const buildForSchedule = (args: {
  userId?: string;
  scheduleId: string;
  title: string;
  startTime: Date;
  reminders?: ReminderInput[];
}) => {
  const list = normalizeInputs(args.reminders);
  const base = new Date(args.startTime);
  const seen = new Set<string>();
  return list
    .map((r) => {
      const remindAt = new Date(base.getTime() + r.offsetSec * 1000);
      const key = `${remindAt.toISOString()}|${r.channel}`;
      if (seen.has(key)) return null;
      seen.add(key);
      return {
        user: args.userId,
        schedule: new Types.ObjectId(args.scheduleId),
        title: args.title,
        remindType: "SCHEDULED" as const,
        remindAt,
        channel: r.channel,
        status: "PENDING" as const,
      };
    })
    .filter(Boolean);
};

export const createMany = async (docs: any[]) => {
  if (!docs.length) return [];
  try {
    logDebug("Create many docs...");
    return await Reminder.insertMany(docs, { ordered: false });
  } catch (err: any) {
    if (err?.code === 11000) return [];
    return [];
  }
};

export const deleteByTask = async (userId: string, taskId: string) => {
  return Reminder.deleteMany({
    user: new Types.ObjectId(userId),
    task: new Types.ObjectId(taskId),
  });
};

export const deleteBySchedule = async (userId: string, scheduleId: string) => {
  return Reminder.deleteMany({
    user: new Types.ObjectId(userId),
    schedule: new Types.ObjectId(scheduleId),
  });
};
