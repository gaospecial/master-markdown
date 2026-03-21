import axios from 'axios';
import type { User, Progress, LeaderboardEntry } from '../types';

// Use environment variable for API URL, fallback to relative path for same-domain deployment
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';
const SUBMIT_SECRET = import.meta.env.VITE_SUBMIT_SECRET || 'md-master-default-secret';

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

// ===== HMAC-SHA256 签名（防止伪造成绩提交）=====
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

// User API
export const userApi = {
  getMe: () => api.get<{ user: User }>('/user/me').then(r => r.data),
  setNickname: (nickname: string) => api.post<{ user: User }>('/user/nickname', { nickname }).then(r => r.data),
};

// Progress API
export const progressApi = {
  // 获取用户进度 + 总分（单次请求，后端 /progress/score 已包含完整 progress 数组）
  getScore: () => api.get<{ totalScore: number; completedLevels: number; progress: Progress[] }>('/progress/score').then(r => r.data),
  // 前端验证后，提交带签名的分数到后端记录
  submitScore: async (levelId: number, score: number, code?: string) => {
    const timestamp = Date.now();
    const payload = `${levelId}:${score}:${timestamp}`;
    const signature = await generateSignature(payload);
    return api.post<{ success: boolean; progress: Progress }>('/progress/submit', {
      levelId, score, code, timestamp, signature
    }).then(r => r.data);
  }
};

// Leaderboard API
export const leaderboardApi = {
  getAll: () => api.get<LeaderboardEntry[]>('/leaderboard').then(r => r.data),
};

export default api;
