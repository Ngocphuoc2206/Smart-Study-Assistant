// lib/hooks/useCourses.ts
"use client";

import { useQuery } from "@tanstack/react-query";
import { Course } from "@/lib/types";
import { mockCoursesStore, mockEventsStore } from "@/lib/mockData";

// Kiểu dữ liệu mới bao gồm số sự kiện
export type CourseWithEventCount = Course & {
  eventCount: number;
};

const mockCourseFetcher = async (): Promise<CourseWithEventCount[]> => {
  await new Promise(res => setTimeout(res, 200));
  
  // Đếm số sự kiện
  const eventCounts = new Map<string, number>();
  mockEventsStore.forEach(event => {
    if (event.course) {
      eventCounts.set(event.course.id, (eventCounts.get(event.course.id) || 0) + 1);
    }
  });

  // Chuyển đổi object thành mảng và thêm eventCount
  return Object.values(mockCoursesStore).map(course => ({
    ...course,
    eventCount: eventCounts.get(course.id) || 0,
  }));
};

export const useCourses = () => {
  return useQuery<CourseWithEventCount[], Error>({
    // ✨ Đổi queryKey để không đụng cache cũ của P3
    queryKey: ['coursesWithCount'], 
    queryFn: mockCourseFetcher,
    staleTime: 1000 * 60 * 5, // Cache 5 phút
  });
};