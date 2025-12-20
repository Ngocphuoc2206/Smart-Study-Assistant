import { useQuery } from "@tanstack/react-query";
import api from "../api";

export type AdminUser = {
  _id?: string;
  id?: string;
  email: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  role: "student" | "teacher" | "admin";
  avatarUrl?: string;
  status?: "active" | "inactive";
};

export const useAdminUsers = (params: {
  page: number;
  limit: number;
  search: string;
}) => {
  const { page, limit, search } = params;

  return useQuery({
    queryKey: ["adminUsers", page, limit, search],
    queryFn: async () => {
      const res = await api.get("/admin/users", {
        params: { page, limit, search },
      });
      return res.data as {
        items: AdminUser[];
        page: number;
        limit: number;
        total: number;
        totalPages: number;
      };
    },
  });
};
