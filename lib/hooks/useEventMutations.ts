"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { StudyEvent } from "@/lib/types";
import { NLPEntity } from "@/features/chat/mockNLP";
import { toast } from "sonner";
import { v4 as uuidv4 } from 'uuid';
// ✨ Import từ file mock data
import { mockEventsStore, mockCoursesStore } from '@/lib/mockData'; 

// --- HÀM TẠO ---
const mockCreateEvent = async (eventData: NLPEntity, reminders?: number[]): Promise<StudyEvent> => {
  await new Promise(res => setTimeout(res, 500));
  
  if (!eventData.title || !eventData.date || !eventData.timeStart) {
      throw new Error("Thiếu thông tin bắt buộc (title, date, timeStart).");
  }
  
  const newEvent: StudyEvent = {
    id: uuidv4(),
    type: eventData.type || 'other',
    title: eventData.title,
    date: eventData.date,
    timeStart: eventData.timeStart,
    timeEnd: eventData.timeEnd,
    location: eventData.location,
    // Liên kết course nếu có
    course: eventData.courseId ? mockCoursesStore[eventData.courseId] : undefined, // ✨ Dùng store
    reminders: reminders?.map(offset => ({ offsetSec: offset, channel: 'inapp' }))
  };
  
  // Thêm vào "database"
  mockEventsStore.push(newEvent); // ✨ Dùng store
  return newEvent;
};

export const useCreateEventMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ eventData, reminders }: { eventData: NLPEntity, reminders?: number[] }) => 
      mockCreateEvent(eventData, reminders),
    
    onSuccess: (newEvent) => {
      toast.success(`Đã tạo sự kiện: ${newEvent.title}`);
      // Invalidate tất cả query 'events'
      queryClient.invalidateQueries({ queryKey: ['events'] });
      // Cũng invalidate 'courses' vì số lượng event thay đổi
      queryClient.invalidateQueries({ queryKey: ['coursesWithCount'] });
    },
    onError: (error) => {
      toast.error(`Lỗi: ${error.message}`);
    }
  });
};


// --- HÀM SỬA ---
type UpdateEventData = {
    id: string;
    // Dùng Partial vì form có thể không gửi đủ 100%
    data: Partial<Omit<StudyEvent, 'id' | 'course' | 'reminders'> & { courseId?: string }>;
    reminders?: number[];
}

const mockUpdateEvent = async ({ id, data, reminders }: UpdateEventData): Promise<StudyEvent> => {
    await new Promise(res => setTimeout(res, 400));
    const eventIndex = mockEventsStore.findIndex(e => e.id === id); // ✨ Dùng store
    if (eventIndex === -1) throw new Error("Không tìm thấy sự kiện");
    
    const updatedEvent = { 
        ...mockEventsStore[eventIndex], // ✨ Dùng store
        ...data,
        // Cập nhật course
        course: data.courseId ? mockCoursesStore[data.courseId] : undefined, // ✨ Dùng store
        // Cập nhật reminders
        reminders: reminders ? reminders.map(offset => ({ offsetSec: offset, channel: 'inapp' })) : mockEventsStore[eventIndex].reminders
    };

    mockEventsStore[eventIndex] = updatedEvent; // ✨ Dùng store
    return updatedEvent;
};

export const useUpdateEventMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (updateData: UpdateEventData) => mockUpdateEvent(updateData),
        onSuccess: (updatedEvent) => {
            toast.success(`Đã cập nhật: ${updatedEvent.title}`);
            queryClient.invalidateQueries({ queryKey: ['events'] });
            queryClient.invalidateQueries({ queryKey: ['coursesWithCount'] });
        },
        onError: (error) => {
            toast.error(`Lỗi cập nhật: ${error.message}`);
        }
    });
};


// --- HÀM XÓA ---
const mockDeleteEvent = async (eventId: string): Promise<string> => {
  await new Promise(res => setTimeout(res, 400));
  const eventIndex = mockEventsStore.findIndex(e => e.id === eventId); // ✨ Dùng store
  if (eventIndex > -1) {
    mockEventsStore.splice(eventIndex, 1); // ✨ Dùng store
    return eventId;
  }
  throw new Error("Không tìm thấy sự kiện để xóa");
};

export const useDeleteEventMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (eventId: string) => mockDeleteEvent(eventId),
    onSuccess: () => {
      toast.success("Đã xóa sự kiện");
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['coursesWithCount'] });
    },
    onError: (error) => {
      toast.error(`Lỗi: ${error.message}`);
    }
  });
};