// components/providers.tsx
"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import React from "react"; // Phải import React (hoặc useState)

export function Providers({ children }: { children: React.ReactNode }) {
  
  // ✅ ĐÃ SỬA: Di chuyển vào BÊN TRONG function
  // Dùng useState để đảm bảo client chỉ được tạo 1 lần
  const [queryClient] = React.useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}