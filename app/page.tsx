// app/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/hooks/useAuthStore";
import { Loader2 } from "lucide-react"; // Optional: Icon loading

export default function RootPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  
  // 1. Tạo state để biết khi nào Client đã sẵn sàng (Mounted)
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // 2. Logic chuyển hướng
  useEffect(() => {
    // Chỉ chạy khi đã mounted (để đảm bảo đã đọc được localStorage)
    if (isMounted) {
      if (user) {
        router.push("/dashboard");
      } else {
        router.push("/login");
      }
    }
  }, [isMounted, user, router]);

  // 3. Trong lúc chờ mount hoặc chờ redirect, hiển thị màn hình Loading trống
  return (
    <div className="flex h-screen w-full items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}