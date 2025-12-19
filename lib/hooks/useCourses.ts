// lib/hooks/useCourses.ts
"use client";

import { useQuery } from "@tanstack/react-query";
import { Course, StudentInfo } from "@/lib/types";
import api from "@/lib/api";
import { de } from "chrono-node";

// Because BE none return eventCount, define type similar to Course
export type CourseWithEventCount = Course & {
  eventCount?: number; // Allow undefined or 0
  teacherName?: string;
  teacherEmail?: string;
  students?: StudentInfo[];
};

const fetchCourses = async (): Promise<CourseWithEventCount[]> => {
  // Fetch courses and schedules in parallel so we can compute event counts per course
  const [coursesRes, schedulesRes] = await Promise.all([
    api.get('/course'),
    api.get('/schedule'),
  ]);

  const coursesData = coursesRes.data?.data || [];
  const schedules = schedulesRes.data?.data || [];

  // Build map courseId -> count
  const counts: Record<string, number> = {};
  schedules.forEach((s: any) => {
    const courseRef = s.course; // could be id string or populated object
    const cid = courseRef && (typeof courseRef === 'string' ? courseRef : courseRef._id || courseRef.id);
    if (cid) {
      const key = cid.toString();
      counts[key] = (counts[key] || 0) + 1;
    }
  });

  // Map _id -> id and attach eventCount
  return coursesData.map((c: any) => ({
    id: c._id,
    name: c.name,
    code: c.code,
    description: c.description,
    color: c.color,
    eventCount: counts[c._id] || 0,
    students: (c.students || []).map((s: any) => ({
      id: s._id || s.id,
      firstName: s.firstName,
      lastName: s.lastName,
      email: s.email,
      avatar: s.avatar,
    })),
    teacherName: c.teacher ? `${c.teacher.firstName || ''} ${c.teacher.lastName || ''}`.trim() : undefined,
    teacherEmail: c.teacher?.email,
  }));
};

export const useCourses = () => {
  return useQuery({
    queryKey: ['courses'], 
    queryFn: fetchCourses,
    enabled: false,
  });
};