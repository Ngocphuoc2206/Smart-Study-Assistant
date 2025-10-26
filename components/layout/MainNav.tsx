// components/layout/MainNav.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { useNotifications } from "@/lib/hooks/useNotifications"; // Hook từ P5

// Định nghĩa các link
const routes = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/events", label: "Sự kiện" },
  { href: "/courses", label: "Môn học" },
  { href: "/notifications", label: "Thông báo" },
];

interface MainNavProps {
  className?: string;
  // Prop để đóng sidebar khi bấm link (cho mobile)
  onLinkClick?: () => void; 
}

export function MainNav({ className, onLinkClick }: MainNavProps) {
  const pathname = usePathname();
  
  // Lấy số lượng thông báo (Yêu cầu 7)
  const { data: notificationData } = useNotifications();
  const upcomingCount = notificationData?.upcoming.length || 0;

  return (
    <nav className={cn("flex flex-col md:flex-row gap-4 md:gap-6", className)}>
      {routes.map((route) => (
        <Link
          key={route.href}
          href={route.href}
          onClick={onLinkClick} // Sẽ đóng Sheet trên mobile
          className={cn(
            "text-lg md:text-sm font-medium transition-colors hover:text-primary",
            pathname === route.href
              ? "text-primary" // Link đang active
              : "text-muted-foreground"
          )}
        >
          <div className="flex items-center gap-2">
            {route.label}
            {/* Badge thông báo (Yêu cầu 7) */}
            {route.href === "/notifications" && upcomingCount > 0 && (
              <Badge className="h-5 w-5 p-0 flex items-center justify-center">
                {upcomingCount}
              </Badge>
            )}
          </div>
        </Link>
      ))}
    </nav>
  );
}