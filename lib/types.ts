export interface User {
  id: number;
  username: string;
  display_name: string | null;
  nickname: string | null;
  avatar_url: string | null;
  modules: string[];
  created_at: string;
}

export interface Progress {
  id: number;
  user_id: number;
  level_id: number;
  score: number;
  attempts: number;
  code?: string;
  completed_at?: string;
}

export interface LeaderboardEntry {
  id: number;
  nickname: string;
  avatar_url: string | null;
  total_score: number;
  completed_levels: number;
}

export interface LevelContent {
  task?: string;
  question?: string;
  instruction?: string;
  template?: string;
  options?: string[];
  correctAnswer?: string;
}

export interface Level {
  id: number;
  title: string;
  description: string;
  type: string;
  difficulty: number;
  stage: number;
  stageName: string;
  order: number;
  content: string;
  expectedAnswer: string;
  hints: string;
  maxScore: number;
  taskType: string;
}
