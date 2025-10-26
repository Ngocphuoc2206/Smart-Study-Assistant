// components/layout/MobileNav.tsx
"use client";

import { useState } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { BookA, Menu } from "lucide-react";
import { MainNav } from "./MainNav";

export function MobileNav() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden" // Chỉ hiện trên mobile
        >
          <Menu className="h-5 w-5" />
          <span className="sr-only">Mở menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[300px]">
        <div className="flex items-center gap-2 mb-6">
          <BookA className="h-6 w-6 text-primary" />
          <h1 className="text-xl font-bold">Trợ lý học tập</h1>
        </div>
        {/* Dùng MainNav và truyền hàm đóng Sheet */}
        <MainNav onLinkClick={() => setIsOpen(false)} />
      </SheetContent>
    </Sheet>
  );
}
