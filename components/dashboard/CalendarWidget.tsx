"use client";

import React, { useState, useMemo } from "react";
import { StudyEvent } from "@/lib/types";
import { formatEventTime } from "@/lib/utils";
import { useEvents } from "@/lib/hooks/useEvents"; // Hook từ P1
import {
  endOfMonth,
  endOfWeek,
  startOfMonth,
  startOfToday,
  startOfWeek,
  format,
} from "date-fns";
import { vi } from "date-fns/locale";

// Import UI
import { Calendar } from "@/components/ui/calendar";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

// ✨ Import component WeekView mới
import { WeekView } from "./WeekView";

// Helper lấy khoảng thời gian (giữ nguyên)
const getWeekRange = (date: Date) => ({
  from: startOfWeek(date, { locale: vi }),
  to: endOfWeek(date, { locale: vi }),
});
const getMonthRange = (date: Date) => ({
  from: startOfMonth(date),
  to: endOfMonth(date),
});

export function CalendarWidget() {
  const [view, setView] = useState<"month" | "week">("month");
  // 'currentDate' giờ đây là ngày đại diện cho tháng (view=month) hoặc tuần (view=week)
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    startOfToday()
  );

  // Xác định khoảng thời gian query dựa trên view
  const range = useMemo(() => {
    return view === "month"
      ? getMonthRange(currentDate)
      : getWeekRange(currentDate);
  }, [view, currentDate]);

  // Hook 'useEvents' (từ P1) sẽ tự động fetch lại khi 'range' thay đổi
  const { data: events, isLoading, isError } = useEvents(range);

  // Lọc sự kiện cho danh sách bên dưới (luôn hoạt động)
  const eventsForSelectedDay = useMemo(() => {
    if (!selectedDate || !events) return [];
    const selectedISO = format(selectedDate, "yyyy-MM-dd");
    // Lọc từ 'events' (đã là dữ liệu của tuần hoặc tháng)
    return events.filter((e: { date: string }) => e.date === selectedISO);
  }, [selectedDate, events]);

  // Xử lý khi đổi tháng/tuần trên lịch
  const handleDateChange = (date: Date) => {
    setCurrentDate(date);
    // Tự động chọn ngày đầu tiên của view mới
    if (view === "month") {
      setSelectedDate(startOfMonth(date));
    } else {
      setSelectedDate(startOfWeek(date, { locale: vi }));
    }
  };

  // Xử lý khi chỉ đổi ngày chọn
  const handleSelectDate = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
    }
  };

  // --- Component Lịch Tháng ---
  const calendarMonthView = (
    <Calendar
      mode="single"
      selected={selectedDate}
      onSelect={handleSelectDate}
      month={currentDate}
      onMonthChange={handleDateChange} // Dùng handler chung
      locale={vi}
      className="rounded-md border"
      // components={{ DayContent: DayWithDot }} // Tắt để tránh lỗi logic
    />
  );

  const calendarWeekView = (
    <WeekView
      currentDate={currentDate}
      events={events || []}
      selectedDate={selectedDate}
      onSelectDate={handleSelectDate}
      onDateChange={handleDateChange} // Dùng handler chung
    />
  );

  return (
    <Card>
      <CardContent className="p-4 md:p-6">
        <Tabs
          value={view}
          onValueChange={(v) => setView(v as "month" | "week")}
        >
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="month">Lịch tháng</TabsTrigger>
            <TabsTrigger value="week">Lịch tuần</TabsTrigger>
          </TabsList>

          {isLoading && <Skeleton className="h-[300px] w-full" />}
          {!isLoading && view === "month" ? calendarMonthView : null}
          {!isLoading && view === "week" ? calendarWeekView : null}
        </Tabs>

        {/* Danh sách sự kiện cho ngày đã chọn (phần này giữ nguyên) */}
        <div className="mt-4 border-t pt-4">
          <h4 className="font-semibold mb-3">
            Sự kiện ngày{" "}
            {selectedDate
              ? format(selectedDate, "dd/MM/yyyy", { locale: vi })
              : "..."}
          </h4>

          {isLoading && <Skeleton className="h-10 w-full" />}

          {isError && (
            <p className="text-sm text-destructive">Lỗi khi tải sự kiện.</p>
          )}

          {!isLoading && !isError && eventsForSelectedDay.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Không có sự kiện nào.
            </p>
          )}

          {!isLoading && !isError && eventsForSelectedDay.length > 0 && (
            <ul className="space-y-2">
              {eventsForSelectedDay.map((event: any) => (
                <EventRow key={event.id} event={event} />
              ))}
            </ul>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Component phụ cho item bên dưới Calendar (giữ nguyên)
function EventRow({ event }: { event: StudyEvent }) {
  return (
    <li className="flex items-center space-x-2 p-2 rounded-md hover:bg-muted cursor-pointer">
      {event.course && (
        <span
          className="h-2.5 w-2.5 rounded-full shrink-0"
          style={{ backgroundColor: event.course.color }}
        />
      )}
      {!event.course && (
        <span className="h-2.5 w-2.5 rounded-full bg-gray-400 shrink-0" />
      )}

      <div className="flex-1">
        <p className="font-medium text-sm leading-tight">{event.title}</p>
        <p className="text-xs text-muted-foreground">
          {formatEventTime(event.timeStart)}
          {event.timeEnd ? ` - ${formatEventTime(event.timeEnd)}` : ""}
          {event.location ? ` @ ${event.location}` : ""}
        </p>
      </div>
      <Badge
        variant={event.type === "exam" ? "destructive" : "secondary"}
        className="capitalize h-5 text-xs px-1.5"
      >
        {event.type === "assignment"
          ? "Bài tập"
          : event.type === "exam"
          ? "Thi"
          : "Khác"}
      </Badge>
    </li>
  );
}
