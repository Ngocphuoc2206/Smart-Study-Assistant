// lib/types.ts

/** Đại diện cho một Môn học */
export type Course = {
  id: string;
  name: string;
  code?: string;
  description?: string;
  color: string; // Mã màu hex, ví dụ: '#ef4444'
};

/** Đại diện cho một Sự kiện học tập */
export type StudyEvent = {
  id: string;
  type: 'exam' | 'assignment' | 'lecture' | 'other';
  title: string;
  date: string; // ISO date string (YYYY-MM-DD)
  timeStart: string; // "HH:mm"
  timeEnd?: string; // "HH:mm"
  course?: Course; // Liên kết với môn học (có màu)
  location?: string;
  notes?: string;
  reminders?: { offsetSec: number; channel: 'inapp' | 'email' | 'webpush' }[];
};