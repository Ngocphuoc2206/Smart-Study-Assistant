"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BookOpen, MoreHorizontal, Trash2 } from "lucide-react";

import { useCourses } from "@/lib/hooks/useCourses";
import { useCourseMutations } from "@/lib/hooks/useCourseMutations";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function AdminCourses() {
  const { data: courses, isLoading, isError } = useCourses();
  const { createMutation, deleteMutation } = useCourseMutations();

  const [openCreate, setOpenCreate] = useState(false);
  const [form, setForm] = useState({
    name: "",
    code: "",
    description: "",
    color: "#3b82f6",
  });

  const canSubmit = useMemo(() => {
    return form.name.trim().length > 0 && form.code.trim().length > 0;
  }, [form]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Quản lý Khóa học</h1>

        <Dialog open={openCreate} onOpenChange={setOpenCreate}>
          <DialogTrigger asChild>
            <Button>+ Tạo Khóa Mới</Button>
          </DialogTrigger>

          <DialogContent>
            <DialogHeader>
              <DialogTitle>Tạo môn học</DialogTitle>
            </DialogHeader>

            <div className="space-y-3">
              <div className="space-y-1">
                <Label>Tên môn</Label>
                <Input
                  value={form.name}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, name: e.target.value }))
                  }
                />
              </div>

              <div className="space-y-1">
                <Label>Mã môn</Label>
                <Input
                  value={form.code}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, code: e.target.value }))
                  }
                />
              </div>

              <div className="space-y-1">
                <Label>Mô tả</Label>
                <Input
                  value={form.description}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, description: e.target.value }))
                  }
                />
              </div>

              <div className="space-y-1">
                <Label>Màu</Label>
                <Input
                  type="color"
                  value={form.color}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, color: e.target.value }))
                  }
                />
              </div>

              <Button
                className="w-full"
                disabled={!canSubmit || createMutation.isPending}
                onClick={async () => {
                  try {
                    // payload match CourseInput = Omit<Course,'id'>
                    await createMutation.mutateAsync({
                      name: form.name.trim(),
                      code: form.code.trim(),
                      description: form.description.trim(),
                      color: form.color,
                      // các field khác của Course nếu bắt buộc thì thêm ở đây
                    } as any);

                    setOpenCreate(false);
                    setForm({
                      name: "",
                      code: "",
                      description: "",
                      color: "#3b82f6",
                    });
                  } catch (e: any) {
                    // toast đã có trong mutation, không cần lặp
                  }
                }}
              >
                {createMutation.isPending ? "Đang tạo..." : "Tạo môn"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="text-sm text-muted-foreground">Đang tải...</div>
      ) : isError ? (
        <div className="text-sm text-destructive">
          Không tải được danh sách môn học
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {courses?.map((course: any) => (
            <Card key={course.id}>
              <CardHeader className="flex flex-row items-start justify-between pb-2">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded bg-primary/10 flex items-center justify-center text-primary">
                    <BookOpen className="h-4 w-4" />
                  </div>
                  <div>
                    <CardTitle className="text-base">{course.name}</CardTitle>
                    <p className="text-xs text-muted-foreground">
                      {course.code}
                    </p>
                  </div>
                </div>

                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </CardHeader>

              <CardContent>
                <div className="text-sm space-y-1">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Giảng viên:</span>
                    <span className="font-medium">
                      {course?.teacherName || "-"}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Sĩ số:</span>
                    <Badge variant="secondary">
                      {course.students?.length ?? 0} SV
                    </Badge>
                  </div>
                </div>

                <Button
                  variant="outline"
                  className="w-full mt-4 text-destructive hover:text-destructive"
                  disabled={deleteMutation.isPending}
                  onClick={async () => {
                    if (!confirm(`Xóa môn "${course.name}"?`)) return;
                    try {
                      await deleteMutation.mutateAsync(course.id);
                    } catch (e) {
                      // toast đã xử lý trong mutation
                    }
                  }}
                >
                  <Trash2 className="h-4 w-4 mr-2" />{" "}
                  {deleteMutation.isPending ? "Đang xóa..." : "Xóa môn học"}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
