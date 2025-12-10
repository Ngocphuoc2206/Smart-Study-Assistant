//app/(app)/admin/nlp/page.tsx)
//Đây là trang quan trọng để kiểm tra xem Bot có thông minh không. Nó sẽ liệt kê lịch sử chat và Intent mà Bot nhận diện được.
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

// Mock data lịch sử NLP (Dữ liệu này sẽ lấy từ API /api/chat/history của tất cả user)
const nlpLogs = [
  { id: 1, text: "Thêm lịch thi Toán 9h mai", intent: "create_event", confidence: 0.98, time: "10:30 AM" },
  { id: 2, text: "Mai có tiết gì không?", intent: "ask_schedule", confidence: 0.85, time: "10:32 AM" },
  { id: 3, text: "Xin chào", intent: "unknown", confidence: 0.2, time: "10:35 AM" },
  { id: 4, text: "Deadline bài tập Web", intent: "ask_deadline", confidence: 0.92, time: "11:00 AM" },
];

export default function NLPMonitoring() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Giám sát NLP</h1>
      
      <div className="grid gap-4 md:grid-cols-2">
        {/* Thống kê hiệu suất */}
        <Card>
            <CardHeader><CardTitle>Độ chính xác AI</CardTitle></CardHeader>
            <CardContent>
                <div className="text-4xl font-bold text-green-600">92.5%</div>
                <p className="text-sm text-muted-foreground">Trung bình Confidence Score</p>
            </CardContent>
        </Card>
        <Card>
            <CardHeader><CardTitle>Intent phổ biến</CardTitle></CardHeader>
            <CardContent>
                <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary">create_event (450)</Badge>
                    <Badge variant="secondary">ask_schedule (300)</Badge>
                    <Badge variant="secondary">create_task (150)</Badge>
                </div>
            </CardContent>
        </Card>
      </div>

      {/* Log chi tiết */}
      <Card className="h-[500px] flex flex-col">
        <CardHeader>
          <CardTitle>Logs Nhận diện Gần đây</CardTitle>
        </CardHeader>
        <ScrollArea className="flex-1">
            <CardContent>
            <div className="space-y-4">
                {nlpLogs.map((log) => (
                <div key={log.id} className="flex items-start justify-between p-3 border-b last:border-0">
                    <div>
                        <p className="font-medium">"{log.text}"</p>
                        <div className="flex gap-2 mt-1">
                            <Badge variant="outline">{log.intent}</Badge>
                            <span className={`text-xs flex items-center ${log.confidence > 0.7 ? 'text-green-600' : 'text-red-500'}`}>
                                {log.confidence * 100}% tin cậy
                            </span>
                        </div>
                    </div>
                    <span className="text-xs text-muted-foreground">{log.time}</span>
                </div>
                ))}
            </div>
            </CardContent>
        </ScrollArea>
      </Card>
    </div>
  );
}