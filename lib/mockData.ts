// lib/mockData.ts
import { Course, StudyEvent } from "./types";

// "Database" cho Môn học
let mockCoursesStore: Record<string, Course> = {
  'c1': { id: 'c1', name: 'Trí tuệ nhân tạo', code: 'IT4040', color: '#ef4444' }, // red-500
  'c2': { id: 'c2', name: 'Phát triển Web', code: 'IT4788', color: '#3b82f6' }, // blue-500
  'c3': { id: 'c3', name: 'Cơ sở dữ liệu', code: 'IT3040', color: '#22c55e' }, // green-500
};

// "Database" cho Sự kiện
let mockEventsStore: StudyEvent[] = [
  { id: '1', type: 'exam', title: 'Thi giữa kỳ AI', course: mockCoursesStore['c1'], date: '2025-10-25', timeStart: '09:00', location: 'Phòng A1.101', reminders: [{ offsetSec: -3600, channel: 'inapp' }] },
  { id: '3', type: 'lecture', title: 'Buổi học bù CSDL', course: mockCoursesStore['c3'], date: '2025-10-25', timeStart: '13:30', timeEnd: '15:30' },
  { id: '2', type: 'assignment', title: 'Nộp BTL Next.js', course: mockCoursesStore['c2'], date: '2025-10-26', timeStart: '23:59', reminders: [{ offsetSec: -86400, channel: 'inapp' }] }, 
  { id: '4', type: 'assignment', title: 'Deadline Báo cáo UI/UX', date: '2025-10-29', timeStart: '17:00' }, 
  { id: '5', type: 'exam', title: 'Thi cuối kỳ Web', course: mockCoursesStore['c2'], date: '2025-10-30', timeStart: '07:30', location: 'Phòng B2.205', reminders: [{ offsetSec: -172800, channel: 'inapp' }, { offsetSec: -86400, channel: 'inapp' }] }, 
  { id: '6', type: 'assignment', title: 'Bài tập AI chương 3', course: mockCoursesStore['c1'], date: '2025-10-30', timeStart: '23:59' },
];

export { mockCoursesStore, mockEventsStore };