import { useQuery } from "@tanstack/react-query";
import api from "../api";

export const useAdminAnalytics = (days: number) =>
  useQuery({
    queryKey: ["adminAnalytics", days],
    queryFn: async () => {
      const res = await api.get("/admin/analytics", { params: { days } });
      return res.data.data as {
        rangeDays: number;
        intents: { intent: string; count: number; percent: number }[];
        activity: { date: string; messages: number }[];
      };
    },
  });
