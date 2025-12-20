/* eslint-disable @typescript-eslint/no-explicit-any */
// lib/hooks/useEventMutations.ts
"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { toast } from "sonner";
import { format } from "date-fns";
import { no } from "zod/v4/locales";

// Hàm helper: Gộp ngày + giờ -> ISO String để gửi lên Backend
// Vì Backend cần 'startTime' (Date) chứ không phải 'date' + 'timeStart' rời rạc
const combineDateTime = (dateStr: string | Date | undefined, timeStr: string | undefined) => {
    if (!dateStr || !timeStr) return undefined;
    
    const d = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
    const [hours, minutes] = timeStr.split(':').map(Number);
    
    // Tạo bản sao date để không mutate object gốc
    const newDate = new Date(d);
    newDate.setHours(hours, minutes, 0, 0);
    return newDate.toISOString();
}

// --- 1.(Create) ---
const createEventAPI = async ({ eventData, reminders }: any) => {
  const payload = {
    title: eventData.title,
    type: eventData.type,
    location: eventData.location,
    notes: eventData.notes,
    course: eventData.courseId,
    // convert format FE -> BE
    startTime: combineDateTime(eventData.date, eventData.timeStart),
    endTime: eventData.timeEnd ? combineDateTime(eventData.date, eventData.timeEnd) : undefined,
    reminders: eventData.reminders,
  };

  const res = await api.post('/schedule', payload);
  return res.data.data;
};

export const useCreateEventMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createEventAPI,
    onSuccess: () => {
      toast.success("Đã tạo sự kiện và cài đặt nhắc nhở!");
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['courses'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Lỗi khi tạo sự kiện");
    }
  });
};

type UpdateEventData = {
    id: string;
    data: any; 
    reminders?: any[]; 
}

// --- 2. UPDATE ---
const updateEventAPI = async ({ id, data, reminders }: UpdateEventData) => {
    const payload = {
        title: data.title,
        type: data.type,
        location: data.location,
        notes: data.notes,
        course: data.courseId,
        ...(data.date && data.timeStart && { 
            startTime: combineDateTime(data.date, data.timeStart) 
        }),
        ...(data.date && data.timeEnd && { 
            endTime: combineDateTime(data.date, data.timeEnd) 
        }),
        reminders: reminders
    };

    const res = await api.patch(`/schedule/${id}`, payload);
    return res.data.data;
};

export const useUpdateEventMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: updateEventAPI,
        onSuccess: () => {
            toast.success("Đã cập nhật sự kiện");
            queryClient.invalidateQueries({ queryKey: ['events'] });
            queryClient.invalidateQueries({ queryKey: ['courses'] });
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.message || "Lỗi cập nhật");
        }
    });
};

// --- 3.(Delete) ---
export const useDeleteEventMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: async (id: string) => {
        await api.delete(`/schedule/${id}`);
      },
      onSuccess: () => {
        toast.success("Đã xóa sự kiện");
        queryClient.invalidateQueries({ queryKey: ['events'] });
        queryClient.invalidateQueries({ queryKey: ['courses'] });
      },
      onError: (err: any) => {
        toast.error(err.response?.data?.message || "Lỗi xóa sự kiện");
      }
    });
};