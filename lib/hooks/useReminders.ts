"use client";

import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";

export interface ReminderData {
  _id: string;
  user: string;
  schedule?: string | { _id: string }; // Có thể là ID hoặc Object populate
  task?: string;
  title: string;
  remindAt: string; // Backend trả về Date string
  remindType: "TASK" | "SCHEDULE";
  channel: "Email" | "In-app";
  status: "PENDING" | "DONE" | "OVERDUE";
  isSent: boolean;
}

// Hàm fetch API
const fetchReminders = async (): Promise<ReminderData[]> => {
  // Lấy tất cả nhắc nhở PENDING (chưa gửi)
  // Bạn có thể tùy chỉnh params from/to nếu muốn chỉ lấy trong tháng hiện tại
  const res = await api.get("/reminders", {
    params: {
      status: "PENDING", 
    },
  });
  return res.data.data;
};

export const useReminders = () => {
  return useQuery({
    queryKey: ["reminders"],
    queryFn: fetchReminders,
    // Refetch mỗi 1 phút để cập nhật trạng thái nhắc nhở nếu cần
    refetchInterval: 60000, 
  });
};