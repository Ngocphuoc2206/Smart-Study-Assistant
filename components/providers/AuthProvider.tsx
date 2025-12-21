"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuthStore } from "@/lib/hooks/useAuthStore";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const bootstrapped = useAuthStore((s) => s.bootstrapped);
  const bootstrap = useAuthStore((s) => s.bootstrap);

  useEffect(() => {
    bootstrap();
  }, [bootstrap]);

  useEffect(() => {
    if (bootstrapped && !user) {
      router.replace("/login");
    }
  }, [bootstrapped, user, router]);

  if (!bootstrapped) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Skeleton className="h-20 w-20 rounded-full" />
      </div>
    );
  }

  if (bootstrapped && user) return <>{children}</>;

  return null;
}
