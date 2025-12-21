// features/courses/courseSchema.ts
import { Description } from "@radix-ui/react-dialog";
import { z } from "zod";

export const courseFormSchema = z.object({
  name: z.string().min(3, { message: "Tên môn phải có ít nhất 3 ký tự." }),
  code: z.string().optional(),
  description: z.string()
    .min(1, { message: "Mô tả là bắt buộc." })
    .max(1000, { message: "Mô tả không được quá 1000 ký tự." }),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, {
    message: "Phải là một mã màu hex (ví dụ: #ef4444)"
  }),
});

export type CourseFormValues = z.infer<typeof courseFormSchema>;