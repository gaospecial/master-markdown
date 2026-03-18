import axios from 'axios';
import type { User, Progress, LeaderboardEntry } from '../types';

// Use environment variable for API URL, fallback to relative path for local dev
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

// User API
export const userApi = {
  getMe: () => api.get<{ user: User }>('/user/me').then(r => r.data),
  setNickname: (nickname: string) => api.post<{ user: User }>('/user/nickname', { nickname }).then(r => r.data),
};

// Progress API
export const progressApi = {
  getAll: () => api.get<Progress[]>('/progress').then(r => r.data),
  getScore: () => api.get<{ totalScore: number; completedLevels: number; progress: Progress[] }>('/progress/score').then(r => r.data),
  // 前端验证后，直接提交分数到后端记录
  submitScore: (levelId: number, score: number, code?: string) =>
    api.post<{ success: boolean; progress: Progress }>('/progress/submit', { levelId, score, code }).then(r => r.data)
};

// Leaderboard API
export const leaderboardApi = {
  getAll: () => api.get<LeaderboardEntry[]>('/leaderboard').then(r => r.data),
};

export default api;
