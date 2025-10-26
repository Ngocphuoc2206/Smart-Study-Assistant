// lib/hooks/useEvents.ts
"use client";

import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import { StudyEvent, Course } from "@/lib/types";
import { isWithinInterval, startOfToday, parseISO } from "date-fns";

// ✨ Import từ file mock data
import { mockEventsStore, mockCoursesStore } from "@/lib/mockData";
// --- Mock Data ---
export const mockCourses: Record<string, Course> = {
  'c1': { id: 'c1', name: 'Trí tuệ nhân tạo', color: '#ef4444' }, 
  'c2': { id: 'c2', name: 'Phát triển Web', color: '#3b82f6' }, 
  'c3': { id: 'c3', name: 'Cơ sở dữ liệu', color: '#22c55e' }, 
};

export let mockEvents: StudyEvent[] = [
  { id: '1', type: 'exam', title: 'Thi giữa kỳ AI', course: mockCourses['c1'], date: '2025-10-25', timeStart: '09:00', location: 'Phòng A1.101' },
  { id: '3', type: 'lecture', title: 'Buổi học bù CSDL', course: mockCourses['c3'], date: '2025-10-25', timeStart: '13:30', timeEnd: '15:30' },
  { id: '2', type: 'assignment', title: 'Nộp BTL Next.js', course: mockCourses['c2'], date: '2025-10-26', timeStart: '23:59' }, 
  { id: '4', type: 'assignment', title: 'Deadline Báo cáo UI/UX', date: '2025-10-29', timeStart: '17:00' }, 
  { id: '5', type: 'exam', title: 'Thi cuối kỳ Web', course: mockCourses['c2'], date: '2025-10-30', timeStart: '07:30', location: 'Phòng B2.205' }, 
  { id: '6', type: 'assignment', title: 'Bài tập AI chương 3', course: mockCourses['c1'], date: '2025-10-30', timeStart: '23:59' },
];
// --- End Mock Data ---


// =============================================================
// PHẦN DÀNH CHO PROMPT 1 (Dashboard / CalendarWidget)
// =============================================================
const mockEventFetcher_Simple = async ({ from, to }: { from: Date; to: Date }): Promise<StudyEvent[]> => {
  console.log("Mock Fetch (Cũ - P1): Lấy sự kiện từ", from, "đến", to);
  await new Promise(res => setTimeout(res, 300)); 
  
  // ✨ SỬA: Dùng 'mockEventsStore'
  const filtered = mockEventsStore.filter(event => {
    const eventDate = parseISO(event.date); 
    return isWithinInterval(eventDate, { start: from, end: to });
  });
  
  return filtered.sort((a, b) => new Date(`${a.date}T${a.timeStart}`).getTime() - new Date(`${b.date}T${b.timeStart}`).getTime());
};

export const useEvents = ({ from, to }: { from: Date; to: Date }) => {
  return useQuery<StudyEvent[], Error>({
    queryKey: ['events', from.toISOString().split('T')[0], to.toISOString().split('T')[0]],
    queryFn: () => mockEventFetcher_Simple({ from, to }),
    staleTime: 1000 * 60 * 5, 
  });
};

export const useUpcomingEvents = (limit: number = 5) => {
   return useQuery<StudyEvent[], Error>({
    queryKey: ['events', 'upcoming', limit], 
    queryFn: async () => {
        await new Promise(res => setTimeout(res, 200));
        const now = new Date();
        // ✨ SỬA: Dùng 'mockEventsStore'
        const upcoming = mockEventsStore
            .filter(e => new Date(`${e.date}T${e.timeStart}`) >= now)
            .sort((a, b) => new Date(`${a.date}T${a.timeStart}`).getTime() - new Date(`${b.date}T${b.timeStart}`).getTime());
        return upcoming.slice(0, limit);
    },
    staleTime: 1000 * 60 * 5,
   });
};

// =============================================================
// PHẦN MỚI DÀNH CHO PROMPT 4 (EventList)
// =============================================================
export type EventFilters = {
  from: Date;
  to: Date;
  search?: string;
  type?: 'exam' | 'assignment' | 'lecture' | 'other' | 'all';
  sort?: 'asc' | 'desc';
};
const PAGE_SIZE = 10; 

const mockEventFetcher_Infinite = async (
  filters: EventFilters,
  pageParam: number 
): Promise<{ data: StudyEvent[], nextPage: number | undefined }> => {
  
  console.log("Mock Fetch (Mới - P4): Trang", pageParam, "Filters:", filters);
  await new Promise(res => setTimeout(res, 500)); 

  // 1. Lọc
  // ✨ SỬA: Dùng 'mockEventsStore'
  let filtered = mockEventsStore.filter(event => {
    const eventDate = parseISO(event.date); 
    if (!isWithinInterval(eventDate, { start: filters.from, end: filters.to })) {
      return false;
    }
    if (filters.type && filters.type !== 'all' && event.type !== filters.type) {
      return false;
    }
    if (filters.search) {
      const lowerSearch = filters.search.toLowerCase();
      if (
        !event.title.toLowerCase().includes(lowerSearch) &&
        !(event.course && event.course.name.toLowerCase().includes(lowerSearch))
      ) {
        return false;
      }
    }
    return true;
  });
  
  // 2. Sắp xếp (ĐÃ SỬA LỖI TYPO)
  filtered.sort((a, b) => {
    const timeA = new Date(`${a.date}T${a.timeStart}`).getTime();
    const timeB = new Date(`${b.date}T${b.timeStart}`).getTime(); // Sửa 'a.' -> 'b.'
    return filters.sort === 'desc' ? timeB - timeA : timeA - timeB;
  });

  // 3. Phân trang
  const start = (pageParam - 1) * PAGE_SIZE;
  const end = start + PAGE_SIZE;
  const pageData = filtered.slice(start, end);

  return {
    data: pageData,
    nextPage: end < filtered.length ? pageParam + 1 : undefined,
  };
};

export const useInfiniteEvents = (filters: EventFilters) => {
  const queryKey = ['events', 'infinite', filters]; 

  return useInfiniteQuery<{ data: StudyEvent[], nextPage: number | undefined }, Error>({
    queryKey: queryKey,
    queryFn: ({ pageParam = 1 }) => mockEventFetcher_Infinite(filters, pageParam as number),
    initialPageParam: 1, 
    getNextPageParam: (lastPage) => lastPage.nextPage, 
  });
};