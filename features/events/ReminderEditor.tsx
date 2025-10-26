// features/events/ReminderEditor.tsx
//Đây là component con để quản lý việc "Thêm nhắc".
"use client";

import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BellPlus, Clock, X } from "lucide-react";
import { format, addSeconds } from "date-fns";
import { vi } from "date-fns/locale";

type Reminder = { offsetSec: number; channel: 'inapp' };
interface ReminderEditorProps {
  value: Reminder[];
  onChange: (reminders: Reminder[]) => void;
  // Nhận ngày/giờ để hiển thị preview
  eventDate: Date | undefined;
  eventTime: string;
}

const UNITS: Record<string, number> = {
  'phút': 60,
  'giờ': 3600,
  'ngày': 86400,
};

export function ReminderEditor({ value = [], onChange, eventDate, eventTime }: ReminderEditorProps) {
  const [num, setNum] = useState(1);
  const [unit, setUnit] = useState('giờ');

  const handleAddReminder = () => {
    const offsetSec = -num * (UNITS[unit] || 3600);
    if (value.find(r => r.offsetSec === offsetSec)) return; // Tránh trùng lặp
    onChange([...value, { offsetSec, channel: 'inapp' }]);
  };

  const handleRemoveReminder = (offset: number) => {
    onChange(value.filter(r => r.offsetSec !== offset));
  };

  // Tính toán preview
  const getPreview = (offsetSec: number): string => {
    if (!eventDate || !eventTime) return "Chọn ngày/giờ sự kiện trước";
    try {
      const [h, m] = eventTime.split(':');
      const baseDate = new Date(eventDate);
      baseDate.setHours(parseInt(h), parseInt(m));
      
      const reminderDate = addSeconds(baseDate, offsetSec);
      return format(reminderDate, "HH:mm, EEEE, dd/MM", { locale: vi });
    } catch {
      return "Ngày/giờ không hợp lệ";
    }
  };

  return (
    <div className="space-y-3">
      <label className="text-sm font-medium">Nhắc nhở</label>
      
      {/* Danh sách các nhắc nhở đã thêm */}
      <div className="flex flex-wrap gap-2">
        {value.map((reminder) => (
          <Badge key={reminder.offsetSec} variant="secondary" className="pl-2 pr-1 text-sm">
            <span>
              Trước {-reminder.offsetSec / (UNITS['ngày']) >= 1 
                ? `${-reminder.offsetSec / UNITS['ngày']} ngày` 
                : `${-reminder.offsetSec / UNITS['giờ']} giờ`}
            </span>
            <button 
              type="button" 
              onClick={() => handleRemoveReminder(reminder.offsetSec)}
              className="ml-1 rounded-full p-0.5 hover:bg-muted-foreground/20"
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
      </div>
      
      {/* Popover để thêm nhắc nhở mới */}
      <Popover>
        <PopoverTrigger asChild>
          <Button type="button" variant="outline" size="sm" className="gap-2">
            <BellPlus className="h-4 w-4" />
            Thêm nhắc nhở
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto">
          <div className="flex gap-2">
            <span className="mt-2">Trước</span>
            <Input
              type="number"
              value={num}
              onChange={(e) => setNum(parseInt(e.target.value) || 1)}
              className="w-16"
              min={1}
            />
            <Select value={unit} onValueChange={setUnit}>
              <SelectTrigger className="w-[100px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="phút">phút</SelectItem>
                <SelectItem value="giờ">giờ</SelectItem>
                <SelectItem value="ngày">ngày</SelectItem>
              </SelectContent>
            </Select>
            <Button type="button" size="sm" onClick={handleAddReminder}>Thêm</Button>
          </div>
        </PopoverContent>
      </Popover>

      {/* Preview nhắc nhở */}
      {value.length > 0 && eventDate && (
        <div className="text-sm text-muted-foreground space-y-1 rounded-md border p-3">
          <p className="font-medium text-foreground">Sẽ nhắc vào:</p>
          {value.sort((a,b) => a.offsetSec - b.offsetSec).map(r => (
            <p key={r.offsetSec} className="flex items-center gap-2">
              <Clock className="h-3.5 w-3.5" />
              <span>{getPreview(r.offsetSec)}</span>
            </p>
          ))}
        </div>
      )}
    </div>
  );
}