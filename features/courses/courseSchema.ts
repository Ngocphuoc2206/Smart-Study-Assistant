// features/courses/courseSchema.ts
import { z } from "zod";

export const courseFormSchema = z.object({
  name: z.string().min(3, { message: "Tên môn phải có ít nhất 3 ký tự." }),
  code: z.string().optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, {
    message: "Phải là một mã màu hex (ví dụ: #ef4444)"
  }),
});

export type CourseFormValues = z.infer<typeof courseFormSchema>;