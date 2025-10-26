// features/courses/CourseGrid.tsx
"use client";

import React, { useState, useMemo } from "react";
import { useCourses, CourseWithEventCount } from "@/lib/hooks/useCourses";
import { useCourseMutations } from "@/lib/hooks/useCourseMutations";
import { Course } from "@/lib/types";
import CourseForm, { CourseFormValues } from "./CourseForm";

// Import UI
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { AlertCircle, CalendarDays, Edit, Loader2, Plus, Search, Trash2 } from "lucide-react";
import { useDebounce } from "use-debounce";

export default function CourseGrid() {
  // --- State & Data Fetching ---
  const { data: courses, isLoading, isError } = useCourses();
  const { createMutation, updateMutation, deleteMutation } = useCourseMutations();
  
  // --- State cho Dialogs ---
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editCourse, setEditCourse] = useState<Course | null>(null);
  const [deleteCourse, setDeleteCourse] = useState<Course | null>(null);
  
  // --- State cho Lọc & Sắp xếp (Yêu cầu 4) ---
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch] = useDebounce(searchTerm, 300);
  const [sort, setSort] = useState<'name_asc' | 'event_desc'>('name_asc');

  // Logic lọc và sắp xếp
  const filteredCourses = useMemo(() => {
    if (!courses) return [];
    
    // 1. Lọc
    const filtered = courses.filter(c => 
      c.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      c.code?.toLowerCase().includes(debouncedSearch.toLowerCase())
    );
    
    // 2. Sắp xếp
    filtered.sort((a, b) => {
      if (sort === 'event_desc') {
        return b.eventCount - a.eventCount;
      }
      return a.name.localeCompare(b.name); // name_asc
    });
    
    return filtered;
  }, [courses, debouncedSearch, sort]);

  // --- Handlers ---
  const handleAddSubmit = (data: CourseFormValues) => {
    createMutation.mutate(data, {
      onSuccess: () => setIsAddOpen(false),
    });
  };
  
  const handleEditSubmit = (data: CourseFormValues) => {
    if (!editCourse) return;
    updateMutation.mutate({ id: editCourse.id, data }, {
      onSuccess: () => setEditCourse(null),
    });
  };
  
  const confirmDelete = () => {
    if (!deleteCourse) return;
    deleteMutation.mutate(deleteCourse.id, {
      onSuccess: () => setDeleteCourse(null),
    });
  };

  // --- Render ---
  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-40" />)}
        </div>
      );
    }
    if (isError) {
      return (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Lỗi</AlertTitle>
          <AlertDescription>Không thể tải danh sách môn học.</AlertDescription>
        </Alert>
      );
    }
    if (filteredCourses.length === 0) {
      return <p className="text-muted-foreground text-center py-8">Không tìm thấy môn học nào.</p>
    }
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCourses.map(course => (
          <CourseCard 
            key={course.id} 
            course={course}
            onEdit={() => setEditCourse(course)}
            onDelete={() => setDeleteCourse(course)}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex flex-col md:flex-row gap-2 justify-between">
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Tìm môn học..." 
              className="pl-9 w-full md:w-64"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select value={sort} onValueChange={(v) => setSort(v as any)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name_asc">Sắp xếp (A → Z)</SelectItem>
              <SelectItem value="event_desc">Sự kiện (Nhiều → Ít)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {/* Dialog Thêm Môn học (Yêu cầu 2) */}
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Thêm môn học
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Thêm môn học mới</DialogTitle>
            </DialogHeader>
            <CourseForm 
              onSubmit={handleAddSubmit} 
              isLoading={createMutation.isPending} 
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Grid */}
      {renderContent()}

      {/* Dialog Sửa Môn học */}
      <Dialog open={!!editCourse} onOpenChange={(open) => !open && setEditCourse(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Sửa môn học</DialogTitle>
          </DialogHeader>
          <CourseForm 
            defaultValues={editCourse!}
            onSubmit={handleEditSubmit} 
            isLoading={updateMutation.isPending} 
          />
        </DialogContent>
      </Dialog>
      
      {/* Dialog Xác nhận Xóa */}
      <AlertDialog open={!!deleteCourse} onOpenChange={(open) => !open && setDeleteCourse(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Bạn có chắc chắn muốn xóa?</AlertDialogTitle>
            <AlertDialogDescription>
              Xóa môn "{deleteCourse?.name}"? Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete} 
              disabled={deleteMutation.isPending}
              className="bg-destructive hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? "Đang xóa..." : "Xóa"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// --- Component Card Phụ ---
function CourseCard({ course, onEdit, onDelete }: { 
  course: CourseWithEventCount,
  onEdit: () => void,
  onDelete: () => void,
}) {
  return (
    <ContextMenu>
      <ContextMenuTrigger>
        <Card className="h-full flex flex-col">
          <CardHeader className="flex-row items-center gap-4 space-y-0">
            <span className="h-10 w-10 rounded-lg flex-shrink-0" style={{ backgroundColor: course.color }} />
            <div>
              <CardTitle>{course.name}</CardTitle>
              <CardDescription>{course.code}</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="flex-grow"></CardContent>
          <CardFooter>
            <div className="flex items-center text-sm text-muted-foreground">
              <CalendarDays className="h-4 w-4 mr-1.5" />
              <span>{course.eventCount} sự kiện</span>
            </div>
          </CardFooter>
        </Card>
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem onClick={onEdit}>
          <Edit className="h-4 w-4 mr-2" />
          Sửa
        </ContextMenuItem>
        <ContextMenuItem onClick={onDelete} className="text-destructive">
          <Trash2 className="h-4 w-4 mr-2" />
          Xóa
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}