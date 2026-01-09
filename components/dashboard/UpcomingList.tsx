// components/dashboard/UpcomingList.tsx
"use client";

import { StudyEvent } from "@/lib/types";
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, CalendarClock, CalendarOff } from "lucide-react";

interface UpcomingListProps {
  events: StudyEvent[] | undefined;
  isLoading: boolean;
  isError: boolean;
}

export function UpcomingList({ events, isLoading, isError }: UpcomingListProps) {
  
  const renderContent = () => {
    // 1. Trạng thái Loading
    if (isLoading) {
      return (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center space-x-3">
              <Skeleton className="h-3 w-3 rounded-full" />
              <div className="space-y-1.5 w-full">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      );
    }

    // 2. Trạng thái Lỗi
    if (isError) {
      return (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Lỗi</AlertTitle>
          <AlertDescription>
            Không thể tải sự kiện sắp tới. Vui lòng thử lại.
          </AlertDescription>
        </Alert>
      );
    }

    // 3. Trạng thái Trống
    if (!events || events.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center text-center text-muted-foreground py-6">
          <CalendarOff className="h-10 w-10 mb-2" />
          <p className="font-medium">Không có gì sắp đến</p>
          <p className="text-sm">Bạn rảnh tay rồi!</p>
        </div>
      );
    }

    // 4. Trạng thái có dữ liệu
    return (
      <ul className="space-y-4">
        {events.map((event) => (
          <EventItem key={event.id} event={event} />
        ))}
      </ul>
    );
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <CalendarClock className="h-5 w-5" />
          Tổng quan sự kiện
        </CardTitle>
      </CardHeader>
      <CardContent>{renderContent()}</CardContent>
    </Card>
  );
}

// Component phụ cho mỗi item
function EventItem({ event }: { event: StudyEvent }) {
  const eventDateTime = new Date(`${event.date}T${event.timeStart}`);
  const formattedDate = format(eventDateTime, "E, dd/MM", { locale: vi });
  const formattedTime = format(eventDateTime, "HH:mm");

  return (
    <li className="flex items-start space-x-3 group cursor-pointer">
      {/* Dot màu (Yêu cầu 6) */}
      <span
        className="mt-1.5 h-3 w-3 rounded-full flex-shrink-0"
        style={{ backgroundColor: event.course?.color || '#9ca3af' }} // gray-400
        title={event.course?.name}
      />
      
      <div className="flex-1">
        <p className="font-medium leading-tight group-hover:underline">
          {event.title}
        </p>
        <p className="text-sm text-muted-foreground">
          {formattedTime} - {formattedDate}
        </p>
      </div>
      
      <Badge 
        variant={event.type === 'exam' ? 'destructive' : 'secondary'} 
        className="capitalize flex-shrink-0"
      >
        {event.type === 'assignment' ? 'Bài tập' : event.type === 'exam' ? 'Thi' : 'Khác'}
      </Badge>
    </li>
  );
}