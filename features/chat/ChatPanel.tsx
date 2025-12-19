/* eslint-disable @typescript-eslint/no-explicit-any */
// features/chat/ChatPanel.tsx
"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MessageBubble } from "./MessageBubble";
import { NLPPreviewDialog } from "./NLPPreviewDialog";
import { useChatStore } from "@/lib/hooks/useChatStore";
import { mockParseNLP, NLPResult } from "./mockNLP";
import { Bot, Send, Loader2 } from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import api from "@/lib/api";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
};

const QUICK_SUGGESTIONS = [
  "Thêm kỳ thi Toán 12/12 9h",
  "Deadline AI thứ 6 23:59",
  "Nhắc trước 1 ngày",
];

export default function ChatPanel() {
  const { isOpen, onClose } = useChatStore();

  const [messages, setMessages] = useState<Message[]>([
    {
      id: uuidv4(),
      role: "assistant",
      content:
        'Xin chào! Bạn cần tôi giúp gì? (Ví dụ: "Thêm bài tập AI thứ 6 này")',
      timestamp: new Date().toISOString(),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const [pendingIntent, setPendingIntent] = useState<string | null>(null);
  const [pendingEntities, setPendingEntities] = useState<any>(null);

  //normal channel
  const normalizeChannel = (text: string) => {
    const t = text.trim().toLowerCase();
    if (t === "email" || t.includes("email")) return "Email";
    if (
      t === "in-app" ||
      t === "inapp" ||
      t.includes("in-app") ||
      t.includes("app")
    )
      return "In-app";
    return null;
  };

  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = scrollAreaRef.current;
    if (!root) return;

    const viewport = root.querySelector(
      '[data-slot="scroll-area-viewport"]'
    ) as HTMLDivElement | null;

    if (!viewport) return;

    viewport.scrollTo({
      top: viewport.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, isLoading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = inputValue.trim();
    if (!text) return;

    const userMessage: Message = {
      id: uuidv4(),
      role: "user",
      content: text,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);
    try {
      const selectedChannel = pendingIntent ? normalizeChannel(text) : null;
      const res = await api.post("/chat/message", {
        message: text,
        pendingIntent,
        pendingEntities,
        selectedChannel: selectedChannel ?? undefined,
      });

      const data = res.data?.data;
      const botText =
        data?.reply ?? data?.responseText ?? "Mình chưa có phản hồi.";

      const botMessage: Message = {
        id: uuidv4(),
        role: "assistant",
        content: botText,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, botMessage]);
      if (data?.needsFollowUp) {
        setPendingIntent(data.pendingIntent);
        setPendingEntities(data.pendingEntities);
      } else {
        setPendingIntent(null);
        setPendingEntities(null);
      }
    } catch (err: any) {
      const status = err?.response?.status;
      const msg =
        status === 401
          ? "Bạn cần đăng nhập trước khi chat."
          : err?.response?.data?.message || "Có lỗi xảy ra.";

      setMessages((prev) => [
        ...prev,
        {
          id: uuidv4(),
          role: "assistant",
          content: msg,
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInputValue(suggestion);
    // Tùy chọn: có thể submit ngay lập tức
    // handleSubmit(suggestion);
  };

  return (
    <>
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent className="w-full sm:w-[540px] h-dvh flex flex-col p-0 overflow-hidden">
          <SheetHeader className="p-6 border-b">
            <SheetTitle className="flex items-center gap-2">
              <Bot /> Trợ lý học tập
            </SheetTitle>
            <SheetDescription>
              Nhập yêu cầu bằng ngôn ngữ tự nhiên.
            </SheetDescription>
          </SheetHeader>

          {/* A11y: Thông báo tin nhắn mới */}
          <ScrollArea
            className="flex-1 p-4 min-h-0"
            ref={scrollAreaRef}
            aria-live="polite"
          >
            <div className="space-y-4">
              {messages.map((msg) => (
                <MessageBubble
                  key={msg.id}
                  role={msg.role}
                  content={msg.content}
                  timestamp={msg.timestamp}
                />
              ))}
              {isLoading && (
                <MessageBubble
                  role="assistant"
                  content="Đang xử lý..."
                  timestamp={new Date().toISOString()}
                />
              )}
            </div>
          </ScrollArea>

          <div className="p-4 border-t bg-background">
            {/* Gợi ý nhanh (Chips) */}
            <div className="flex flex-wrap gap-2 mb-2">
              {QUICK_SUGGESTIONS.map((q) => (
                <Badge
                  key={q}
                  variant="outline"
                  className="cursor-pointer"
                  onClick={() => handleSuggestionClick(q)}
                >
                  {q}
                </Badge>
              ))}
            </div>

            {/* Ô nhập */}
            <form onSubmit={handleSubmit} className="flex items-center gap-2">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Ví dụ: Thêm bài tập AI thứ 6..."
                disabled={isLoading}
              />
              <Button
                type="submit"
                size="icon"
                disabled={isLoading || !inputValue.trim()}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </form>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
