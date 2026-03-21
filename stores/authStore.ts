import { create } from 'zustand';
import type { User } from '../lib/types';
import { userApi } from '../lib/api';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
  fetchUser: () => Promise<void>;
  setNickname: (nickname: string) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  error: null,

  fetchUser: async () => {
    try {
      set({ isLoading: true, error: null });
      const data = await userApi.getMe();
      set({
        user: data.user,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      console.error('Failed to fetch user:', error);
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: '无法连接到服务器',
      });
    }
  },

  setNickname: async (nickname: string) => {
    try {
      set({ error: null });
      const data = await userApi.setNickname(nickname);
      set({ user: data.user });
    } catch (error: any) {
      // Extract error message properly
      let message = '设置昵称失败';
      
      if (error.response?.data?.error) {
        message = error.response.data.error;
      } else if (error.response?.data?.message) {
        message = error.response.data.message;
      } else if (error.message) {
        message = error.message;
      } else if (typeof error === 'string') {
        message = error;
      }
      
      // Ensure message is a string
      if (typeof message !== 'string') {
        message = '设置昵称失败';
      }
      
      set({ error: message });
      throw new Error(message);
    }
  },
}));
