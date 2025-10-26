// app/(app)/notifications/page.tsx
"use client";

import NotificationCenter from "@/features/notifications/NotificationCenter";

export default function NotificationsPage() {
  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">
        Trung tâm thông báo
      </h1>
      <NotificationCenter />
    </div>
  );
}