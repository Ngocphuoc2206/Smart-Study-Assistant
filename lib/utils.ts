// lib/utils.ts
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format } from "date-fns";
import { vi } from 'date-fns/locale';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format thời gian (ví dụ: 09:30) */
export function formatEventTime(time: string) {
    try {
        const [h, m] = time.split(':');
        return format(new Date(2000, 0, 1, parseInt(h), parseInt(m)), "HH:mm");
    } catch (e) {
        return "N/A";
    }
}

/** Format ngày giờ đầy đủ (ví dụ: 09:30, Thứ hai, 23/10) */
export function formatEventDateTime(date: string, time: string) {
  try {
    const d = new Date(`${date}T${time}`);
    return format(d, "HH:mm, EEEE, dd/MM", { locale: vi });
  } catch(e) {
    return "N/A";
  }
}