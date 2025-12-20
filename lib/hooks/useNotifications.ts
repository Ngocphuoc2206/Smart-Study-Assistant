// lib/hooks/useNotifications.ts
"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import api from "@/lib/api"; // Import api client

export type NotificationItem = {
  id: string;
  eventId: string;
  eventTitle: string;
  channel: "inapp" | "email";
  reminderTime: string;
  read: boolean;
};

const fetchNotifications = async (): Promise<{
  upcoming: NotificationItem[];
  sent: NotificationItem[];
}> => {
  const res = await api.get("/notifications");
  return res.data.data;
};

export const useNotifications = () => {
  return useQuery({
    queryKey: ["notifications"],
    queryFn: fetchNotifications,
    enabled: true,
  });
};

// --- MUTATIONS ---
export const useNotificationMutations = () => {
  const queryClient = useQueryClient();

  const markAsReadMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.patch(`/notifications/${id}/read`);
      console.log("Mark as read:", id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const snoozeMutation = useMutation({
    mutationFn: async ({
      id,
      duration,
    }: {
      id: string;
      duration: "hour" | "day";
    }) => {
      await api.patch(`/notifications/${id}/snooze`, { duration });
      toast.info(`Đã dời lịch nhắc nhở (Giả lập)`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  return { markAsReadMutation, snoozeMutation };
};
