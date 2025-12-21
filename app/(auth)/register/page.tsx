/* eslint-disable @typescript-eslint/no-explicit-any */
// app/(auth)/register/page.tsx
"use client";

// (Imports tương tự LoginPage...)
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { BookA } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";
import { useAuthStore } from "@/lib/hooks/useAuthStore";

const registerSchema = z.object({
  firstName: z.string().min(1, "Họ phải không được để trống"),
  lastName: z.string().min(1, "Tên phải không được để trống"),
  role: z.enum(["student", "teacher", "admin"]),
  email: z.string().email("Email không hợp lệ"),
  password: z.string().min(6, "Mật khẩu phải có ít nhất 6 ký tự"),
});

export default function RegisterPage() {
  const router = useRouter();
  const { login } = useAuthStore(); // Lấy hàm login từ store
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      role: "student",
      email: "",
      password: "",
    },
  });

  const auth = useAuthStore();

  const onSubmit = async (data: z.infer<typeof registerSchema>) => {
    setIsLoading(true);
    try {
      // 1. Gọi API Đăng ký
      // Backend route: POST /api/auth/register
      const res = await api.post("/auth/register", {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        password: data.password,
        role: data.role,
      });

      // Kiểm tra phản hồi từ Server
      if (res.data.success) {
        toast.success("Đăng ký thành công! Đang đăng nhập...");

        // 2. Tự động Đăng nhập ngay sau khi đăng ký
        try {
          await login(data.email, data.password);

          // 3. Logic Chuyển hướng (Phân quyền)
          // Đảm bảo các trang này (/admin, /courses...) đã tồn tại trong code của bạn
          if (data.role === "admin") {
            router.push("/admin");
          } else if (data.role === "teacher") {
            router.push("/dashboard"); // Khuyên dùng /dashboard chung, sau đó hiển thị menu giáo viên
          } else {
            router.push("/dashboard");
          }

          router.refresh(); // Refresh để cập nhật trạng thái Auth mới
        } catch (loginError) {
          console.error("Auto-login failed:", loginError);
          toast.info("Vui lòng đăng nhập lại.");
          router.push("/login");
        }
      }
    } catch (error: any) {
      console.error("Register Error:", error);
      const msg =
        error.response?.data?.message || "Đăng ký thất bại. Vui lòng thử lại.";
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader className="text-center">
        <BookA className="mx-auto h-10 w-10 text-primary" />
        <CardTitle className="mt-2 text-2xl">Tạo tài khoản</CardTitle>
        <CardDescription>Bắt đầu quản lý việc học của bạn.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <FormField
                name="firstName"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Họ</FormLabel>
                    <FormControl>
                      <Input placeholder="Nguyễn" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                name="lastName"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tên</FormLabel>
                    <FormControl>
                      <Input placeholder="Văn A" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            {/* Role selection */}
            <FormField
              name="role"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Vai trò</FormLabel>
                  <FormControl>
                    <select
                      {...field}
                      className="w-full rounded-md border px-3 py-2"
                    >
                      <option value="student">Học sinh</option>
                      <option value="teacher">Giảng viên</option>
                      <option value="admin">Admin</option>
                    </select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              name="email"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="sv@email.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              name="password"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mật khẩu</FormLabel>
                  <FormControl>
                    <Input type="password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full">
              Tạo tài khoản
            </Button>
          </form>
        </Form>
      </CardContent>
      <CardFooter className="flex justify-center">
        <p className="text-sm text-muted-foreground">
          Đã có tài khoản?{" "}
          <Link
            href="/login"
            className="font-medium text-primary hover:underline"
          >
            Đăng nhập
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
