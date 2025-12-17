// app/(auth)/login/page.tsx
"use client";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/hooks/useAuthStore";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { BookA, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";

// [UPDATE] Schema: Đổi username thành email, BỎ trường role
const loginSchema = z.object({
  email: z.string().email("Email không hợp lệ"), // Backend yêu cầu email
  password: z.string().min(6, "Mật khẩu phải có ít nhất 6 ký tự"),
});

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuthStore();
  
  // [UPDATE] State hiển thị xoay vòng khi đang gọi API
  const [isLoading, setIsLoading] = useState(false);
  
  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { 
        email: "", 
        password: "" 
        // [REMOVED] Bỏ default role
    }, 
  });

  // [UPDATE] Chuyển thành hàm async để chờ API
  const onSubmit = async (data: z.infer<typeof loginSchema>) => {
    setIsLoading(true); // Bắt đầu loading
    try {
        // Gọi hàm login từ store (hàm này giờ đã gọi API thật)
        await login(data.email, data.password);
        
        // Login thành công -> Chuyển hướng
        // (Lưu ý: Role được lưu trong store, bạn có thể check store.user.role để redirect nếu muốn)
        router.push("/dashboard"); 
        
    } catch (error) {
        // Lỗi đã được Toast bên trong useAuthStore hoặc ở đây
        console.error("Login failed", error);
    } finally {
        setIsLoading(false); // Tắt loading dù thành công hay thất bại
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
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="name@example.com" 
                        {...field} 
                        disabled={isLoading} // [UPDATE] Khóa khi đang load 
                    />
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
                    <Input type="password" {...field} 
                        disabled={isLoading} // [UPDATE] Khóa khi đang load 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {/* [REMOVED] Đã xóa phần <Select> chọn Role. 
                Lý do: Server sẽ quyết định mik là ai dựa trên Email. 
            */}
            
            <Button type="submit" className="w-full" disabled={isLoading}>
              {/* [UPDATE] Hiển thị icon loading */}
              {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Đang xử lý...
                  </>
              ) : (
                  "Đăng nhập"
              )}
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