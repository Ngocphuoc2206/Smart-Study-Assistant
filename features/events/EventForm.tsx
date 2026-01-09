// features/events/EventForm.tsx
"use client";

import React, { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { EventFormValues, eventFormSchema } from "./eventSchema";
// Import cả 2 hook TẠO và SỬA
import { useCreateEventMutation, useUpdateEventMutation } from "@/lib/hooks/useEventMutations"; 
import { useCourses } from "@/lib/hooks/useCourses";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { toast } from "sonner"; // Import toast

// Import UI
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea"; 
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { ReminderEditor } from "./ReminderEditor";
import { channel } from "diagnostics_channel";


// --- Mặc định nhắc nhở (Giữ nguyên) ---
const defaultReminders = {
  exam: [
    { offsetSec: -172800, channel: 'inapp' }, // 2 ngày
    { offsetSec: -86400, channel: 'inapp' },  // 1 ngày
    { offsetSec: -3600, channel: 'inapp' },   // 1 giờ
  ],
  assignment: [
    { offsetSec: -86400, channel: 'inapp' }, // 1 ngày
    { offsetSec: -3600, channel: 'inapp' },  // 1 giờ
  ],
  lecture: [],
  other: [],
};

interface EventFormProps {
  defaultValues?: Partial<EventFormValues>;
  // Prop này để nhận ID sự kiện (nếu là form Sửa)
  existingEventId?: string; 
  // Callback khi submit thành công (để đóng dialog/chuyển trang)
  onSuccess?: () => void; 
}

export default function EventForm({ defaultValues, existingEventId, onSuccess }: EventFormProps) {
  const form = useForm<EventFormValues>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: {
      ...defaultValues,
      // Cập nhật logic reminders: ưu tiên defaultValues, sau đó là type
      reminders: defaultValues?.reminders 
        ? defaultValues.reminders 
        : (defaultValues?.type ? defaultReminders[defaultValues.type] : []),
    },
  });

  // Khởi tạo cả 2 mutations
  const createMutation = useCreateEventMutation();
  const updateMutation = useUpdateEventMutation();
  
  const { data: courses, isLoading: isLoadingCourses } = useCourses();

  // Watch 'type' để cập nhật nhắc nhở mặc định
  const eventType = form.watch("type");
  useEffect(() => {
    // Chỉ set default nếu user chưa tự set
    if (eventType && !form.getValues("reminders")?.length && !defaultValues?.reminders?.length) {
      form.setValue("reminders", defaultReminders[eventType]);
    }
  }, [eventType, form, defaultValues]);

  // HÀM SUBMIT ĐÃ NÂNG CẤP
  const onSubmit = (data: EventFormValues) => {
    // Chuẩn bị dữ liệu
    const eventData = {
      type: data.type,
      title: data.title,
      courseId: data.courseId,
      date: format(data.date, "yyyy-MM-dd"), // Chuyển Date object thành string
      timeStart: data.timeStart,
      timeEnd: data.timeEnd,
      location: data.location,
      notes: data.notes, // Gửi notes
    };
    
    const reminders = data.reminders?.map(r =>({ offsetSec: r.offsetSec, channel: r.channel }));

    // Kiểm tra xem đây là TẠO MỚI hay CẬP NHẬT
    if (existingEventId) {
      // --- Logic SỬA ---
      // @ts-ignore // Bỏ qua lỗi type (vì eventData không đầy đủ 100% StudyEvent)
      updateMutation.mutate(
        { id: existingEventId, data: eventData, reminders },
        {
          onSuccess: (updatedEvent) => {
            // Hook 'useUpdateEventMutation' đã tự toast,
            // nhưng chúng ta có thể toast ở đây nếu muốn
            // toast.success(`Đã cập nhật: ${updatedEvent.title}`);
            form.reset();
            if (onSuccess) onSuccess(); // Gọi callback (để đóng Dialog)
          },
        }
      );
    } else {
      // --- Logic TẠO MỚI (như cũ) ---
      createMutation.mutate(
        { eventData, reminders },
        {
          onSuccess: () => {
            // Hook 'useCreateEventMutation' đã tự toast
            form.reset();
            if (onSuccess) onSuccess();
          },
        }
      );
    }
  };
  
  // Kiểm tra trạng thái loading của cả 2
  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Tiêu đề */}
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tiêu đề sự kiện *</FormLabel>
              <FormControl>
                <Input placeholder="Ví dụ: Thi cuối kỳ Trí tuệ nhân tạo" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Loại sự kiện */}
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Loại *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn loại sự kiện..." />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="exam">Kỳ thi</SelectItem>
                    <SelectItem value="assignment">Bài tập / Deadline</SelectItem>
                    <SelectItem value="lecture">Buổi học</SelectItem>
                    <SelectItem value="other">Khác</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Môn học */}
          <FormField
            control={form.control}
            name="courseId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Môn học (Tùy chọn)</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={isLoadingCourses ? "Đang tải..." : "Chọn môn học..."} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {courses?.map(course => (
                      <SelectItem key={course.id} value={course.id}>
                         <span className="flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: course.color }} />
                          {course.name}
                         </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Ngày */}
          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Ngày *</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP", { locale: vi })
                        ) : (
                          <span>Chọn ngày</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
          {/* Giờ bắt đầu */}
          <FormField
            control={form.control}
            name="timeStart"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Giờ bắt đầu *</FormLabel>
                <FormControl>
                  <Input type="time" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {/* Giờ kết thúc */}
          <FormField
            control={form.control}
            name="timeEnd"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Giờ kết thúc (Tùy chọn)</FormLabel>
                <FormControl>
                  <Input type="time" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        {/* Địa điểm */}
        <FormField
          control={form.control}
          name="location"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Địa điểm (Tùy chọn)</FormLabel>
              <FormControl>
                <Input placeholder="Ví dụ: Phòng A1.101" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* ✨ UPDATE: Thêm trường Ghi chú */}
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Ghi chú</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Ghi chú thêm về sự kiện..." 
                  className="resize-none" 
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        {/* Nhắc nhở */}
        {/*<FormField
          control={form.control}
          name="reminders"
          render={({ field }) => (
            <FormItem>
              <ReminderEditor 
                value={field.value || []} 
                onChange={field.onChange}
                eventDate={form.watch("date")}
                eventTime={form.watch("timeStart")}
              />
              <FormMessage />
            </FormItem>
          )}
        />*/}

        <Button 
          type="submit" 
          disabled={isLoading}
        >
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {/* Tên nút thay đổi động */}
          {isLoading ? "Đang lưu..." : (existingEventId ? "Cập nhật sự kiện" : "Lưu sự kiện")}
        </Button>
      </form>
    </Form>
  );
}