"use client";

import { useEffect } from "react";
import { getSocket } from "@/lib/socket";
import { useAuthStore } from "@/lib/hooks/useAuthStore";

export default function SocketProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useAuthStore.getState();
  const userId = user?.id;

  useEffect(() => {
    const socket = getSocket();
    if (!userId) return;
    socket.emit("auth", { userId });
  }, [userId]);

  return <>{children}</>;
}
