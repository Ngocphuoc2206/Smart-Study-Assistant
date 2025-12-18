// lib/api.ts
import { logDebug } from '@/shared/logger';
import axios from 'axios';
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001/api',
  withCredentials: true, // include cookies for session auth
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    // Lấy token từ kho lưu trữ (localStorage)
    const storage = localStorage.getItem('auth-storage'); 
    if (storage) {
      logDebug("[Storage] Auth-Storage: ", storage);
      const parsed = JSON.parse(storage);
      const token = parsed.state?.accessToken; // Get token
      if (token) {
        config.headers.Authorization = `Bearer ${token}`; 
      }
    }
  }
  return config;
});

export default api;