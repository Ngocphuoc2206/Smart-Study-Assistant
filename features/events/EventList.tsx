/* eslint-disable @typescript-eslint/no-explicit-any */
// features/events/EventList.tsx
"use client";

import React, { useMemo, useState } from "react";
import { EventFilters, useInfiniteEvents } from "@/lib/hooks/useEvents";
import { useReminders } from "@/lib/hooks/useReminders";
import { EventCard } from "./EventCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
// Import form
import EventForm from "./EventForm";
import { EventFormValues } from "./eventSchema";
import { StudyEvent } from "@/lib/types";
// Import hook Sửa/Xóa
import { useDeleteEventMutation } from "@/lib/hooks/useEventMutations";
import { useDebounce } from "use-debounce";
import {
  addMonths,
  endOfToday,
  startOfToday,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  parseISO,
} from "date-fns";
import { vi } from "date-fns/locale";
import { AlertCircle, Loader2, Search, CalendarOff } from "lucide-react";

// Định nghĩa các dải ngày
const dateRanges = {
  today: { from: startOfToday(), to: endOfToday(), label: "Hôm nay" },
  this_week: {
    from: startOfWeek(new Date(), { locale: vi }),
    to: endOfWeek(new Date(), { locale: vi }),
    label: "Tuần này",
  },
  this_month: {
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
    label: "Tháng này",
  },
  next_month: {
    from: startOfMonth(addMonths(new Date(), 1)),
    to: endOfMonth(addMonths(new Date(), 1)),
    label: "Tháng sau",
  },
};

