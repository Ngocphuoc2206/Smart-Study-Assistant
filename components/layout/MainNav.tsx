"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { useNotifications } from "@/lib/hooks/useNotifications"; 
import { useAuthStore } from "@/lib/hooks/useAuthStore";

// Định nghĩa các link và vai trò được phép
const routes = [
  // == Student & Lecturer ==
  { href: "/dashboard", label: "Dashboard", roles: ["student", "lecturer"] },
  { href: "/events", label: "Sự kiện", roles: ["student", "lecturer"] }, // Lịch học, Bài tập
  { href: "/notifications", label: "Thông báo", roles: ["student", "lecturer"] },
  
  // == Lecturer Only ==
  { href: "/courses", label: "Môn học", roles: ["lecturer"] }, 
  { href: "/events/new", label: "Thêm sự kiện", roles: ["lecturer"] },
  // ✨ SỬA Ở ĐÂY: Thay "Tạo khóa học" bằng "Danh sách sinh viên"
  { href: "/students", label: "Danh sách sinh viên", roles: ["lecturer"] }, 
  
  // == ADMIN (Cập nhật mới) ==
  { href: "/admin", label: "Tổng quan", roles: ["admin"] },
  { href: "/admin/users", label: "Người dùng", roles: ["admin"] },
  { href: "/admin/courses", label: "Khóa học", roles: ["admin"] },
  { href: "/admin/nlp", label: "NLP Monitor", roles: ["admin"] },
];

interface MainNavProps {
  className?: string;
  onLinkClick?: () => void; 
}

export function MainNav({ className, onLinkClick }: MainNavProps) {
  const pathname = usePathname();
  const user = useAuthStore((state) => state.user);
  const userRole = user?.role || 'student';

  const { data: notificationData } = useNotifications();
  const upcomingCount = notificationData?.upcoming.length || 0;

  // Lọc danh sách link dựa trên vai trò
  const accessibleRoutes = routes.filter(route => 
    route.roles.includes(userRole)
  );

  return (
    <nav className={cn("flex flex-col md:flex-row gap-4 md:gap-6", className)}>
      {/* Render các link đã được lọc */}
      {accessibleRoutes.map((route) => (
        <Link
          key={route.href}
          href={route.href}
          onClick={onLinkClick}
          className={cn(
            "text-lg md:text-sm font-medium transition-colors hover:text-primary",
            pathname === route.href
              ? "text-primary"
              : "text-muted-foreground"
          )}
        >
          <div className="flex items-center gap-2">
            {route.label}
            {/* Badge chỉ hiện cho SV/GV ở mục Thông báo */}
            {route.href === "/notifications" && upcomingCount > 0 && ["student", "teacher"].includes(userRole) && (
              <Badge className="h-5 w-5 p-0 flex items-center justify-center">{upcomingCount}</Badge>
            )}
          </div>
        </Link>
      ))}
    </nav>
  );
}