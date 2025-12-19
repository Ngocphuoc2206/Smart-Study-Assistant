import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../api";

export const useCreateAdminUser = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      name: string;
      email: string;
      password: string;
      role?: string;
    }) => {
      const res = await api.post("/admin/users", payload);
      return res.data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["adminUser"] });
    },
  });
};

export const useUpdateAdminUser = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      id: string;
      name?: string;
      role?: string;
    }) => {
      const res = await api.patch(`/admin/users/${payload.id}`, payload);
      return res.data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["adminUsers"] }),
  });
};

export const useDeleteAdminUser = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/admin/users/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["adminUsers"] }),
  });
};
