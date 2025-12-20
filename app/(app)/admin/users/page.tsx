/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  useCreateAdminUser,
  useUpdateAdminUser,
  useDeleteAdminUser,
} from "@/lib/hooks/useAdminUserMutations";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { toast } from "sonner";

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  MoreHorizontal,
  Search,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { useAdminUsers } from "@/lib/hooks/useAdminUsers";

const roleBadgeVariant = (role: string) => {
  if (role === "admin") return "default";
  if (role === "teacher") return "secondary";
  return "outline";
};

export default function UserManagement() {
  const [search, setSearch] = useState("");
  const createUser = useCreateAdminUser();
  const updateUser = useUpdateAdminUser();
  const deleteUser = useDeleteAdminUser();
  const [openCreate, setOpenCreate] = useState(false);
  const [newUser, setNewUser] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    role: "student",
  });
  const [page, setPage] = useState(1);
  const limit = 10;
  const { data, isLoading, error } = useAdminUsers({ page, limit, search });

  const users = data?.items ?? [];
  const totalPages = data?.totalPages ?? 1;

  const makeName = (u: any) => {
    if (u.name) return u.name;
    const full = `${u.firstName || ""} ${u.lastName || ""}`.trim();
    return full || u.email;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">
          Quản lý Người dùng
        </h1>
        <Dialog open={openCreate} onOpenChange={setOpenCreate}>
          <DialogTrigger asChild>
            <Button>+ Thêm User</Button>
          </DialogTrigger>

          <DialogContent>
            <DialogHeader>
              <DialogTitle>Tạo tài khoản mới</DialogTitle>
            </DialogHeader>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Họ</Label>
                  <Input
                    value={newUser.firstName}
                    onChange={(e) =>
                      setNewUser((p) => ({ ...p, firstName: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-1">
                  <Label>Tên</Label>
                  <Input
                    value={newUser.lastName}
                    onChange={(e) =>
                      setNewUser((p) => ({ ...p, lastName: e.target.value }))
                    }
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label>Email</Label>
                <Input
                  value={newUser.email}
                  onChange={(e) =>
                    setNewUser((p) => ({ ...p, email: e.target.value }))
                  }
                />
              </div>

              <div className="space-y-1">
                <Label>Mật khẩu</Label>
                <Input
                  type="password"
                  value={newUser.password}
                  onChange={(e) =>
                    setNewUser((p) => ({ ...p, password: e.target.value }))
                  }
                />
              </div>

              <div className="space-y-1">
                <Label>Role</Label>
                <Select
                  value={newUser.role}
                  onValueChange={(v) => setNewUser((p) => ({ ...p, role: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="student">student</SelectItem>
                    <SelectItem value="teacher">teacher</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button
                className="w-full"
                disabled={createUser.isPending}
                onClick={async () => {
                  try {
                    await createUser.mutateAsync(newUser as any);
                    toast.success("Tạo user thành công");
                    setOpenCreate(false);
                    setNewUser({
                      firstName: "",
                      lastName: "",
                      email: "",
                      password: "",
                      role: "student",
                    });
                  } catch (e: any) {
                    toast.error(
                      e?.response?.data?.message || "Tạo user thất bại"
                    );
                  }
                }}
              >
                {createUser.isPending ? "Đang tạo..." : "Tạo user"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <CardTitle>Danh sách tài khoản</CardTitle>

          <div className="relative w-64">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Tìm theo tên, email..."
              className="pl-8"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <div className="text-sm text-muted-foreground">Đang tải...</div>
          ) : error ? (
            <div className="text-sm text-destructive">
              Không tải được danh sách user
            </div>
          ) : users.length === 0 ? (
            <div className="text-sm text-muted-foreground">
              Không có user phù hợp.
            </div>
          ) : (
            <div className="space-y-4">
              {users.map((user) => {
                const id = user._id || user.id;
                const name = makeName(user);
                const initials = name?.[0]?.toUpperCase() || "U";

                return (
                  <div
                    key={id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center gap-4">
                      <Avatar>
                        <AvatarImage
                          src={
                            user.avatarUrl ||
                            `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(
                              name
                            )}`
                          }
                        />
                        <AvatarFallback>{initials}</AvatarFallback>
                      </Avatar>

                      <div>
                        <p className="font-medium">{name}</p>
                        <p className="text-sm text-muted-foreground">
                          {user.email}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <Badge variant={roleBadgeVariant(user.role)}>
                        {user.role}
                      </Badge>
                      <Badge
                        variant={
                          (user.status || "active") === "active"
                            ? "outline"
                            : "destructive"
                        }
                        className="border-0"
                      >
                        {user.status || "active"}
                      </Badge>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>

                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={async () => {
                              try {
                                await updateUser.mutateAsync({
                                  id,
                                  role: "student",
                                } as any);
                                toast.success("Đã đổi role: student");
                              } catch (e: any) {
                                toast.error(
                                  e?.response?.data?.message ||
                                    "Đổi role thất bại"
                                );
                              }
                            }}
                          >
                            Set role: student
                          </DropdownMenuItem>

                          <DropdownMenuItem
                            onClick={async () => {
                              try {
                                await updateUser.mutateAsync({
                                  id,
                                  role: "teacher",
                                } as any);
                                toast.success("Đã đổi role: teacher");
                              } catch (e: any) {
                                toast.error(
                                  e?.response?.data?.message ||
                                    "Đổi role thất bại"
                                );
                              }
                            }}
                          >
                            Set role: teacher
                          </DropdownMenuItem>

                          <DropdownMenuSeparator />

                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={async () => {
                              if (!confirm("Xoá user này?")) return;
                              try {
                                await deleteUser.mutateAsync(id ?? "");
                                toast.success("Đã xoá user");
                              } catch (e: any) {
                                toast.error(
                                  e?.response?.data?.message || "Xoá thất bại"
                                );
                              }
                            }}
                          >
                            Xoá user
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          <div className="flex items-center justify-between mt-6">
            <div className="text-sm text-muted-foreground">
              Trang {page} / {totalPages} • Tổng: {data?.total ?? 0}
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
                disabled={page <= 1 || isLoading}
              >
                <ChevronLeft className="h-4 w-4 mr-1" /> Trước
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                disabled={page >= totalPages || isLoading}
              >
                Sau <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
