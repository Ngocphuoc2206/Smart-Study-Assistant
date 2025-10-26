// lib/hooks/useNotifications.ts
"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { mockEvents } from "./useEvents";
import { StudyEvent } from "@/lib/types";
import { addHours, addDays, parseISO, addSeconds } from "date-fns";
import { v4 as uuidv4 } from 'uuid';
import { toast } from "sonner";

// Định nghĩa một thông báo
export type NotificationItem = {
  id: string; // ID của thông báo
  eventId: string; // ID của sự kiện gốc
  eventTitle: string;
  channel: 'inapp' | 'email' | 'webpush';
  reminderTime: string; // ISO String
  read: boolean;
};

// "Database" giả cho thông báo
let mockNotifications: NotificationItem[] = [];

// Hàm khởi tạo/đồng bộ hóa thông báo từ mockEvents
const syncNotifications = () => {
  const now = new Date();
  mockEvents.forEach(event => {
    if (event.reminders) {
      event.reminders.forEach(reminder => {
        const eventTime = new Date(`${event.date}T${event.timeStart}`);
        const reminderTime = addSeconds(eventTime, reminder.offsetSec);
        
        // Tạo ID duy nhất cho cặp (event.id, reminder.offsetSec)
        const notifId = `notif-${event.id}-${reminder.offsetSec}`;
        
        // Chỉ thêm nếu chưa tồn tại
        if (!mockNotifications.find(n => n.id === notifId)) {
          mockNotifications.push({
            id: notifId,
            eventId: event.id,
            eventTitle: event.title,
            channel: reminder.channel,
            reminderTime: reminderTime.toISOString(),
            read: false,
          });
        }
      });
    }
  });
  
  // Sắp xếp
  mockNotifications.sort((a, b) => new Date(a.reminderTime).getTime() - new Date(b.reminderTime).getTime());
};

// Chạy 1 lần đầu
syncNotifications();

// --- Hook Lấy Thông Báo ---
const fetchNotifications = async (): Promise<{ upcoming: NotificationItem[], sent: NotificationItem[] }> => {
  await new Promise(res => setTimeout(res, 300));
  
  // (Đồng bộ lại mỗi lần fetch)
  syncNotifications(); 

  const now = new Date();
  const upcoming: NotificationItem[] = [];
  const sent: NotificationItem[] = [];

  mockNotifications.forEach(notif => {
    // "Sắp đến" = chưa đọc VÀ thời gian nhắc > hiện tại
    if (!notif.read && parseISO(notif.reminderTime) > now) {
      upcoming.push(notif);
    } else {
    // "Đã gửi" = đã đọc HOẶC đã qua
      sent.push(notif);
    }
  });

  // Sắp xếp 'sent' mới nhất lên đầu
  sent.sort((a, b) => new Date(b.reminderTime).getTime() - new Date(a.reminderTime).getTime());

  return { upcoming, sent };
};

export const useNotifications = () => {
  return useQuery({
    queryKey: ['notifications'],
    queryFn: fetchNotifications,
  });
};

// --- Mutations (Đánh dấu đã xem, dời lịch) ---
export const useNotificationMutations = () => {
  const queryClient = useQueryClient();

  // Đánh dấu đã xem
  const markAsReadMutation = useMutation({
    mutationFn: async (id: string) => {
      const notif = mockNotifications.find(n => n.id === id);
      if (notif) notif.read = true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    }
  });

  // Dời lịch (+1h, +1d)
  const snoozeMutation = useMutation({
    mutationFn: async ({ id, duration }: { id: string, duration: 'hour' | 'day' }) => {
      const notif = mockNotifications.find(n => n.id === id);
      if (notif) {
        let newTime;
        if (duration === 'hour') {
          newTime = addHours(parseISO(notif.reminderTime), 1);
        } else {
          newTime = addDays(parseISO(notif.reminderTime), 1);
        }
        notif.reminderTime = newTime.toISOString();
        toast.info(`Đã dời nhắc nhở "${notif.eventTitle}"`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    }
  });
  
  return { markAsReadMutation, snoozeMutation };
};