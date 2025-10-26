// features/chat/mockNLP.ts
import { StudyEvent } from "@/lib/types";
import { formatISO, addDays, nextDay, Day } from 'date-fns';

// --- Types ---
export type NLPEntity = Partial<Omit<StudyEvent, 'id' | 'course' | 'reminders'>>;
export type NLPResult = {
  intent: 'add_event' | 'find_event' | 'unknown' | 'error';
  entities: NLPEntity;
  reminders?: number[]; // Mảng các offset giây, ví dụ [-86400]
  missingEntities?: string[];
  responseText: string;
};

// --- Helper Functions ---
function getNextWeekday(dayText: string): string {
  const dayMapping: Record<string, Day> = {
    'thứ 2': 1, 'thứ 3': 2, 'thứ 4': 3, 'thứ 5': 4, 'thứ 6': 5, 'thứ 7': 6, 'chủ nhật': 0, 'cn': 0,
  };
  const day = dayText.toLowerCase().replace(' ', '');
  const dayIndex = dayMapping[day];
  
  if (dayIndex !== undefined) {
    const nextDate = nextDay(new Date(), dayIndex);
    return formatISO(nextDate, { representation: 'date' });
  }
  return formatISO(new Date(), { representation: 'date' }); // Fallback
}

function parseReminders(text: string): number[] | undefined {
    const reminders = [];
    if (text.includes("nhắc trước 1 ngày")) reminders.push(-86400);
    if (text.includes("nhắc trước 2 ngày")) reminders.push(-172800);
    if (text.includes("nhắc trước 1 giờ")) reminders.push(-3600);
    return reminders.length > 0 ? reminders : undefined;
}

// --- Main Mock Function ---
export const mockParseNLP = async (text: string): Promise<NLPResult> => {
  await new Promise(res => setTimeout(res, 800)); // Giả lập độ trễ
  const lowerText = text.toLowerCase();

  // 1. Giả lập Lỗi
  if (lowerText.includes("lỗi")) {
    return {
      intent: 'error',
      entities: {},
      responseText: "Rất tiếc, đã có lỗi xảy ra khi xử lý yêu cầu của bạn."
    };
  }

  // 2. Giả lập Thiếu thông tin
  if (lowerText === "thêm bài tập" || lowerText === "tạo kỳ thi") {
    return {
      intent: 'add_event',
      entities: { type: lowerText.includes('bài tập') ? 'assignment' : 'exam' },
      missingEntities: ['title', 'date', 'timeStart'],
      responseText: `OK, bạn muốn thêm ${lowerText.includes('bài tập') ? 'bài tập' : 'kỳ thi'} mới. Vui lòng cung cấp: Tên, Ngày và Giờ.`,
    };
  }
  
  // 3. Giả lập Thành công (Đủ entity)
  // Ví dụ 1: "Thêm kỳ thi Toán 12/12 9h, nhắc trước 1 ngày"
  if (lowerText.includes("kỳ thi toán 12/12 9h")) {
    return {
      intent: 'add_event',
      entities: {
        type: 'exam',
        title: 'Kỳ thi Toán',
        date: '2025-12-12', // Giả sử năm 2025
        timeStart: '09:00',
      },
      reminders: parseReminders(lowerText),
      responseText: "Tôi đã trích xuất thông tin. Bạn xem trước nhé?"
    };
  }
  
  // Ví dụ 2: "Deadline AI thứ 6 23:59"
  if (lowerText.includes("deadline ai thứ 6")) {
     return {
      intent: 'add_event',
      entities: {
        type: 'assignment',
        title: 'Deadline AI',
        date: getNextWeekday('thứ 6'),
        timeStart: '23:59',
      },
      reminders: parseReminders(lowerText),
      responseText: "Đã trích xuất thông tin. Xem trước và xác nhận nhé."
    };
  }

  // 4. Giả lập Không hiểu
  return {
    intent: 'unknown',
    entities: {},
    responseText: "Xin lỗi, tôi chưa hiểu ý bạn. Bạn có thể thử các gợi ý bên dưới."
  };
};