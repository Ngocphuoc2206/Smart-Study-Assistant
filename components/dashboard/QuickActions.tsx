// components/dashboard/QuickActions.tsx
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BrainCircuit, FileText, Plus } from "lucide-react";
import React from "react";
import { useAuthStore } from "@/lib/hooks/useAuthStore"; // Import hook xác thực

interface QuickActionsProps {
  onCreateExam: () => void;
  onCreateAssignment: () => void;
  onOpenChat: () => void;
}

export function QuickActions({
  onCreateExam,
  onCreateAssignment,
  onOpenChat,
}: QuickActionsProps) {
  // Lấy vai trò của người dùng
  const { user } = useAuthStore();
  const role = user?.role;

  // --- Logic hiển thị nút dựa trên vai trò ---

  // 1. Dành cho Sinh viên (hoặc nếu không xác định được)
  if (role === 'student' || !role) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Bắt đầu nhanh</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {/* Chỉ hiển thị nút Chat theo yêu cầu của bạn */}
          <Button
            onClick={onOpenChat}
            variant="secondary"
            className="w-full justify-start gap-2"
          >
            <BrainCircuit className="h-4 w-4" />
            <span>Nhập qua chat</span>
          </Button>
        </CardContent>
      </Card>
    );
  }

  // 2. Dành cho Giảng viên
  if (role === 'lecturer') {
     return (
      <Card>
        <CardHeader>
          <CardTitle>Bắt đầu nhanh</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row md:flex-col gap-2">
          {/* Giảng viên sẽ thấy các nút tạo lập */}
          <Button onClick={onCreateExam} className="w-full justify-start gap-2">
            <Plus className="h-4 w-4" />
            <span>+ Kỳ thi</span>
          </Button>
          <Button
            onClick={onCreateAssignment}
            variant="secondary"
            className="w-full justify-start gap-2"
          >
            <FileText className="h-4 w-4" />
            <span>+ Bài tập</span>
          </Button>
        </CardContent>
      </Card>
    );
  }
  
  // 3. Admin (hoặc vai trò khác) sẽ không thấy gì
  return null;
}