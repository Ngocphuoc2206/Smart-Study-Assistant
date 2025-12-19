// features/courses/CourseGrid.tsx
"use client";

import React, { useState, useMemo ,useEffect, use } from "react";
import { useCourses, CourseWithEventCount } from "@/lib/hooks/useCourses";
import { useAuthStore } from "@/lib/hooks/useAuthStore";
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
import { AlertCircle, CalendarDays, CheckCircle2, Edit, Loader2, Plus, Search, Trash2, UserPlus } from "lucide-react";
import { useDebounce } from "use-debounce";

export default function CourseGrid() {

  // --- Auth & Role ---
  const user = useAuthStore((state) => state.user);
  const isTeacher = user?.role === "teacher"; // Xác định quyền
  const currentUserId = user?.id;
  // --- State & Data Fetching ---
  const { data: courses, isLoading, isError, refetch } = useCourses();
  const { createMutation, updateMutation, deleteMutation, registerMutation } = useCourseMutations();
  
  // --- State cho Dialogs ---
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editCourse, setEditCourse] = useState<Course | null>(null);
  const [deleteCourse, setDeleteCourse] = useState<Course | null>(null);
  
  // --- State cho Lọc & Sắp xếp (Yêu cầu 4) ---
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch] = useDebounce(searchTerm, 300);
  const [sort, setSort] = useState<'name_asc' | 'event_desc'>('name_asc');

  useEffect(() => {
    refetch();
  }, []);

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
      onSuccess: () => {setIsAddOpen(false);
      refetch();
      },
    });
  };
  
  const handleEditSubmit = (data: CourseFormValues) => {
    if (!editCourse) return;
    updateMutation.mutate({ id: editCourse.id, data }, {
      onSuccess: () => { setEditCourse(null);
      refetch();
      },
    });
  };
  
  const confirmDelete = () => {
    if (!deleteCourse) return;
    deleteMutation.mutate(deleteCourse.id, {
      onSuccess: () => {setDeleteCourse(null);
      refetch();
      },
    });
  };

  const handleRegister = (courseId: string) => {
      // Gọi hàm đăng ký
      registerMutation.mutate(courseId, {
          onSuccess: () => {
              // Đăng ký xong thì gọi refetch()
              // Để danh sách cập nhật (ví dụ: nút Đăng ký đổi thành Đã tham gia)
              refetch(); 
          }
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
            onRegister={() => handleRegister(course.id)}
            currentUserId={currentUserId}
            isTeacher={isTeacher}
            isRegistering={registerMutation.isPending}
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
        
        {/* CHỈ TEACHER MỚI ĐƯỢC THẤY NÚT THÊM */}
        {isTeacher && (
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
        )}
      </div>

      {/* Grid */}
      {renderContent()}

      {/* Các Dialog Edit/Delete chỉ render nếu là Teacher (để an toàn) */}
      {isTeacher && (
          <>
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
          </>
      )}
    </div>
  );
}

// --- Component Card Phụ ---
function CourseCard({ 
  course, 
  onEdit, 
  onDelete,
  onRegister,
  currentUserId,
  isRegistering,
  isTeacher
}: {
  course: CourseWithEventCount,
  onEdit: () => void,
  onDelete: () => void,
  onRegister?: () => void,
  currentUserId?: string,
  isRegistering?: boolean,
  isTeacher?: boolean
}) {

  const isJoined = course.students?.includes(currentUserId || "");
 // Render chung cho phần nội dung Card
  const CardContentInner = () => (
    <>
        <CardHeader className="flex-row items-center gap-4 space-y-0">
          <span className="h-10 w-10 rounded-lg flex-shrink-0" style={{ backgroundColor: course.color }} />
          <div>
            <CardTitle className="line-clamp-1" title={course.name}>{course.name}</CardTitle>
            <CardDescription>{course.code}</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="flex-grow">
            <p className="text-sm text-muted-foreground">GV: {course.teacherName}</p> 
        </CardContent>
    </>
  );

  // --- LOGIC CHO GIẢNG VIÊN (Có Context Menu để sửa xóa) ---
  if (isTeacher) {
      return (
        <ContextMenu>
          <ContextMenuTrigger>
            <Card className="h-full flex flex-col hover:shadow-md transition-shadow cursor-pointer">
              <CardContentInner />
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

  // --- LOGIC CHO SINH VIÊN (Nút Đăng Ký) ---
  // Kiểm tra xem sinh viên đã đăng ký chưa (nếu API trả về field isRegistered)
  // Tạm thời mình luôn hiện nút Đăng ký
  return (
    <Card className="h-full flex flex-col hover:shadow-md transition-shadow">
        <CardContentInner />
        <CardFooter className="flex justify-between items-center mt-auto">
            <div className="flex items-center text-sm text-muted-foreground">
                <CalendarDays className="h-4 w-4 mr-1.5" />
                <span>{course.eventCount} Sự kiện</span>
            </div>
            
            {/* 👇 Dùng điều kiện để hiển thị nút */}
            {isJoined ? (
                // Nếu ĐÃ tham gia -> Hiện nút Check xanh
                <Button size="sm" variant="ghost" className="gap-2 text-green-600 cursor-default hover:text-green-600 hover:bg-transparent">
                    <CheckCircle2 className="h-4 w-4" />
                    Đã tham gia
                </Button> 
            ) : (
                // Nếu CHƯA tham gia -> Hiện nút Đăng ký
                <Button 
                    size="sm" 
                    onClick={() => onRegister?.()} 
                    variant="secondary" 
                    className="gap-2"
                    disabled={isRegistering} // Disable khi đang loading
                >
                    {isRegistering ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <UserPlus className="h-4 w-4" />
                    )}
                    Đăng ký
                </Button>
            )}
            
        </CardFooter>
    </Card>
  );
}