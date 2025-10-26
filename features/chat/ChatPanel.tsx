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
import { v4 as uuidv4 } from 'uuid';

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
      role: 'assistant',
      content: 'Xin chào! Bạn cần tôi giúp gì? (Ví dụ: "Thêm bài tập AI thứ 6 này")',
      timestamp: new Date().toISOString(),
    }
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  // State cho Dialog
  const [previewData, setPreviewData] = useState<NLPResult | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Tự động cuộn
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({
        top: scrollAreaRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [messages]);

  const handleSubmit = async (text: string) => {
    if (!text.trim() || isLoading) return;

    // 1. Thêm tin nhắn của User
    const userMessage: Message = {
      id: uuidv4(),
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    // 2. Gọi Mock NLP
    try {
      const result = await mockParseNLP(text);
      
      // 3. Xử lý kết quả
      
      // 3a. Nếu đủ entity -> Mở Dialog
      if (result.intent === 'add_event' && !result.missingEntities) {
        setPreviewData(result);
        setIsPreviewOpen(true);
      }
      
      // 3b. Thêm tin nhắn trả lời của Bot
      const botMessage: Message = {
        id: uuidv4(),
        role: 'assistant',
        content: result.responseText,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, botMessage]);

    } catch (error) {
      // 3c. Xử lý lỗi
      const errorMessage: Message = {
        id: uuidv4(),
        role: 'assistant',
        content: "Đã có lỗi xảy ra. Vui lòng thử lại.",
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMessage]);
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
        <SheetContent className="w-full sm:w-[540px] flex flex-col p-0">
          <SheetHeader className="p-6 border-b">
            <SheetTitle className="flex items-center gap-2">
              <Bot /> Trợ lý học tập
            </SheetTitle>
            <SheetDescription>
              Nhập yêu cầu bằng ngôn ngữ tự nhiên.
            </SheetDescription>
          </SheetHeader>
          
          {/* A11y: Thông báo tin nhắn mới */}
          <ScrollArea className="flex-1 p-4" ref={scrollAreaRef} aria-live="polite">
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
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSubmit(inputValue);
              }}
              className="flex items-center gap-2"
            >
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Ví dụ: Thêm bài tập AI thứ 6..."
                disabled={isLoading}
              />
              <Button type="submit" size="icon" disabled={isLoading || !inputValue.trim()}>
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </form>
          </div>
        </SheetContent>
      </Sheet>
      
      {/* Dialog xem trước */}
      <NLPPreviewDialog
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        data={previewData}
      />
    </>
  );
}