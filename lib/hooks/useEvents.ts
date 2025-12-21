/* eslint-disable @typescript-eslint/no-explicit-any */
// lib/hooks/useEvents.ts
"use client";

import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import { Course, StudyEvent } from "@/lib/types";
import api from "@/lib/api";
import { format, parseISO } from "date-fns";

// --- HELPER: MAP DỮ LIỆU ---
const mapScheduleToEvent = (item: any): StudyEvent => {
  const start = parseISO(item.startTime);
  const end = item.endTime ? parseISO(item.endTime) : null;

  const rawCourse = item.course || item.courseId;
  let courseInfo = undefined;

  // Kiểm tra nếu rawCourse tồn tại và là object (đã được populate)
  if (rawCourse && typeof rawCourse === 'object') {
      courseInfo = {
          id: rawCourse._id || rawCourse.id,
          name: rawCourse.name,
          color: rawCourse.color,
          code: rawCourse.code
      };
  }

  return {
    id: item._id || item.id,
    title: item.title,
    type: item.type,
    location: item.location,
    notes: item.notes,
    date: format(start, "yyyy-MM-dd"),
    timeStart: format(start, "HH:mm"),
    timeEnd: end ? format(end, "HH:mm") : undefined,
    course: courseInfo as Course, 
    reminders: item.reminders || [] 
  };
};

// --- QUERY CHO CALENDAR & WIDGET ---
export const useEvents = ({ from, to }: { from: Date; to: Date }) => {
  return useQuery({
    queryKey: ['events', from.toISOString(), to.toISOString()],
    queryFn: async () => {
      const res = await api.get('/schedule', {
        params: { from: from.toISOString(), to: to.toISOString() }
      });
      
      const schedules = res.data?.data || [];
      return schedules.map(mapScheduleToEvent);
    },
    retry: (failureCount, error: any) => {
        if (error.response?.status === 401) return false;
        return failureCount < 3;
    }
  });
};

// --- QUERY CHO DASHBOARD ---
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
    staleTime: 0, 
    refetchOnWindowFocus: true,
   });
};

// --- QUERY CHO DANH SÁCH (INFINITE SCROLL) ---
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