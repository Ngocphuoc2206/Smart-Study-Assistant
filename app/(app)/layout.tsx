// app/(app)/layout.tsx
"use client"; 

import React, { useEffect } from "react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { BookA, Bot, LogOut } from "lucide-react"; // Import LogOut
import { useRouter } from "next/navigation"; // Import useRouter

import ChatPanel from "@/features/chat/ChatPanel";
import { MobileNav } from "@/components/layout/MobileNav";
import { MainNav } from "@/components/layout/MainNav";
import { useChatStore } from "@/lib/hooks/useChatStore";
import { useAuthStore } from "@/lib/hooks/useAuthStore"; // Import AuthStore
import { AuthProvider } from "@/components/providers/AuthProvider"; // Import AuthProvider

// Các import và logic toast từ P5
import { toast } from "sonner";
import { useNotifications } from "@/lib/hooks/useNotifications";
import { format, parseISO } from "date-fns";

// --- Component Header (Đã cập nhật Auth) ---
function Header() {
  const { onOpen: openChat } = useChatStore();
  const { user, logout } = useAuthStore(); // Lấy user và hàm logout
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push("/login"); // Chuyển về trang login
  };
  
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
          <Button
            variant="ghost"
            size="icon"
            onClick={openChat}
            aria-label="Mở Chat"
          >
            <Bot className="h-5 w-5" />
          </Button>
          
          {/* Avatar (Giờ lấy từ store) */}
          <Avatar className="h-9 w-9">
            <AvatarImage src={user?.avatar} alt={user?.username} />
            <AvatarFallback>{user?.username.substring(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          
          {/* Nút Logout */}
          <Button variant="ghost" size="icon" onClick={handleLogout} aria-label="Đăng xuất">
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  );
}


// --- Layout Chính (Đã cập nhật Auth) ---
export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {

  // Giả lập push (Yêu cầu P5)
  const { data } = useNotifications(); 
  
  useEffect(() => {
    if (data && data.upcoming.length > 0) {
      const firstUpcoming = data.upcoming[0];
      
      const timer = setTimeout(() => {
        toast.info(`Nhắc nhở: ${firstUpcoming.eventTitle}`, {
          description: `Sẽ diễn ra lúc ${format(parseISO(firstUpcoming.reminderTime), "HH:mm")}`,
          duration: 10000, // 10 giây
          action: {
            label: "Xem",
            onClick: () => {
              // (Bạn có thể dùng router.push('/notifications') ở đây)
              console.log("Xem thông báo");
            },
          },
        });
      }, 10000); // 10 giây
      
      return () => clearTimeout(timer);
    }
  }, [data]); // Chạy khi data thay đổi

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