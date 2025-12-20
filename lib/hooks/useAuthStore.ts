// lib/hooks/useAuthStore.ts
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import api from '../api'; // Import người bồi bàn vừa tạo
import { toast } from 'sonner'; // Để hiện thông báo đẹp

// Định nghĩa kiểu dữ liệu User giống Backend trả về
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
  accessToken: string | null; // Cần thêm cái này để lưu chìa khóa
  
  // Hàm login giờ sẽ trả về Promise (vì cần chờ mạng)
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
          // Xử lý lỗi nếu sai pass hoặc server chết
          const msg = error.response?.data?.message || "Đăng nhập thất bại";
          toast.error(msg);
          throw error; // Ném lỗi để UI (trang Login) biết mà dừng loading
        }
      },

      logout: () => {
        set({ user: null, accessToken: null });
        toast.info("Đã đăng xuất");
        // Có thể thêm router.push('/login') ở component gọi hàm này
      },
    }),
    {
      name: 'auth-storage', // Tên key trong LocalStorage
      storage: createJSONStorage(() => localStorage),
    }
  )
);