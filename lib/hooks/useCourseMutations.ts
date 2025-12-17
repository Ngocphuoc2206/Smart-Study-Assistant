// lib/hooks/useCourseMutations.ts
"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Course } from "@/lib/types";
import api from "@/lib/api"; // Dùng api client đã cấu hình
import { toast } from "sonner";

// Type cho dữ liệu gửi lên (bỏ id vì BE tự tạo)
type CourseInput = Omit<Course, 'id'>;

// --- API CLIENT ---
const createCourseAPI = async (data: CourseInput) => {
  const res = await api.post('/courses', data);
  return res.data.data;
};

const updateCourseAPI = async ({ id, data }: { id: string, data: Partial<CourseInput> }) => {
  const res = await api.put(`/courses/${id}`, data);
  return res.data.data;
};

const deleteCourseAPI = async (id: string) => {
  const res = await api.delete(`/courses/${id}`);
  return res.data;
};

// --- HOOK ---
export const useCourseMutations = () => {
  const queryClient = useQueryClient();
  
  // Hàm làm mới data sau khi sửa đổi
  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['courses'] });
    // Refresh cả events vì event có chứa thông tin course (màu sắc, tên...)
    queryClient.invalidateQueries({ queryKey: ['events'] });
  };

  const createMutation = useMutation({
    mutationFn: createCourseAPI,
    onSuccess: (data) => {
      toast.success(`Đã tạo môn: ${data.name}`);
      invalidate();
    },
    onError: (e: any) => toast.error(e.response?.data?.message || "Lỗi tạo môn học"),
  });

  const updateMutation = useMutation({
    mutationFn: updateCourseAPI,
    onSuccess: (data) => {
      toast.success(`Đã cập nhật: ${data.name}`);
      invalidate();
    },
    onError: (e: any) => toast.error(e.response?.data?.message || "Lỗi cập nhật môn học"),
  });
  
  const deleteMutation = useMutation({
    mutationFn: deleteCourseAPI,
    onSuccess: () => {
      toast.success("Đã xóa môn học");
      invalidate();
    },
    onError: (e: any) => toast.error(e.response?.data?.message || "Lỗi xóa môn học"),
  });
  
  return { createMutation, updateMutation, deleteMutation };
};