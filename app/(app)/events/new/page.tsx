// app/(app)/events/new/page.tsx
"use client";

import EventForm from "@/features/events/EventForm";
import { EventFormValues } from "@/features/events/eventSchema";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

// Component con để xử lý logic, bọc trong Suspense
function NewEventPageContent() {
  const searchParams = useSearchParams();
  const type = searchParams.get('type'); // Lấy ?type=exam từ URL

  // Chuẩn bị defaultValues
  const defaultValues: Partial<EventFormValues> = {};
  if (type === 'exam' || type === 'assignment' || type === 'lecture' || type === 'other') {
    defaultValues.type = type;
  }

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">
        Tạo sự kiện mới
      </h1>
      <EventForm defaultValues={defaultValues} />
    </div>
  );
}

// Component Trang chính
export default function NewEventPage() {
  return (
    // Cần Suspense vì useSearchParams()
    <Suspense fallback={<div>Đang tải...</div>}>
      <NewEventPageContent />
    </Suspense>
  );
}