"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Search, UserPlus, Trash2, Mail } from "lucide-react";

// --- MOCK DATA (Mô phỏng dữ liệu từ Backend trả về) ---
// Giả sử Giảng viên có 2 khóa học
const mockCourses = [
  { id: "c1", name: "Lập trình Web", code: "IT4080" },
  { id: "c2", name: "Trí tuệ Nhân tạo", code: "IT4040" },
];

// Giả sử đây là danh sách sinh viên đã được populate
const mockStudents = [
  { 
    id: "u1", 
    firstName: "Nguyễn Văn", 
    lastName: "An", 
    email: "an.nguyen@st.edu.vn", 
    avatar: "",
    courseId: "c1" // Sinh viên này học môn c1
  },
  { 
    id: "u2", 
    firstName: "Lê Thị", 
    lastName: "Bình", 
    email: "binh.le@st.edu.vn", 
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Binh",
    courseId: "c1"
  },
  { 
    id: "u3", 
    firstName: "Trần Văn", 
    lastName: "Cường", 
    email: "cuong.tran@st.edu.vn", 
    avatar: "",
    courseId: "c2" // Sinh viên này học môn c2
  },
];

export default function StudentManagementPage() {
  const [selectedCourse, setSelectedCourse] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");

  // Logic Lọc Sinh viên
  const filteredStudents = mockStudents.filter((student) => {
    // 1. Lọc theo khóa học
    const matchesCourse = selectedCourse === "all" || student.courseId === selectedCourse;
    
    // 2. Lọc theo tìm kiếm (Tên hoặc Email)
    const fullName = `${student.firstName} ${student.lastName}`.toLowerCase();
    const matchesSearch = 
      fullName.includes(searchTerm.toLowerCase()) || 
      student.email.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesCourse && matchesSearch;
  });

  // Helper để lấy tên khóa học hiển thị
  const getCourseName = (courseId: string) => {
    return mockCourses.find(c => c.id === courseId)?.name || "Unknown";
  };

  return (
    <div className="space-y-6">
      {/* Header & Actions */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Danh sách Sinh viên</h1>
          <p className="text-muted-foreground">Quản lý sinh viên trong các lớp học phần của bạn.</p>
        </div>
        <Button>
          <UserPlus className="mr-2 h-4 w-4" />
          Thêm sinh viên vào lớp
        </Button>
      </div>

      {/* Toolbar: Filter & Search */}
      <Card>
        <CardContent className="p-4 flex flex-col md:flex-row gap-4">
          
          {/* Chọn Khóa Học */}
          <div className="w-full md:w-[300px]">
            <Select value={selectedCourse} onValueChange={setSelectedCourse}>
              <SelectTrigger>
                <SelectValue placeholder="Chọn khóa học..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả các lớp</SelectItem>
                {mockCourses.map(course => (
                  <SelectItem key={course.id} value={course.id}>
                    {course.code} - {course.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tìm kiếm */}
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

      {/* Bảng Danh sách */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Kết quả ({filteredStudents.length} sinh viên)</CardTitle>
          <CardDescription>
            {selectedCourse === 'all' ? "Hiển thị tất cả sinh viên." : `Đang xem lớp: ${getCourseName(selectedCourse)}`}
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
                filteredStudents.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell>
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={student.avatar} />
                        <AvatarFallback>{student.lastName[0]}</AvatarFallback>
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
                        {getCourseName(student.courseId)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10">
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