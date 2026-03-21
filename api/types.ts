export interface User {
  id: string;
  nickname: string;
  createdAt: string;
}

export interface Progress {
  id: number;
  userId: string;
  levelId: number;
  score: number;
  attempts: number;
  code?: string;
  completedAt?: string;
}

export interface LeaderboardEntry {
  id: string;
  nickname: string;
  totalScore: number;
  completedLevels: number;
}
