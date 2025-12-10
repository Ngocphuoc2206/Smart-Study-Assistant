//app/(app)/admin/page.tsx
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, BookOpen, MessageSquare, Activity } from "lucide-react";

export default function AdminDashboard() {
  // Mock data (Sau này sẽ gọi API thống kê từ Backend)
  const stats = [
    { title: "Tổng người dùng", value: "128", icon: Users, desc: "+12 trong tuần này" },
    { title: "Khóa học hoạt động", value: "24", icon: BookOpen, desc: "3 khóa học mới" },
    { title: "Tin nhắn đã xử lý", value: "1,024", icon: MessageSquare, desc: "NLP chính xác 92%" },
    { title: "Sự kiện được tạo", value: "560", icon: Activity, desc: "Chủ yếu là Lịch thi" },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Tổng quan Hệ thống</h1>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Khu vực biểu đồ hoặc logs nhanh (Placeholder) */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Hoạt động gần đây</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Chưa có dữ liệu biểu đồ.</p>
          </CardContent>
        </Card>
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Phân phối Intent</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm"><span>Tạo sự kiện</span><span className="font-bold">45%</span></div>
              <div className="flex justify-between text-sm"><span>Hỏi lịch</span><span className="font-bold">30%</span></div>
              <div className="flex justify-between text-sm"><span>Khác</span><span className="font-bold">25%</span></div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}