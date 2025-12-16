// lib/hooks/useCourses.ts
"use client";

import { useQuery } from "@tanstack/react-query";
import { Course } from "@/lib/types";
import api from "@/lib/api";

// Vì BE chưa trả về eventCount, ta định nghĩa type trùng với Course
export type CourseWithEventCount = Course & {
  eventCount?: number; // Cho phép undefined hoặc 0
};

const fetchCourses = async (): Promise<CourseWithEventCount[]> => {
  const res = await api.get('/courses');
  // Map _id -> id
  return res.data.data.map((c: any) => ({
    id: c._id,
    name: c.name,
    code: c.code,
    color: c.color,
    eventCount: 0 
  }));
};

export const useCourses = () => {
  return useQuery({
    queryKey: ['courses'], 
    queryFn: fetchCourses,
    staleTime: 1000 * 60 * 5, 
  });
};