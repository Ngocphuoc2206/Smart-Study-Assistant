// lib/hooks/useAuthStore.ts
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

// ✨ Định nghĩa các vai trò
export type UserRole = 'student' | 'lecturer' | 'admin';

type User = {
  id: string;
  username: string;
  avatar: string;
  role: UserRole; // ✨ Thêm vai trò vào thông tin user
};

type AuthState = {
  user: User | null;
  // ✨ Cập nhật hàm login để nhận cả user
  login: (user: User) => void;
  logout: () => void;
};

export const useAuthStore = create(
  persist<AuthState>(
    (set) => ({
      user: null,
      login: (user) => set({ user }), // ✨ Lưu toàn bộ object user
      logout: () => set({ user: null }),
    }),
    {
      name: 'auth-storage', 
      storage: createJSONStorage(() => localStorage),
    }
  )
);