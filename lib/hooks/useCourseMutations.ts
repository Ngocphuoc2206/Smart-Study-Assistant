// lib/hooks/useCourseMutations.ts
"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Course } from "@/lib/types";
import { mockCoursesStore } from "@/lib/mockData";
import { toast } from "sonner";
import { v4 as uuidv4 } from 'uuid';

type CourseInput = Omit<Course, 'id'>;

// --- TẠO ---
const createCourse = async (data: CourseInput): Promise<Course> => {
  await new Promise(res => setTimeout(res, 400));
  const newId = `c${Object.keys(mockCoursesStore).length + 1}`;
  const newCourse: Course = { id: newId, ...data };
  mockCoursesStore[newId] = newCourse;
  return newCourse;
};

// --- SỬA ---
const updateCourse = async ({ id, data }: { id: string, data: Partial<CourseInput> }): Promise<Course> => {
  await new Promise(res => setTimeout(res, 400));
  if (!mockCoursesStore[id]) throw new Error("Không tìm thấy môn học");
  mockCoursesStore[id] = { ...mockCoursesStore[id], ...data };
  return mockCoursesStore[id];
};

// --- XÓA ---
const deleteCourse = async (id: string): Promise<string> => {
  await new Promise(res => setTimeout(res, 400));
  // (Logic thực tế sẽ kiểm tra xem môn học có sự kiện nào không)
  // if (mockEventsStore.some(e => e.course?.id === id)) {
  //   throw new Error("Không thể xóa môn học đang có sự kiện");
  // }
  if (!mockCoursesStore[id]) throw new Error("Không tìm thấy môn học");
  delete mockCoursesStore[id];
  return id;
};

// --- Hook tổng ---
export const useCourseMutations = () => {
  const queryClient = useQueryClient();
  
  const invalidate = () => {
    // Làm mới cả 2 query
    queryClient.invalidateQueries({ queryKey: ['coursesWithCount'] });
    queryClient.invalidateQueries({ queryKey: ['events'] });
  };

  const createMutation = useMutation({
    mutationFn: createCourse,
    onSuccess: (data) => {
      toast.success(`Đã tạo môn: ${data.name}`);
      invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const updateMutation = useMutation({
    mutationFn: updateCourse,
    onSuccess: (data) => {
      toast.success(`Đã cập nhật: ${data.name}`);
      invalidate();
    },
    onError: (e) => toast.error(e.message),
  });
  
  const deleteMutation = useMutation({
    mutationFn: deleteCourse,
    onSuccess: () => {
      toast.success("Đã xóa môn học");
      invalidate();
    },
    onError: (e) => toast.error(e.message),
  });
  
  return { createMutation, updateMutation, deleteMutation };
};