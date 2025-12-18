// features/courses/CourseForm.tsx
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { CourseFormValues, courseFormSchema } from "./courseSchema";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Loader2 } from "lucide-react";
import { Course } from "@/lib/types";

// Các màu gợi ý
const COLOR_SWATCHES = [
  '#ef4444', // red
  '#f97316', // orange
  '#eab308', // yellow
  '#22c55e', // green
  '#06b6d4', // cyan
  '#3b82f6', // blue
  '#8b5cf6', // violet
  '#ec4899', // pink
];

interface CourseFormProps {
  defaultValues?: Partial<Course>;
  onSubmit: (data: CourseFormValues) => void;
  isLoading: boolean;
}

export default function CourseForm({ defaultValues, onSubmit, isLoading }: CourseFormProps) {
  const form = useForm<CourseFormValues>({
    resolver: zodResolver(courseFormSchema),
    defaultValues: {
      name: defaultValues?.name || "",
      code: defaultValues?.code || "",
      description: defaultValues?.description || "",
      color: defaultValues?.color || "#ef4444",
    },
  });
  
  const selectedColor = form.watch("color");

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/*-- Name course --*/}
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tên môn học *</FormLabel>
              <FormControl>
                <Input placeholder="Ví dụ: Trí tuệ nhân tạo" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {/*-- Code --*/}
        <FormField
          control={form.control}
          name="code"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Mã môn học (Tùy chọn)</FormLabel>
              <FormControl>
                <Input placeholder="Ví dụ: IT4040" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {/*-- Description --*/}
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Mô tả môn học *</FormLabel>
              <FormControl>
                <textarea 
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="Nhập mô tả về môn học..."
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="color"
          render={({ field }) => (
            <FormItem className="space-y-3">
              <FormLabel>Màu sắc *</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  className="flex flex-wrap gap-3"
                >
                  {COLOR_SWATCHES.map(color => (
                    <FormItem key={color} className="flex items-center">
                      <FormControl>
                        <RadioGroupItem 
                          value={color} 
                          id={color} 
                          className="sr-only" 
                        />
                      </FormControl>
                      <FormLabel 
                        htmlFor={color}
                        className="h-8 w-8 rounded-full border-2 cursor-pointer"
                        style={{ 
                          backgroundColor: color,
                          borderColor: selectedColor === color ? color : 'transparent'
                        }}
                      />
                    </FormItem>
                  ))}
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <Button type="submit" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isLoading ? "Đang lưu..." : "Lưu"}
        </Button>
      </form>
    </Form>
  );
}