// app/page.tsx
"use client";

import { useAuthStore } from "@/lib/hooks/useAuthStore";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";

export default function RootPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const isHydrated = useAuthStore.persist.hasHydrated();

  useEffect(() => {
    if (isHydrated) {
      if (user) {
        router.replace("/dashboard");
      } else {
        router.replace("/login");
      }
    }
  }, [isHydrated, user, router]);

  // Hiển thị màn hình chờ trong khi check localStorage
  return (
     <div className="flex min-h-screen items-center justify-center">
        <Skeleton className="h-20 w-20 rounded-full" />
        <p className="ml-4 text-lg font-medium">Đang tải...</p>
      </div>
  );
}