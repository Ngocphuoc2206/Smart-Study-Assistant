// lib/types.ts

/** Đại diện cho một Môn học */
export type Course = {
  id: string;
  name: string;
  code?: string;
  description?: string;
  color: string; // Mã màu hex, ví dụ: '#ef4444'
  students: string[]; // Danh sách ID sinh viên đã đăng ký
  teacherName?: string;
  teacherEmail?: string;
};

/** Đại diện cho một Sự kiện học tập */
export type StudyEvent = {
  id: string;
  type: 'exam' | 'assignment' | 'lecture' | 'other';
  title: string;
  date: string; // ISO date string (YYYY-MM-DD)
  timeStart: string; // "HH:mm"
  timeEnd?: string; // "HH:mm"
  course?: Course;
  location?: string;
  notes?: string;
  reminders?: { offsetSec: number; channel: 'inapp' | 'email' | 'webpush' }[];
};

export interface StudentInfo {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  avatar?: string;
}