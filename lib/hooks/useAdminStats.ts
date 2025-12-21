import { useQuery } from "@tanstack/react-query";
import api from "../api";

export const useAdminStats = () => {
  return useQuery({
    queryKey: ["adminStats"],
    queryFn: async () => {
      const res = await api.get("/admin/stats");
      return res.data as {
        users: number;
        courses: number;
        tasks: number;
        schedules: number;
        messages: number;
      };
    },
  });
};
