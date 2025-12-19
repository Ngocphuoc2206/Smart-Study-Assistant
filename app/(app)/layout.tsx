"use client";

import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { BookA, Bot, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";

import ChatPanel from "@/features/chat/ChatPanel";
import { MobileNav } from "@/components/layout/MobileNav";
import { MainNav } from "@/components/layout/MainNav";
import { useChatStore } from "@/lib/hooks/useChatStore";
import { useAuthStore } from "@/lib/hooks/useAuthStore";
import { AuthProvider } from "@/components/providers/AuthProvider";

function Header() {
  const { onOpen: openChat } = useChatStore();
  const { user, logout } = useAuthStore();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  const showChatButton = user?.role === "student";
  const initials = (() => {
    if (!user) return "";
    const f = (user.firstName || "").toString().trim();
    const l = (user.lastName || "").toString().trim();
    if (f && l) return (f[0] + l[0]).toUpperCase();
    if (f) return f.substring(0, 2).toUpperCase();
    if (l) return l.substring(0, 2).toUpperCase();
    if (user.email) return user.email.substring(0, 2).toUpperCase();
    return "";
  })();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container max-w-7xl flex h-14 items-center">
        {/* Mobile Nav (Hiện < 768px) */}
        <MobileNav />

        {/* Desktop Nav (Hiện > 768px) */}
        <div className="hidden md:flex items-center gap-6">
          <Link href="/dashboard" className="flex items-center gap-2">
            <BookA className="h-6 w-6 text-primary" />
            <h1 className="text-lg font-bold">Trợ lý học tập</h1>
          </Link>
          <MainNav />
        </div>

        {/* Actions bên phải */}
        <div className="flex flex-1 items-center justify-end gap-2 md:gap-4">
          {/* ✨ Ẩn/hiện nút Chat dựa trên vai trò */}
          {showChatButton && (
            <Button
              variant="ghost"
              size="icon"
              onClick={openChat}
              aria-label="Mở Chat"
            >
              <Bot className="h-5 w-5" />
            </Button>
          )}

          {/* Avatar (Giờ lấy từ store) */}
          <Avatar className="h-9 w-9">
            <AvatarImage
              src={user?.avatarUrl || ""}
              alt={user?.email || user?.firstName || "avatar"}
            />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>

          {/* Nút Logout */}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            aria-label="Đăng xuất"
          >
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  );
}

// --- Layout Chính (Đã cập nhật Auth) ---
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    // BỌC MỌI THỨ BẰNG <AuthProvider>
    <AuthProvider>
      <div className="min-h-screen flex flex-col">
        {/* Header cố định */}
        <Header />

        {/* Nội dung trang (có padding) */}
        <main className="flex-1 p-4 md:p-8 container max-w-7xl">
          {children}
        </main>

        {/* ChatPanel (nằm ngoài main) */}
        <ChatPanel />
      </div>
    </AuthProvider>
  );
}
