// components/dashboard/CalendarWidget.tsx
"use client";

import React, { useState, useMemo } from "react";
import { StudyEvent } from "@/lib/types";
import { formatEventTime } from "@/lib/utils";
import { useEvents } from "@/lib/hooks/useEvents";
import { addMonths, endOfMonth, endOfWeek, startOfMonth, startOfToday, startOfWeek, format } from "date-fns";
import { vi } from "date-fns/locale";
import { DayContentProps } from "react-day-picker";

// Import UI từ shadcn
import { Calendar } from "@/components/ui/calendar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

// Helper lấy khoảng thời gian
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
  // `currentDate` dùng để điều khiển tháng/tuần đang xem (cho query)
  const [currentDate, setCurrentDate] = useState(new Date()); 
  // `selectedDate` là ngày user click vào
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(startOfToday());

  // Xác định khoảng thời gian query dựa trên view
  const range = useMemo(() => {
    return view === 'month' ? getMonthRange(currentDate) : getWeekRange(currentDate);
  }, [view, currentDate]);

  const { data: events, isLoading, isError } = useEvents(range);

  // Lọc sự kiện cho ngày được chọn
  const eventsForSelectedDay = useMemo(() => {
    if (!selectedDate || !events) return [];
    // ✅ ĐÃ SỬA: Dùng 'format' để giữ đúng ngày local
    const selectedISO = format(selectedDate, "yyyy-MM-dd");
    return events.filter(e => e.date === selectedISO);
  }, [selectedDate, events]);

  // Xử lý khi đổi tháng/tuần trên lịch
  const handleMonthChange = (month: Date) => {
    setCurrentDate(month);
    // Khi đổi tháng, tự động chọn ngày 1
    if (view === 'month') {
      setSelectedDate(month);
    } else {
      setSelectedDate(startOfWeek(month, { locale: vi }));
    }
  };

  // Custom component để render dot (Yêu cầu 6)
  const DayWithDot = ({ date, displayMonth }: DayContentProps) => {
    // Chỉ render dot cho các ngày trong tháng hiện tại
    if (date.getMonth() !== displayMonth.getMonth()) {
      return <>{date.getDate()}</>;
    }
    
    const dayISO = date.toISOString().split('T')[0];
    const eventsForDay = events?.filter(e => e.date === dayISO) || [];
    
    return (
      <div className="relative w-full h-full flex items-center justify-center">
        {date.getDate()}
        {eventsForDay.length > 0 && (
          <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex space-x-0.5">
            {eventsForDay.slice(0, 2).map((e) => (
               <span key={e.id} className="h-1 w-1 rounded-full" style={{ backgroundColor: e.course?.color || '#9ca3af' }} />
            ))}
            {eventsForDay.length > 2 && <span className="h-1 w-1 rounded-full bg-gray-300" />}
          </div>
        )}
      </div>
    );
  };
  
  // shadcn/ui <Calendar> không có view "tuần" thực thụ.
  // Chúng ta sẽ dùng Tabs để *thay đổi query* (theo tuần/tháng)
  // và hiển thị lịch tháng (vì nó trực quan nhất).
  const calendarView = (
    <Calendar
      mode="single"
      selected={selectedDate}
      onSelect={setSelectedDate}
      month={currentDate}
      onMonthChange={handleMonthChange}
      locale={vi}
      className="rounded-md"
      components={{ DayContent: DayWithDot }}
    />
  );

  return (
    <Card>
      <CardContent className="p-4 md:p-6">
        <Tabs value={view} onValueChange={(v) => setView(v as "month" | "week")}>
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="month">Lịch tháng</TabsTrigger>
            <TabsTrigger value="week">Lịch tuần</TabsTrigger>
          </TabsList>
          {/* Chúng ta chỉ render 1 Calendar, việc đổi Tab chỉ trigger đổi data (range) */}
          {calendarView}
        </Tabs>
        
        {/* Danh sách sự kiện cho ngày đã chọn */}
        <div className="mt-4 border-t pt-4">
          <h4 className="font-semibold mb-3">
            Sự kiện ngày {selectedDate ? format(selectedDate, "dd/MM/yyyy", { locale: vi }) : '...'}
          </h4>
          
          {isLoading && <Skeleton className="h-10 w-full" />}
          
          {isError && (
            <p className="text-sm text-destructive">Lỗi khi tải sự kiện.</p>
          )}

          {!isLoading && !isError && eventsForSelectedDay.length === 0 && (
            <p className="text-sm text-muted-foreground">Không có sự kiện nào.</p>
          )}

          {!isLoading && !isError && eventsForSelectedDay.length > 0 && (
            <ul className="space-y-2">
              {eventsForSelectedDay.map(event => (
                <EventRow key={event.id} event={event} />
              ))}
            </ul>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Component phụ cho item bên dưới Calendar
function EventRow({ event }: { event: StudyEvent }) {
   return (
    <li className="flex items-center space-x-2 p-2 rounded-md hover:bg-muted cursor-pointer"
        // onClick={() => onSelectEvent(event)} // Sẽ thêm sau
    >
      {event.course && (
        <span
          className="h-2.5 w-2.5 rounded-full flex-shrink-0"
          style={{ backgroundColor: event.course.color }}
        />
      )}
      {!event.course && <span className="h-2.5 w-2.5 rounded-full bg-gray-400 flex-shrink-0" />}

      <div className="flex-1">
        <p className="font-medium text-sm leading-tight">{event.title}</p>
        <p className="text-xs text-muted-foreground">
          {formatEventTime(event.timeStart)}
          {event.timeEnd ? ` - ${formatEventTime(event.timeEnd)}` : ''}
          {event.location ? ` @ ${event.location}` : ''}
        </p>
      </div>
      <Badge 
        variant={event.type === 'exam' ? 'destructive' : 'secondary'} 
        className="capitalize h-5 text-xs px-1.5"
      >
         {event.type === 'assignment' ? 'Bài tập' : event.type === 'exam' ? 'Thi' : 'Khác'}
      </Badge>
    </li>
   );
}