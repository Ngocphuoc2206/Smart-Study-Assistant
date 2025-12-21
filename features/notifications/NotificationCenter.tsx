/* eslint-disable @typescript-eslint/no-explicit-any */
// features/notifications/NotificationCenter.tsx
"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  useNotifications,
  useNotificationMutations,
  NotificationItem,
} from "@/lib/hooks/useNotifications";
import { useEffect } from "react";
import { getSocket } from "@/lib/socket";
import { useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  Bell,
  BellOff,
  Check,
  Clock,
  Laptop,
  Mail,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { vi } from "date-fns/locale";
import { useAuthStore } from "@/lib/hooks/useAuthStore";

export default function NotificationCenter() {
  const { data, isLoading, isError } = useNotifications();
  const { markAsReadMutation, snoozeMutation } = useNotificationMutations();
  const { user } = useAuthStore.getState();
  const queryClient = useQueryClient();

  useEffect(() => {
    const userId = user?.id;
    if (!userId) return;
    const socket = getSocket();
    socket.emit("auth", { userId });
    const handler = (payload: any) => {
      queryClient.setQueryData(["notifications"], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          sent: [payload, ...old.sent],
        };
      });
    };
    socket.on("notification", handler);
    return () => {
      socket.off("notification", handler);
    };
  });

  const renderList = (
    items: NotificationItem[] | undefined,
    isUpcomingList: boolean
  ) => {
    // 1. Loading
    if (isLoading) {
      return (
        <div className="space-y-3">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      );
    }
    // 2. Lỗi
    if (isError) {
      return (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Lỗi</AlertTitle>
          <AlertDescription>Không thể tải thông báo.</AlertDescription>
        </Alert>
      );
    }
    // 3. Trống
    if (!items || items.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center text-center text-muted-foreground py-10">
          <BellOff className="h-12 w-12 mb-2" />
          <p className="font-medium">Không có thông báo nào</p>
        </div>
      );
    }

    // 4. Có dữ liệu
    return (
      <ul className="space-y-3">
        {items.map((notif) => (
          <NotificationCard
            key={notif.id}
            notification={notif}
            isUpcoming={isUpcomingList}
            onMarkAsRead={() => markAsReadMutation.mutate(notif.id)}
            onSnooze={(duration) =>
              snoozeMutation.mutate({ id: notif.id, duration })
            }
          />
        ))}
      </ul>
    );
  };

  return (
    <Tabs defaultValue="upcoming" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="upcoming">
          <span className="mr-2">Sắp đến hạn</span>
          {data?.upcoming.length ? <Badge>{data.upcoming.length}</Badge> : null}
        </TabsTrigger>
        <TabsTrigger value="sent">Đã gửi</TabsTrigger>
      </TabsList>

      <TabsContent value="upcoming">
        <Card>
          <CardContent className="p-4 md:p-6">
            {renderList(data?.upcoming, true)}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="sent">
        <Card>
          <CardContent className="p-4 md:p-6">
            {renderList(data?.sent, false)}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}

// --- Component Card Phụ ---
interface NotificationCardProps {
  notification: NotificationItem;
  isUpcoming: boolean;
  onMarkAsRead: () => void;
  onSnooze: (duration: "hour" | "day") => void;
}

function NotificationCard({
  notification,
  isUpcoming,
  onMarkAsRead,
  onSnooze,
}: NotificationCardProps) {
  const { channel, eventTitle, reminderTime } = notification;

  const getIcon = () => {
    switch (channel) {
      case "email":
        return <Mail className="h-5 w-5" />;
      case "inapp":
      default:
        return <Bell className="h-5 w-5" />;
    }
  };

  const formattedTime = format(
    parseISO(reminderTime),
    "HH:mm, EEEE, dd/MM/yyyy",
    { locale: vi }
  );

  return (
    <li className="flex items-start gap-4 p-4 border rounded-lg">
      <div className="text-primary mt-1">{getIcon()}</div>

      <div className="flex-1">
        <p className="font-medium">{eventTitle}</p>
        <p className="text-sm text-muted-foreground flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5" />
          {isUpcoming ? "Sẽ nhắc vào:" : "Đã nhắc lúc:"} {formattedTime}
        </p>

        {/* Actions (Yêu cầu 2, 3) */}
        {isUpcoming && (
          <div className="flex gap-2 mt-3">
            <Button
              size="sm"
              variant="outline"
              onClick={() => onSnooze("hour")}
            >
              +1 giờ
            </Button>
            <Button size="sm" variant="outline" onClick={() => onSnooze("day")}>
              +1 ngày
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="text-muted-foreground"
              onClick={onMarkAsRead}
            >
              <Check className="h-4 w-4 mr-1.5" />
              Đánh dấu đã xem
            </Button>
          </div>
        )}
      </div>
    </li>
  );
}
