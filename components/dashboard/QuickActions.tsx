// components/dashboard/QuickActions.tsx
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BrainCircuit, FileText, Plus } from "lucide-react";
import React from "react";

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
  return (
    <Card>
      <CardHeader>
        <CardTitle>Bắt đầu nhanh</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col sm:flex-row md:flex-col gap-2">
        <Button onClick={onCreateExam} className="w-full justify-start gap-2">
          <Plus className="h-4 w-4" />
          <span> Kỳ thi</span>
        </Button>
        <Button
          onClick={onCreateAssignment}
          variant="secondary"
          className="w-full justify-start gap-2"
        >
          <FileText className="h-4 w-4" />
          <span> Bài tập</span>
        </Button>
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