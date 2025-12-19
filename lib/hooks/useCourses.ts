/* eslint-disable @typescript-eslint/no-explicit-any */
// lib/hooks/useCourses.ts
"use client";

import { useQuery } from "@tanstack/react-query";
import { Course } from "@/lib/types";
import api from "@/lib/api";

// Because BE none return eventCount, define type similar to Course
export type CourseWithEventCount = Course & {
  eventCount?: number; // Allow undefined or 0
  teacherName?: string;
  teacherEmail?: string;
};

const fetchCourses = async (): Promise<CourseWithEventCount[]> => {
  const res = await api.get("/course");
  // Map _id -> id
  return res.data.data.map((c: any) => ({
    id: c._id,
    name: c.name,
    code: c.code,
    description: c.description,
    color: c.color,
    eventCount: 0,
    students: c.students || [],
    teacherName: c.teacher
      ? `${c.teacher.firstName || ""} ${c.teacher.lastName || ""}`.trim()
      : undefined,
    teacherEmail: c.teacher?.email,
  }));
};

export const useCourses = () => {
  return useQuery({
    queryKey: ["courses"],
    queryFn: fetchCourses,
  });
};
