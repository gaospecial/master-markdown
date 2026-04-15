import axios from 'axios';
import type { User, Progress, LeaderboardEntry } from './types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.bio-spring.top/api/v1';
const SUBMIT_SECRET = process.env.SUBMIT_SECRET || 'md-master-default-secret';

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 自动附加 Bearer token
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// HMAC-SHA256 签名
async function generateSignature(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(SUBMIT_SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(data));
  return Array.from(new Uint8Array(signature))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// Token 管理
export const tokenManager = {
  get: () => typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null,
  set: (token: string) => localStorage.setItem('auth_token', token),
  remove: () => localStorage.removeItem('auth_token'),
};

// Auth API
export const authApi = {
  getAuthorizeUrl: (redirectUri: string) =>
    api.get<{ data: { url: string; state: string } }>(`/auth/oauth/github/authorize?redirect_uri=${encodeURIComponent(redirectUri)}`).then(r => r.data),
};

// User API (md-master module)
export const userApi = {
  getMe: () => api.get<{ data: User }>('/md-master/me').then(r => r.data),
};

// Progress API (md-master module)
export const progressApi = {
  getScore: () => api.get<{ data: { total_score: number; completed_levels: number; progress: Progress[] } }>('/md-master/progress/score').then(r => r.data),
  submitScore: async (levelId: number, score: number, code?: string) => {
    const timestamp = Date.now();
    const payload = `${levelId}:${score}:${timestamp}`;
    const signature = await generateSignature(payload);
    return api.post<{ data: { success: boolean; progress: Progress } }>('/md-master/progress/submit', {
      levelId, score, code, timestamp, signature,
    }).then(r => r.data);
  },
};

// Leaderboard API (md-master module)
export const leaderboardApi = {
  getAll: () => api.get<{ data: LeaderboardEntry[] }>('/md-master/leaderboard').then(r => r.data),
};

export default api;
