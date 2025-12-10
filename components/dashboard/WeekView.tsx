"use client";

import React from 'react';
import { format, addDays, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, isToday, parseISO } from 'date-fns';
import { vi } from 'date-fns/locale';
import { StudyEvent } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface WeekViewProps {
  currentDate: Date; // Bất kỳ ngày nào trong tuần
  events: StudyEvent[]; // Sự kiện cho tuần này
  selectedDate: Date | undefined;
  onSelectDate: (date: Date) => void;
  onDateChange: (date: Date) => void; // Dùng để chuyển tuần
}

export function WeekView({ currentDate, events, selectedDate, onSelectDate, onDateChange }: WeekViewProps) {
  const weekStart = startOfWeek(currentDate, { locale: vi });
  const weekEnd = endOfWeek(currentDate, { locale: vi });
  const days = eachDayOfInterval({ start: weekStart, end: weekEnd });

  // Hàm điều hướng
  const prevWeek = () => onDateChange(addDays(weekStart, -7));
  const nextWeek = () => onDateChange(addDays(weekStart, 7));
  const goToToday = () => {
    const today = new Date();
    onDateChange(today);
    onSelectDate(today);
  };

  // Nhóm sự kiện theo ngày
  const eventsByDay: Record<string, StudyEvent[]> = {};
  for (const day of days) {
    const dayKey = format(day, 'yyyy-MM-dd');
    eventsByDay[dayKey] = events
      .filter(e => e.date === dayKey)
      .sort((a, b) => a.timeStart.localeCompare(b.timeStart));
  }

  return (
    <div className="flex flex-col">
      {/* Header Điều hướng Tuần */}
      <div className="flex items-center justify-between mb-4 px-2">
        <Button variant="outline" size="icon" onClick={prevWeek} aria-label="Tuần trước">
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="text-center">
          <h3 className="text-lg font-semibold">
            {format(weekStart, 'dd/MM')} - {format(weekEnd, 'dd/MM/yyyy')}
          </h3>
          <Button variant="link" size="sm" onClick={goToToday} className="h-auto p-0">
            Về hôm nay
          </Button>
        </div>
        <Button variant="outline" size="icon" onClick={nextWeek} aria-label="Tuần sau">
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Lưới Lịch Tuần */}
      <div className="grid grid-cols-7 border-t border-l border-border rounded-lg overflow-hidden">
        {days.map((day, index) => {
          const dayKey = format(day, 'yyyy-MM-dd');
          const isSelected = selectedDate && isSameDay(day, selectedDate);
          const isCurrentToday = isToday(day);

          return (
            <div
              key={day.toString()}
              onClick={() => onSelectDate(day)}
              className={cn(
                "relative min-h-[150px] border-r border-b border-border p-2 cursor-pointer transition-colors",
                isSelected ? "bg-primary/10" : "hover:bg-muted/50",
                isSameDay(day, new Date()) ? "bg-background" : "bg-muted/20"
              )}
            >
              {/* Tiêu đề ngày */}
              <div className={cn(
                "flex flex-col items-center mb-2",
                isSelected && "font-bold"
              )}>
                <span className="text-xs font-semibold text-muted-foreground uppercase">
                  {format(day, 'E', { locale: vi })}
                </span>
                <span
                  className={cn(
                    "text-lg w-8 h-8 flex items-center justify-center rounded-full",
                    isCurrentToday && "bg-primary text-primary-foreground",
                    isSelected && !isCurrentToday && "ring-2 ring-primary"
                  )}
                >
                  {format(day, 'd')}
                </span>
              </div>
              
              {/* Danh sách sự kiện */}
              <ScrollArea className="h-[100px] pr-2">
                <div className="space-y-1">
                  {eventsByDay[dayKey].map(event => (
                    <div 
                      key={event.id} 
                      className="flex items-center gap-1.5 p-1 rounded-sm" 
                      // Thêm 20% độ mờ vào màu
                      style={{ backgroundColor: `${event.course?.color || '#9ca3af'}33` }}
                    >
                      <span 
                        className="h-2 w-2 rounded-full flex-shrink-0" 
                        style={{ backgroundColor: event.course?.color || '#9ca3af' }} 
                      />
                      <p className="text-xs font-medium truncate" title={event.title}>
                        {event.title}
                      </p>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          );
        })}
      </div>
    </div>
  );
}