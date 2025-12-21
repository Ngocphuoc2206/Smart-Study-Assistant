// features/events/eventSchema.ts
import { z } from "zod";

export const eventFormSchema = z.object({
  type: z.enum(['exam', 'assignment', 'lecture', 'other'], {
    required_error: "Loại sự kiện là bắt buộc.",
  }),
  title: z.string().min(3, {
    message: "Tiêu đề phải có ít nhất 3 ký tự.",
  }),
  courseId: z.string().optional(),
  
  // Chúng ta dùng 'date' (kiểu Date) cho Calendar, 
  // và 'timeStart' (string 'HH:mm') cho Input
  date: z.date({
    required_error: "Ngày diễn ra là bắt buộc.",
  }),
  timeStart: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: "Giờ bắt đầu không hợp lệ (HH:mm)."
  }),
  timeEnd: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: "Giờ kết thúc không hợp lệ (HH:mm)."
  }).optional().or(z.literal('')), // Cho phép rỗng
  
  location: z.string().optional(),
  notes: z.string().max(1000, "Ghi chú không được quá 1000 ký tự").optional(),
  reminders: z.array(z.object({
    offsetSec: z.number(),
  channel: z.enum(['inapp', 'email', 'webpush'] as const),
  })).optional(),
});

export type EventFormValues = z.infer<typeof eventFormSchema>;