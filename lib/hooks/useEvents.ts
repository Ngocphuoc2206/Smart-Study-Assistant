/* eslint-disable @typescript-eslint/no-explicit-any */
// lib/hooks/useEvents.ts
"use client";

import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import { StudyEvent } from "@/lib/types";
import api from "@/lib/api";
import { format, parseISO } from "date-fns";

// --- HELPER: MAP DỮ LIỆU ---
const mapScheduleToEvent = (item: any): StudyEvent => {
  const start = parseISO(item.startTime);
  const end = item.endTime ? parseISO(item.endTime) : null;

  const courseInfo = (item.courseId && typeof item.courseId === 'object') ? {
      id: item.courseId._id,
      name: item.courseId.name,
      color: item.courseId.color,
      code: item.courseId.code
  } : undefined;

  return {
    id: item._id,
    title: item.title,
    type: item.type,
    location: item.location,
    notes: item.notes,
    date: format(start, "yyyy-MM-dd"),
    timeStart: format(start, "HH:mm"),
    timeEnd: end ? format(end, "HH:mm") : undefined,
    course: courseInfo, // Lấy trực tiếp từ populate, KHÔNG CẦN gọi API courses nữa
    reminders: [] 
  };
};

// --- 1. QUERY CHO CALENDAR & WIDGET ---
export const useEvents = ({ from, to }: { from: Date; to: Date }) => {
  return useQuery({
    queryKey: ['events', from.toISOString(), to.toISOString()],
    queryFn: async () => {
      // CHỈ GỌI 1 API DUY NHẤT
      const res = await api.get('/schedule', {
        params: { from: from.toISOString(), to: to.toISOString() }
      });
      
      const schedules = res.data?.data || [];
      return schedules.map(mapScheduleToEvent);
    },
    // Nếu gặp lỗi 401, không retry để tránh spam server
    retry: (failureCount, error: any) => {
        if (error.response?.status === 401) return false;
        return failureCount < 3;
    }
  });
};

// --- 2. QUERY CHO DASHBOARD (UPCOMING) ---
export const useUpcomingEvents = (limit: number = 5) => {
   return useQuery<StudyEvent[], Error>({
    queryKey: ['events', 'upcoming', limit], 
    queryFn: async () => {
        const now = new Date();
        const to = new Date(now);
        to.setDate(to.getDate() + 30);
        const res = await api.get('/schedule', {
            params: {
                from: now.toISOString(),
                to: to.toISOString(),
            }
        });
        
        const schedules = res.data?.data || [];
        return schedules.map(mapScheduleToEvent);
    },
    //staleTime: 1000 * 60 * 5, 
    // SỬA: Xóa dòng staleTime 5 phút, hoặc set về 0
    staleTime: 0, 
    // Thêm: Tự động tải lại khi quay lại tab trình duyệt
    refetchOnWindowFocus: true,
   });
};

// --- 3. QUERY CHO DANH SÁCH (INFINITE SCROLL) ---
export type EventFilters = {
  from: Date;
  to: Date;
  search?: string;
  type?: string;
  sort?: 'asc' | 'desc';
};

export const useInfiniteEvents = (filters: EventFilters) => {
  return useInfiniteQuery({
    queryKey: ['events', 'infinite', filters],
    queryFn: async ({ pageParam = 1 }) => {
      const res = await api.get('/schedule', {
        params: {
          page: pageParam,
          limit: 10,
          from: filters.from.toISOString(),
          to: filters.to.toISOString(),
          type: filters.type !== 'all' ? filters.type : undefined,
          search: filters.search,
          sort: filters.sort
        }
      });
      
      const schedules = res.data?.data || [];
      const events = schedules.map(mapScheduleToEvent);
      
      return {
        data: events,
        nextPage: events.length === 10 ? (pageParam as number) + 1 : undefined, 
      };
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage: any) => lastPage.nextPage,
  });
};