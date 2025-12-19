// app/(app)/dashboard/page.tsx
"use client";

// Các import không cần thiết đã bị xóa (Avatar, Button, Plus, v.v.)
import { CalendarWidget } from "@/components/dashboard/CalendarWidget";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { UpcomingList } from "@/components/dashboard/UpcomingList";
import { useUpcomingEvents } from "@/lib/hooks/useEvents";
import { useRouter } from "next/navigation";
import { useChatStore } from "@/lib/hooks/useChatStore";

export default function DashboardPage() {
  const router = useRouter();
  const { onOpen: openChat } = useChatStore();
  
  // Lấy dữ liệu cho <UpcomingList>
  const { 
    data: upcomingEvents, 
    isLoading: isLoadingUpcoming, 
    isError: isErrorUpcoming 
  } = useUpcomingEvents(5);

  // --- Các hàm xử lý (để truyền cho QuickActions) ---
  const handleCreateExam = () => {
    // Chuyển đến trang tạo event (Prompt 3)
    router.push('/events/new?type=exam');
  };
  
  const handleCreateAssignment = () => {
    // Chuyển đến trang tạo event (Prompt 3)
    router.push('/events/new?type=assignment');
  };
  
  const handleOpenChat = () => {
    openChat();
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      
      {/* Cột trái (grow) */}
      <div className="flex-1 space-y-6">
          {/* Quick Actions (chỉ hiển thị trên mobile/tablet) */}
        <div className="lg:hidden">
          <QuickActions
            onCreateExam={handleCreateExam}
            onCreateAssignment={handleCreateAssignment}
            onOpenChat={handleOpenChat}
          />
        </div>
        
        {/* Lịch (đã bao gồm list theo ngày) */}
        <CalendarWidget />
      </div>

      {/* Cột phải (w-96) */}
      <aside className="w-full lg:w-96 flex-shrink-0 space-y-6">
        {/* Sắp đến hạn */}
        <UpcomingList
          events={upcomingEvents}
          isLoading={isLoadingUpcoming}
          isError={isErrorUpcoming}
        />
        
        {/* Quick Actions (chỉ hiển thị trên desktop) */}
        <div className="hidden lg:block">
            <QuickActions
            onCreateExam={handleCreateExam}
            onCreateAssignment={handleCreateAssignment}
            onOpenChat={handleOpenChat}
          />
        </div>
      </aside>
    </div>
  );
}