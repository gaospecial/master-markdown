import { create } from 'zustand';
import type { User } from '../lib/types';
import { userApi, authApi, tokenManager } from '../lib/api';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
  fetchUser: () => Promise<void>;
  loginWithGitHub: () => Promise<void>;
  logout: () => void;
  setNickname: (nickname: string) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  error: null,

  fetchUser: async () => {
    const token = tokenManager.get();
    if (!token) {
      set({ user: null, isAuthenticated: false, isLoading: false });
      return;
    }
    try {
      set({ isLoading: true, error: null });
      const response = await userApi.getMe();
      set({
        user: response.data,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      console.error('Failed to fetch user:', error);
      tokenManager.remove();
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
    }
  },

  loginWithGitHub: async () => {
    const redirectUri = `${window.location.origin}/auth/callback`;
    try {
      const response = await authApi.getAuthorizeUrl(redirectUri);
      window.location.href = response.data.url;
    } catch (error) {
      console.error('Failed to get GitHub authorize URL:', error);
      set({ error: '无法发起 GitHub 登录' });
    }
  },

  logout: () => {
    tokenManager.remove();
    set({ user: null, isAuthenticated: false, error: null });
    window.location.href = '/';
  },

  setNickname: async (nickname: string) => {
    set({ error: '昵称修改功能待开发' });
    throw new Error('昵称修改功能待开发');
  },
}));
