// components/providers/AuthProvider.tsx
"use client";

import { useAuthStore } from "@/lib/hooks/useAuthStore";
import { useRouter } from "next/navigation";
import React, { useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  
  // Lấy trạng thái từ 'persist' (localStorage)
  // `useAuthStore.persist` may be undefined in some environments (SSR/dev),
  // so guard the call and fall back to `true` to avoid blocking render.
  const isHydrated =
    typeof useAuthStore?.persist?.hasHydrated === "function"
      ? useAuthStore.persist.hasHydrated()
      : true;

  useEffect(() => {
    // Chỉ chạy sau khi đã lấy dữ liệu từ localStorage
    if (isHydrated && !user) {
      // Nếu chưa đăng nhập, đá về trang /login
      router.replace("/login");
    }
  }, [isHydrated, user, router]);

  // 1. Nếu chưa lấy xong localStorage, hiện màn hình chờ
  if (!isHydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Skeleton className="h-20 w-20 rounded-full" />
      </div>
    );
  }

  // 2. Nếu đã lấy xong VÀ có user, cho phép vào
  if (isHydrated && user) {
    return <>{children}</>;
  }

  // 3. Nếu đã lấy xong và KO có user (đang bị đá về /login)
  return null; 
}