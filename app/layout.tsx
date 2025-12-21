// app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers"; // Import
import { cn } from "@/lib/utils";

import { Toaster } from "@/components/ui/sonner";
import SocketProvider from "@/components/providers/SocketProvider";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "Trợ lý học tập",
  description: "Quản lý lịch học thông minh",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body
        className={cn(
          "min-h-screen bg-background font-sans antialiased",
          inter.variable
        )}
      >
        <Providers>
          <SocketProvider>{children}</SocketProvider>
          <Toaster richColors />
        </Providers>
      </body>
    </html>
  );
}
