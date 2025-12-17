// lib/api.ts
import axios from 'axios';

// Tạo một instance (người bồi bàn chuyên dụng)
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001/api',
  withCredentials: true, // include cookies for session auth
  headers: {
    'Content-Type': 'application/json',
  },
});

// Đây là bước quan trọng: TỰ ĐỘNG GẮN TOKEN
// Mỗi khi gửi request đi, đoạn code này sẽ chạy
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    // Lấy token từ kho lưu trữ (localStorage)
    const storage = localStorage.getItem('auth-storage'); 
    if (storage) {
      const parsed = JSON.parse(storage);
      const token = parsed.state?.accessToken; // Lấy token ra
      
      // Nếu có token, gắn vào đầu tin nhắn để Backend biết đây là ai
      if (token) {
        config.headers.Authorization = `Bearer ${token}`; 
      }
    }
  }
  return config;
});

export default api;