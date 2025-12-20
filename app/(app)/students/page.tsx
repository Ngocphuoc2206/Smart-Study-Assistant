"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useCourses } from "@/lib/hooks/useCourses"; // Import Hook
import { useAuthStore } from "@/lib/hooks/useAuthStore";

// UI Imports (Giữ nguyên của bạn)
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Search, Trash2, Mail, Loader2 } from "lucide-react";
import axios from "axios";

export default function StudentManagementPage() {
  // 1. Lấy dữ liệu thật từ API
  const { data: courses, isLoading, refetch } = useCourses();
  
  // State lọc
  const [selectedCourse, setSelectedCourse] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");

  // Gọi API khi vào trang (nếu bạn dùng chế độ manual fetch)
  useEffect(() => {
    refetch();
  }, []);

  // 2. CHUYỂN ĐỔI DỮ LIỆU: Course[] -> StudentList[]
  // Mục đích: Biến danh sách khóa học thành danh sách sinh viên phẳng để dễ hiển thị bảng
  const allStudents = useMemo(() => {
      if (!courses) return [];

      let list: any[] = [];

      courses.forEach(course => {
          // Với mỗi khóa học, lấy danh sách sinh viên ra
          if (Array.isArray(course.students)) {
              course.students.forEach((student: any) => {
                  // Push vào danh sách chung, kèm theo ID khóa học để biết sinh viên này thuộc lớp nào
                  list.push({
                      id: student._id || student.id,
                      firstName: student.firstName,
                      lastName: student.lastName,
                      email: student.email,
                      avatar: student.avatar,
                      courseId: course.id,      // ID lớp
                      courseName: course.name,  // Tên lớp
                      courseCode: course.code   // Mã lớp
                  });
              });
          }
      });
      return list;
  }, [courses]);

  // 3. LOGIC LỌC (Filter)
  const filteredStudents = useMemo(() => {
    return allStudents.filter((student) => {
      // Lọc theo khóa học
      const matchesCourse = selectedCourse === "all" || student.courseId === selectedCourse;
      
      // Lọc theo tìm kiếm
      const fullName = `${student.firstName} ${student.lastName}`.toLowerCase();
      const matchesSearch = 
        fullName.includes(searchTerm.toLowerCase()) || 
        student.email.toLowerCase().includes(searchTerm.toLowerCase());

      return matchesCourse && matchesSearch;
    });
  }, [allStudents, selectedCourse, searchTerm]);

  // 1. Thêm token hoặc accessToken từ useAuthStore (tùy tên biến trong store của bạn)
const { accessToken } = useAuthStore(); 

async function handleRemoveStudent(studentId: string, courseId: string) {
    if (!confirm("Bạn có chắc muốn xóa sinh viên này khỏi lớp?")) return;

    try {
        // 2. Thêm config headers chứa Token vào request
        const response = await axios.post(
            'http://localhost:4001/api/course/remove-student', // Đảm bảo đúng port backend
            { 
                courseId: courseId,
                studentId: studentId
            },
            {
                headers: {
                    Authorization: `Bearer ${accessToken}` // QUAN TRỌNG: Gửi kèm Token
                }
            }
        );

        if (response.data.success || response.status === 200) {
            alert("Đã xóa thành công!");
            refetch(); 
        }
    } catch (error) {
        console.error("Lỗi khi xóa:", error);
        alert("Lỗi: Không có quyền hoặc phiên đăng nhập hết hạn.");
    }
}

  // --- Render ---

  if (isLoading) {
      return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      {/* Header & Actions */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Danh sách Sinh viên</h1>
          <p className="text-muted-foreground">Quản lý sinh viên trong các lớp học phần của bạn.</p>
        </div>
      </div>

      {/* Toolbar */}
      <Card>
        <CardContent className="p-4 flex flex-col md:flex-row gap-4">
          
          {/* Select: Dùng dữ liệu thật từ courses */}
          <div className="w-full md:w-[300px]">
            <Select value={selectedCourse} onValueChange={setSelectedCourse}>
              <SelectTrigger>
                <SelectValue placeholder="Chọn khóa học..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả các lớp</SelectItem>
                {courses?.map(course => (
                  <SelectItem key={course.id} value={course.id}>
                    {course.code} - {course.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Tìm kiếm theo tên hoặc email..."
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Kết quả ({filteredStudents.length} sinh viên)</CardTitle>
          <CardDescription>
             {/* Hiển thị tên lớp đang chọn */}
             {selectedCourse === 'all' 
                ? "Hiển thị tất cả sinh viên." 
                : `Đang xem lớp: ${courses?.find(c => c.id === selectedCourse)?.name}`
             }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]"></TableHead>
                <TableHead>Họ và Tên</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Lớp học phần</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStudents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    Không tìm thấy sinh viên nào.
                  </TableCell>
                </TableRow>
              ) : (
                filteredStudents.map((student, index) => (
                  // Dùng index làm key phụ vì 1 SV có thể học 2 môn (xuất hiện 2 lần)
                  <TableRow key={`${student.id}-${index}`}>
                    <TableCell>
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={student.avatar} />
                        <AvatarFallback>{student.lastName?.[0] || "S"}</AvatarFallback>
                      </Avatar>
                    </TableCell>
                    <TableCell className="font-medium">
                      {student.firstName} {student.lastName}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Mail className="h-3 w-3" />
                        {student.email}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {student.code} {student.courseName}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => handleRemoveStudent(student.id, student.courseId)}
                        title="Xóa khỏi lớp"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}