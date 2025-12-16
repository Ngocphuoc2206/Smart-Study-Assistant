// features/events/EventCard.tsx
"use client";

import { StudyEvent } from "@/lib/types";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Bell, Clock, Edit, MapPin, MoreVertical, Trash2 } from "lucide-react";
import { formatEventTime } from "@/lib/utils";
import { useAuthStore } from "@/lib/hooks/useAuthStore";

interface EventCardProps {
  event: StudyEvent;
  onEdit: (event: StudyEvent) => void;
  onDelete: (event: StudyEvent) => void;
}

export function EventCard({ event, onEdit, onDelete }: EventCardProps) {
  const eventDateTime = new Date(`${event.date}T${event.timeStart}`);
  const formattedDate = format(eventDateTime, "E, dd/MM/yyyy", { locale: vi });
  const timeRange = `${formatEventTime(event.timeStart)}${event.timeEnd ? ` - ${formatEventTime(event.timeEnd)}` : ''}`;
  // 👇 Lấy role của user
  const { user } = useAuthStore();
  // Kiểm tra: Chỉ hiện nút 3 chấm nếu là Giáo viên (teacher) hoặc Admin
  const canEdit = user?.role === 'teacher';
  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <div className="flex items-center gap-3">
          {/* Dot màu */}
          <span
            className="h-4 w-4 rounded-full flex-shrink-0"
            style={{ backgroundColor: event.course?.color || '#9ca3af' }}
            title={event.course?.name}
          />
          <div className="flex-1">
            <CardTitle className="text-lg">{event.title}</CardTitle>
            <CardDescription>{event.course?.name || "Sự kiện chung"}</CardDescription>
          </div>
        </div>

        {/* Actions (Yêu cầu 2) */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(event)}>
              <Edit className="mr-2 h-4 w-4" />
              Sửa
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onDelete(event)} className="text-destructive">
              <Trash2 className="mr-2 h-4 w-4" />
              Xóa
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      
      <CardContent className="pb-4 space-y-2">
        <div className="flex items-center text-sm">
          <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
          <span>{formattedDate}, {timeRange}</span>
        </div>
        {event.location && (
          <div className="flex items-center text-sm">
            <MapPin className="mr-2 h-4 w-4 text-muted-foreground" />
            <span>{event.location}</span>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="flex justify-between items-center">
        {/* Badge loại */}
        <Badge variant={event.type === 'exam' ? 'destructive' : 'secondary'} className="capitalize">
          {event.type === 'assignment' ? 'Bài tập' : event.type === 'exam' ? 'Thi' : 'Khác'}
        </Badge>
        
        {/* Nhắc nhở */}
        {event.reminders && event.reminders.length > 0 && (
          <div className="flex items-center text-xs text-muted-foreground gap-1">
            <Bell className="h-3.5 w-3.5" />
            {event.reminders.length} nhắc
          </div>
        )}
      </CardFooter>
    </Card>
  );
}