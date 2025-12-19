/* eslint-disable @typescript-eslint/no-explicit-any */
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import api from '../api';
import { toast } from 'sonner';

export type User = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'student' | 'teacher' | 'admin';
  avatarUrl?: string;
};

export type AuthState = {
  user: User | null;
  accessToken: string | null;
  bootstrapped: boolean;

  setAccessToken: (t: string | null) => void;
  setUser: (u: User | null) => void;
  clearAuth: () => void;

  bootstrap: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

export const useAuthStore = create(
  persist<AuthState>(
    (set, get) => ({
      user: null,
      accessToken: null,
      bootstrapped: false,

      setAccessToken: (t) => set({ accessToken: t }),
      setUser: (u) => set({ user: u }),
      clearAuth: () => set({ user: null, accessToken: null }),

      //When refresh -> get AccessToken -> set user
      bootstrap: async() => {
        if (get().bootstrapped) return;
        try{
          try{
            const res = await api.post('/auth/refresh');
            const { user, accessToken } = res.data.data;
            if (user && accessToken) set({ user: user, accessToken: accessToken});
          } catch{
            //ignore
          }
          if (get().accessToken) {
            const me = await api.get("/auth/me");
            const u = me.data?.data;
            set({
              user: {
                id: u._id || u.id,
                email: u.email,
                firstName: u.firstName,
                lastName: u.lastName,
                role: u.role,
                avatarUrl: u.avatarUrl
              },
            });
          }else{
            set({ user: null, accessToken: null });
          }
        }finally{
          set({ bootstrapped: true });
        }
      },

      login: async (email, password) => {
        try {
          const res = await api.post('/auth/login', { email, password });
          const { user, accessToken } = res.data.data;
          set({ 
            user: { 
                id: user._id || user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role,
                avatarUrl: user.avatarUrl
            }, 
            accessToken: accessToken,
            bootstrapped: true
          });

          toast.success("Đăng nhập thành công!");
        } catch (error: any) {
          const msg = error.response?.data?.message || "Đăng nhập thất bại";
          toast.error(msg);
          throw error;
        }
      },

      logout: async () => {
        try{
          await api.post('/auth/logout');
        }catch{
          //ignore
        }
        finally {
          set({ user: null, accessToken: null, bootstrapped: true });
          toast.info("Đã đăng xuất");
        }
        // Có thể thêm router.push('/login') ở component gọi hàm này
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);