import { useQuery } from "@tanstack/react-query";
import api from "../api";

export const useAdminNlpLogs = (params: {
  page: number;
  limit: number;
  search: string;
}) => {
  const { page, limit, search } = params;

  return useQuery({
    queryKey: ["adminNlpLogs", page, limit, search],
    queryFn: async () => {
      const res = await api.get("/admin/nlp/logs", {
        params: { page, limit, search },
      });
      return res.data.data;
    },
  });
};
