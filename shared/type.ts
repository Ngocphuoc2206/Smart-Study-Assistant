import { ObjectId } from "mongoose";

//#region Intent Detect
export type IntentConfig = {
    name: string;
    description: string;
    keywords_any: string[];
    required?: string[];
    excluded?: string[];
    priority?: number;
}

export type RootConfig = {
    defaultIntent: string;
    minScore: number;
    intents: IntentConfig[];
}

export type VNIntentName =
  | "add_event"
  | "create_task"
  | "find_event"
  | "unknown"
  | "error";

export type VNEntities = {
    userId?: ObjectId | string;
    title?: string;
    type?: 'exam' | 'assignment' | 'lecture' | 'other';
    date?: string; // YYYY-MM-DD
    timeStart?: string; // HH:mm
    timeEnd?: string;
    course?: string;
    courseName?: string;
    location?: string;
    reminder?: number[];
    reminderOffset?: number;
    missingEntities?: string[];
    remindChannel?: ReminderChannel;
}

export type DetectedIntent = {
    name: VNIntentName;
    confidence?: number;
    entities: VNEntities;
}

export function mapIntentName(raw: string): VNIntentName {
    const s = (raw || '').toLowerCase().trim().replace(/\s+/g, '_');

    if (["add_event", "add_events", "create_event", "create_schedule"].includes(s)) return "add_event";
    if (["create_task", "create_exercise", "add_task"].includes(s)) return "create_task";

    if (["find_event", "search_event", "find", "search"].includes(s)) return "find_event";
    if (["error", "failed"].includes(s)) return "error";

    return "unknown";
  }

  const pad2 = (n: number) => String(n).padStart(2, "0");
  //const toHHmm = (d: Date) => `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
  const toHHmm = (d: Date) => `${pad2(d.getUTCHours())}:${pad2(d.getUTCMinutes())}`;
  const toYYYYMMDD = (d: Date) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export function toVNEntities(extracted: any): VNEntities {
    const out: VNEntities = {
      title: extracted.title,
      type: extracted.type,
      courseName: extracted.course,
    };
  
    if (extracted.datetime instanceof Date && !isNaN(extracted.datetime.getTime())) {
      const d = extracted.datetime;
      out.date = toYYYYMMDD(d);
      out.timeStart = toHHmm(d);
    }
  
    if (typeof extracted.reminderOffset === "number" && extracted.reminderOffset !== 0) {
      out.reminder = [extracted.reminderOffset];
    }
  
    return out;
  }
//#endregion

//#region Reminder
export type ReminderChannel = "Email" | "In-app" | "email" | "inapp";
export type ReminderInput = number | {offsetSec: number; channel?: ReminderChannel}
export type NormalizedReminder = { offsetSec: number; channel: "Email" | "In-app" };
//#endregion

//#region Notification
export type NotificationChannel = "Email" | "In-app";
export type NotificationType = "TASK" | "SCHEDULE";
//#endregion