// lib/hooks/useCourses.ts
"use client";

import { useQuery } from "@tanstack/react-query";
import { Course } from "@/lib/types";
import api from "@/lib/api";
import { de } from "chrono-node";

// Because BE none return eventCount, define type similar to Course
export type CourseWithEventCount = Course & {
  eventCount?: number; // Allow undefined or 0
};

const fetchCourses = async (): Promise<CourseWithEventCount[]> => {
  const res = await api.get('/course');
  // Map _id -> id
  return res.data.data.map((c: any) => ({
    id: c._id,
    name: c.name,
    code: c.code,
    description: c.description,
    color: c.color,
    eventCount: 0 
  }));
};

export const useCourses = () => {
  return useQuery({
    queryKey: ['course'], 
    queryFn: fetchCourses,
    staleTime: 1000 * 60 * 5, 
  });
};