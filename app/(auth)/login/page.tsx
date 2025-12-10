// app/(auth)/login/page.tsx
"use client";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useAuthStore, UserRole } from "@/lib/hooks/useAuthStore"; // ✨ Import UserRole
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { BookA } from "lucide-react";
import { toast } from "sonner";
// ✨ Import Select
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const loginSchema = z.object({
  username: z.string().min(3, "Tên đăng nhập phải có ít nhất 3 ký tự"),
  password: z.string().min(6, "Mật khẩu phải có ít nhất 6 ký tự"),
  // ✨ Thêm trường chọn vai trò
  role: z.enum(['student', 'lecturer', 'admin'], {
    required_error: "Vui lòng chọn vai trò"
  }),
});

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuthStore();
  
  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: "", password: "", role: "student" }, // ✨ Thêm giá trị mặc định
  });

  const onSubmit = (data: z.infer<typeof loginSchema>) => {
    console.log("Đăng nhập với:", data);
    
    // ✨ Giả lập đăng nhập thành công
    const mockUser = {
      id: "user123",
      username: data.username,
      avatar: "https://github.com/shadcn.png",
      role: data.role as UserRole, // ✨ Gán vai trò từ form
    };
    login(mockUser);
    toast.success(`Đăng nhập với vai trò ${data.role}, ${data.username}!`);
    
    // ✨ Điều hướng dựa trên vai trò
    if (data.role === 'admin') {
      router.push("/admin/users"); // Chuyển đến trang admin
    } else {
      router.push("/dashboard"); // Chuyển đến trang dashboard
    }
  };

  return (
    <Card>
      <CardHeader className="text-center">
        <BookA className="mx-auto h-10 w-10 text-primary" />
        <CardTitle className="mt-2 text-2xl">Đăng nhập</CardTitle>
        <CardDescription>Chào mừng trở lại Trợ lý học tập!</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tên đăng nhập</FormLabel>
                  <FormControl>
                    <Input placeholder="it-student" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
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
            
            {/* ✨ Thêm ô chọn vai trò */}
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Đăng nhập với vai trò</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn vai trò để test..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="student">Sinh viên</SelectItem>
                      <SelectItem value="lecturer">Giảng viên</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <Button type="submit" className="w-full">
              Đăng nhập
            </Button>
          </form>
        </Form>
      </CardContent>
      <CardFooter className="flex justify-center">
        <p className="text-sm text-muted-foreground">
          Chưa có tài khoản?{" "}
          <Link href="/register" className="font-medium text-primary hover:underline">
            Đăng ký
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}