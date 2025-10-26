// lib/hooks/useAuthStore.ts
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

type User = {
  id: string;
  username: string;
  avatar: string;
};

type AuthState = {
  user: User | null;
  login: (user: User) => void;
  logout: () => void;
};

// Dùng 'persist' để lưu trạng thái vào localStorage
// Khi người dùng F5, họ vẫn sẽ đăng nhập
export const useAuthStore = create(
  persist<AuthState>(
    (set) => ({
      user: null,
      login: (user) => set({ user }),
      logout: () => set({ user: null }),
    }),
    {
      name: 'auth-storage', // Tên key trong localStorage
      storage: createJSONStorage(() => localStorage),
    }
  )
);