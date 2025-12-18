// lib/hooks/useReminders.ts
"use client";

import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";

export const useReminders = () => {
  return useQuery({
    queryKey: ['reminders'],
    queryFn: async () => {
      const res = await api.get('/reminders');
      return res.data?.data || [];
    },
    staleTime: 1000 * 60 * 5, // Cache 5 phút
  });
};