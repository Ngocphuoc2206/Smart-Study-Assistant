// lib/api.ts
import axios from "axios";
import { useAuthStore } from "./hooks/useAuthStore";

const baseURL =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:4000/api";

const api = axios.create({
  baseURL,
  withCredentials: true, // include cookies for session auth
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    // Lấy token từ kho lưu trữ (localStorage)
    const token = useAuthStore.getState().accessToken;
    if (token) {
      config.headers = config.headers ?? {};
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

//Response 401 /auth/refresh
let isRefreshing = false;
let queue: Array<(token: string | null) => void> = [];

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config;
    if (!original) throw err;
    const status = err.response?.status;
    const url = String(original.url || "");
    const skip =
      url.includes("/auth/login") ||
      url.includes("/auth/register") ||
      url.includes("/auth/refresh") ||
      url.includes("/auth/logout");

    if (status === 401 && !skip && !original._retry) {
      original._retry = true;

      if (isRefreshing) {
        return new Promise((resolve) => {
          queue.push((newToken) => {
            if (newToken) {
              original.headers.Authorization = `Bearer ${newToken}`;
            }
            resolve(api(original));
          });
        });
      }

      isRefreshing = true;
      try {
        const r = await api.post("/auth/refresh");
        const newToken = (r.data.data?.accessToken as string) || undefined;
        if (!newToken) throw err;
        useAuthStore.getState().setAccessToken(newToken);
        queue.forEach((cb) => cb(newToken));
        queue = [];
        original.headers.Authorization = `Bearer ${newToken}`;
        return api(original);
      } catch (err) {
        useAuthStore.getState().clearAuth();
        queue.forEach((cb) => cb(null));
        queue = [];
        throw err;
      } finally {
        isRefreshing = false;
      }
    }
    throw err;
  }
);

export default api;
