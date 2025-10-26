// app/(app)/events/page.tsx
"use client";

import EventList from "@/features/events/EventList";

export default function EventsPage() {
  return (
    <div className="container mx-auto">
      <h1 className="text-3xl font-bold mb-6">
        Quản lý Sự kiện
      </h1>
      <EventList />
    </div>
  );
}