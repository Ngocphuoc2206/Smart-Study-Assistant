// app/(app)/admin/users/page.tsx
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MoreHorizontal, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

// Mock data user
const users = [
  { id: 1, name: "Nguyễn Văn A", email: "sv1@school.edu", role: "student", status: "active" },
  { id: 2, name: "Trần Thị B", email: "gv1@school.edu", role: "teacher", status: "active" },
  { id: 3, name: "Lê Văn C", email: "sv2@school.edu", role: "student", status: "inactive" },
  { id: 4, name: "Admin User", email: "admin@school.edu", role: "admin", status: "active" },
];

export default function UserManagement() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Quản lý Người dùng</h1>
        <Button>+ Thêm User</Button>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Danh sách tài khoản</CardTitle>
            <div className="relative w-64">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Tìm theo tên, email..." className="pl-8" />
            </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {users.map((user) => (
              <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <Avatar>
                    <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`} />
                    <AvatarFallback>{user.name[0]}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{user.name}</p>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <Badge variant={user.role === 'admin' ? 'default' : (user.role === 'teacher' ? 'secondary' : 'outline')}>
                    {user.role}
                  </Badge>
                  <Badge variant={user.status === 'active' ? 'outline' : 'destructive'} className="border-0">
                    {user.status}
                  </Badge>
                  <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}