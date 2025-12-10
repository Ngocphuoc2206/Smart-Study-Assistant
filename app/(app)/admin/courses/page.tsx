//app/(app)/admin/courses/page.tsx)
//Hiển thị danh sách các môn học trong hệ thống
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BookOpen, MoreHorizontal, Trash2 } from "lucide-react";

// Mock data courses
const courses = [
  { id: 1, name: "Trí tuệ nhân tạo", code: "IT4040", teacher: "Trần Thị B", students: 45 },
  { id: 2, name: "Lập trình Web", code: "IT4409", teacher: "Trần Thị B", students: 60 },
  { id: 3, name: "Cơ sở dữ liệu", code: "IT3090", teacher: "Lê Văn C", students: 50 },
];

export default function AdminCourses() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Quản lý Khóa học</h1>
        {/* Nút này có thể mở Dialog tạo khóa học (dùng lại component CourseForm) */}
        <Button>+ Tạo Khóa Mới</Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {courses.map((course) => (
            <Card key={course.id}>
                <CardHeader className="flex flex-row items-start justify-between pb-2">
                    <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded bg-primary/10 flex items-center justify-center text-primary">
                            <BookOpen className="h-4 w-4" />
                        </div>
                        <div>
                            <CardTitle className="text-base">{course.name}</CardTitle>
                            <p className="text-xs text-muted-foreground">{course.code}</p>
                        </div>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button>
                </CardHeader>
                <CardContent>
                    <div className="text-sm space-y-1">
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Giảng viên:</span>
                            <span className="font-medium">{course.teacher}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Sĩ số:</span>
                            <Badge variant="secondary">{course.students} SV</Badge>
                        </div>
                    </div>
                    <Button variant="outline" className="w-full mt-4 text-destructive hover:text-destructive">
                        <Trash2 className="h-4 w-4 mr-2" /> Xóa môn học
                    </Button>
                </CardContent>
            </Card>
        ))}
      </div>
    </div>
  );
}