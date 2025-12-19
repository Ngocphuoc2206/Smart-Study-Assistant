/* eslint-disable @typescript-eslint/no-explicit-any */
// lib/hooks/useCourseMutations.ts
"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Course } from "@/lib/types";
import api from "@/lib/api"; 
import { toast } from "sonner";
import axios from "axios";

// Type for data input (without 'id')
type CourseInput = Omit<Course, 'id'>;

// --- API CLIENT ---
const createCourseAPI = async (data: CourseInput) => {
  const res = await api.post('/course', data);
  return res.data.data;
};

const updateCourseAPI = async ({ id, data }: { id: string, data: Partial<CourseInput> }) => {
  const res = await api.put(`/course/${id}`, data);
  return res.data.data;
};

const deleteCourseAPI = async (id: string) => {
  const res = await api.delete(`/course/${id}`);
  return res.data.data;
};

// --- HOOK ---
export const useCourseMutations = () => {
  const queryClient = useQueryClient();
  
  
  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['courses'] });
    
    queryClient.invalidateQueries({ queryKey: ['events'] });
  };

  const createMutation = useMutation({
    mutationFn: createCourseAPI,
    onSuccess: (data) => {
      toast.success(`Đã tạo môn: ${data.name}`);
      invalidate();
    },
    onError: (e: any) => {
        console.error(e);
        toast.error(e.response?.data?.message || e.response?.data?.error || "Lỗi tạo môn học");
    },
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
  
 const registerMutation = useMutation({
        mutationFn: async (courseId: string) => {
            // Gọi đúng cái đường dẫn bạn vừa tạo ở Backend
            const res = await api.post(`/course/${courseId}/register`);
            return res.data;
        },
        onSuccess: () => {
            toast.success("Đăng ký thành công! Chúc mừng bạn.");
            // Lưu ý: Chúng ta sẽ làm mới danh sách ở bên file CourseGrid
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.message || "Đăng ký thất bại");
        }
    });

   return { createMutation, updateMutation, deleteMutation, registerMutation };
};