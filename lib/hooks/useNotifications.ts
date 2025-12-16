// lib/hooks/useNotifications.ts
"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import api from "@/lib/api"; // Import api client

export type NotificationItem = {
  id: string;
  eventId: string;
  eventTitle: string;
  channel: 'inapp' | 'email' | 'webpush';
  reminderTime: string;
  read: boolean;
};

// --- API FETCH (Sửa lại để không dùng mockEvents nữa) ---
const fetchNotifications = async (): Promise<{ upcoming: NotificationItem[], sent: NotificationItem[] }> => {
  // ⚠️ HIỆN TẠI: Trả về rỗng để App chạy được (vì chưa có API Notification)
  return { upcoming: [], sent: [] };

  /* 👉 KHI NÀO CÓ BACKEND NOTIFICATION, HÃY DÙNG CODE NÀY:
  
  const res = await api.get('/notifications'); 
  // Giả sử server trả về: { upcoming: [...], sent: [...] }
  return res.data.data;
  */
};

export const useNotifications = () => {
  return useQuery({
    queryKey: ['notifications'],
    queryFn: fetchNotifications,
    // Tắt refetch để đỡ tốn tài nguyên khi chưa có API
    enabled: true, 
  });
};

// --- MUTATIONS ---
export const useNotificationMutations = () => {
  const queryClient = useQueryClient();

  const markAsReadMutation = useMutation({
    mutationFn: async (id: string) => {
      // await api.put(`/notifications/${id}/read`); // Gọi API thật sau này
      console.log("Mark as read:", id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    }
  });

  const snoozeMutation = useMutation({
    mutationFn: async ({ id, duration }: { id: string, duration: 'hour' | 'day' }) => {
      // await api.post(`/notifications/${id}/snooze`, { duration }); // Gọi API thật sau này
      toast.info(`Đã dời lịch nhắc nhở (Giả lập)`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    }
  });
  
  return { markAsReadMutation, snoozeMutation };
};