export default function EventList() {
  // --- State cho Bộ lọc (Yêu cầu 1) ---
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch] = useDebounce(searchTerm, 500);
  const [rangeKey, setRangeKey] =
    useState<keyof typeof dateRanges>("this_month");
  const [type, setType] = useState<EventFilters["type"]>("all");
  const [sort, setSort] = useState<EventFilters["sort"]>("asc");

  // --- Lấy dữ liệu (Yêu cầu 4: Phân trang) ---
  const filters: EventFilters = {
    from: dateRanges[rangeKey].from,
    to: dateRanges[rangeKey].to,
    search: debouncedSearch,
    type: type,
    sort: sort,
  };
  const {
    data,
    error,
    isLoading,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteEvents(filters);

  const { data: allReminders } = useReminders();

  // --- State cho Modals (Yêu cầu 2: Sửa/Xóa) ---
  const [selectedEvent, setSelectedEvent] = useState<StudyEvent | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  // --- Mutations (Xóa) ---
  const deleteMutation = useDeleteEventMutation();
  // (Update mutation đã nằm trong EventForm)

  const handleEditClick = (event: StudyEvent) => {
    setSelectedEvent(event);
    setIsEditOpen(true);
  };

  const handleDeleteClick = (event: StudyEvent) => {
    setSelectedEvent(event);
    setIsDeleteOpen(true);
  };

  const confirmDelete = () => {
    if (selectedEvent) {
      deleteMutation.mutate(selectedEvent.id, {
        onSuccess: () => setIsDeleteOpen(false),
      });
    }
  };

  // Hàm helper: Chuyển StudyEvent sang EventFormValues (cho defaultValues)
  const getFormValues = (
    event: StudyEvent | null
  ): Partial<EventFormValues> | undefined => {
    if (!event) return undefined;
    return {
      ...event,
      // Chuyển '2025-10-25' (string) sang Date object
      date: parseISO(event.date),
      notes: event.notes,
      reminders: event.reminders || [],
    };
  };

  const eventsWithReminders = useMemo(() => {
    const rawEvents = data?.pages.flatMap((page) => page.data) || [];

    const safeReminders = Array.isArray(allReminders) ? allReminders : [];

    return rawEvents.map((event) => {
      const myReminders = safeReminders.filter((r: any) => {
        const scheduleId =
          typeof r.schedule === "string" ? r.schedule : r.schedule?._id;
        return scheduleId?.toString() === event.id?.toString(); //event
      });

      const mappedReminders = myReminders.map((r: any) => ({
        offsetSec:
          (new Date(r.remindAt).getTime() -
            new Date(`${event.date}T${event.timeStart}`).getTime()) /
          1000,
        channel: r.channel === "In-app" ? "inapp" : "email",
      }));

      return {
        ...event,
        reminders:
          mappedReminders.length > 0 ? mappedReminders : event.reminders,
      };
    });
  }, [data, allReminders]);

  // --- Render Nội dung ---
  const renderContent = () => {
    // 1. Loading
    if (isLoading) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-[200px] w-full" />
          ))}
        </div>
      );
    }

    // 2. Lỗi
    if (isError) {
      return (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Lỗi</AlertTitle>
          <AlertDescription>{error.message}</AlertDescription>
        </Alert>
      );
    }

    const allEvents = eventsWithReminders;

    // 3. Trống (Yêu cầu 3)
    if (allEvents.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center text-center text-muted-foreground py-16">
          <CalendarOff className="h-16 w-16 mb-4" />
          <p className="text-lg font-medium">Không tìm thấy sự kiện</p>
          <p>Chưa có sự kiện nào trong khoảng thời gian này.</p>
        </div>
      );
    }

    // 4. Có dữ liệu
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {allEvents.map((event) => (
          <EventCard
            key={event.id}
            event={event}
            onEdit={handleEditClick}
            onDelete={handleDeleteClick}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Toolbar (Yêu cầu 1) */}
      <div className="flex flex-col md:flex-row gap-2 p-4 border rounded-lg bg-card">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Tìm theo tiêu đề, môn học..."
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          {/* Lọc theo Dải ngày */}
          <Select value={rangeKey} onValueChange={(v) => setRangeKey(v as any)}>
            <SelectTrigger className="w-full md:w-[150px]">
              <SelectValue placeholder="Dải ngày" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(dateRanges).map(([key, { label }]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Lọc theo Loại */}
          <Select value={type} onValueChange={(v) => setType(v as any)}>
            <SelectTrigger className="w-full md:w-[130px]">
              <SelectValue placeholder="Loại" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả loại</SelectItem>
              <SelectItem value="exam">Kỳ thi</SelectItem>
              <SelectItem value="assignment">Bài tập</SelectItem>
              <SelectItem value="lecture">Buổi học</SelectItem>
              <SelectItem value="other">Khác</SelectItem>
            </SelectContent>
          </Select>

          {/* Sắp xếp */}
          <Select value={sort} onValueChange={(v) => setSort(v as any)}>
            <SelectTrigger className="w-full md:w-[120px]">
              <SelectValue placeholder="Sắp xếp" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="asc">Gần nhất</SelectItem>
              <SelectItem value="desc">Xa nhất</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Danh sách */}
      <div className="space-y-4">
        {renderContent()}

        {/* Nút Load More (Yêu cầu 4) */}
        {hasNextPage && (
          <div className="text-center">
            <Button
              onClick={() => fetchNextPage()}
              disabled={isFetchingNextPage}
            >
              {isFetchingNextPage && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Tải thêm
            </Button>
          </div>
        )}
      </div>

      {/* Dialog Sửa Sự kiện (ĐÃ CẬP NHẬT) */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Sửa sự kiện</DialogTitle>
          </DialogHeader>
          {/* Render Form với đúng props */}
          <EventForm
            key={selectedEvent?.id} // Dùng key để reset form
            existingEventId={selectedEvent?.id}
            defaultValues={getFormValues(selectedEvent)}
            onSuccess={() => setIsEditOpen(false)} // Tự động đóng
          />
        </DialogContent>
      </Dialog>

      {/* Dialog Xóa Sự kiện */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Bạn có chắc chắn muốn xóa?</AlertDialogTitle>
            <AlertDialogDescription>
              Sự kiện &quot;{selectedEvent?.title}&quot; sẽ bị xóa vĩnh viễn.
              Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={deleteMutation.isPending}
              className="bg-destructive hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? "Đang xóa..." : "Xóa"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
