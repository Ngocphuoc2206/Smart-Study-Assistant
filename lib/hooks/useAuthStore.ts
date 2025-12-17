/* eslint-disable @typescript-eslint/no-explicit-any */
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import api from '../api';
import { toast } from 'sonner';

type User = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'student' | 'teacher' | 'admin';
  avatarUrl?: string;
};

type AuthState = {
  user: User | null;
  accessToken: string | null;
  login: (email: string, password: string) => Promise<void>; 
  logout: () => void;
};

export const useAuthStore = create(
  persist<AuthState>(
    (set) => ({
      user: null,
      accessToken: null,

      login: async (email, password) => {
        try {
          // 1. GỌI API THẬT
          // Backend route là /api/auth/login
          const res = await api.post('/auth/login', { email, password });
          
          // 2. LẤY DỮ LIỆU TỪ BACKEND
          // Cấu trúc trả về thường là: { success: true, data: { user: ..., accessToken: ... } }
          const { user, accessToken } = res.data.data;

          // 3. LƯU VÀO STORE (Zustand sẽ tự lưu vào localStorage)
          set({ 
            user: { 
                id: user._id || user.id, // MongoDB dùng _id, ta map sang id cho tiện
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role,
                avatarUrl: user.avatarUrl
            }, 
            accessToken: accessToken 
          });

          toast.success("Đăng nhập thành công!");
        } catch (error: any) {
          const msg = error.response?.data?.message || "Đăng nhập thất bại";
          toast.error(msg);
          throw error;
        }
      },

      logout: () => {
        set({ user: null, accessToken: null });
        toast.info("Đã đăng xuất");
        // Có thể thêm router.push('/login') ở component gọi hàm này
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);