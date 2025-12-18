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
  return res.data;
};

// --- HOOK ---
export const useCourseMutations = () => {
  const queryClient = useQueryClient();
  
  
  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['course'] });
    
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
           // Gọi API: POST /api/courses/{courseId}/register
           return axios.post(`/api/courses/${courseId}/register`);
       },
       onSuccess: () => {
           queryClient.invalidateQueries({ queryKey: ['courses'] });
           toast.success("Đăng ký thành công!");
       },
       onError: (error) => {
           toast.error("Đăng ký thất bại");
       }
   });

   return { createMutation, updateMutation, deleteMutation, registerMutation };
};