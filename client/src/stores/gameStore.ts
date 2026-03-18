import { create } from 'zustand';
import type { Level, Progress } from '../types';
import { progressApi } from '../api/client';
import { validateAnswer } from '../utils/validators';
import { levels as staticLevels } from '../data/levels';

interface GameState {
  levels: Level[];
  progress: Progress[];
  totalScore: number;
  completedLevels: number;
  isLoading: boolean;
  error: string | null;
  fetchLevels: () => void;
  fetchProgress: () => Promise<void>;
  submitAnswer: (levelId: number, code: string) => Promise<{ correct: boolean; score?: number; message?: string }>;
  getLevelStatus: (levelId: number) => { completed: boolean; score: number; attempts: number };
  getCurrentStage: () => number;
  isStageComplete: (stageId: number) => boolean;
  isAllComplete: () => boolean;
  getStageStats: (stageId: number) => { totalLevels: number; completedLevels: number; totalScore: number; maxScore: number; levels: Level[] };
  getStageLevels: (stageId: number) => Level[];
  isLastLevelInStage: (levelId: number) => boolean;
}

export const useGameStore = create<GameState>((set, get) => ({
  levels: [],
  progress: [],
  totalScore: 0,
  completedLevels: 0,
  isLoading: false,
  error: null,

  // 关卡数据现在是静态的，不需要从后端获取
  fetchLevels: () => {
    set({ levels: staticLevels, isLoading: false });
  },

  fetchProgress: async () => {
    try {
      // 单次请求获取全部进度数据（/progress/score 已包含 progress 数组）
      const scoreData = await progressApi.getScore();
      set({
        progress: scoreData.progress,
        totalScore: scoreData.totalScore,
        completedLevels: scoreData.completedLevels
      });
    } catch (error) {
      set({ error: 'Failed to load progress' });
    }
  },

  submitAnswer: async (levelId: number, code: string) => {
    const level = get().levels.find(l => l.id === levelId);
    if (!level) return { correct: false, message: '关卡不存在' };

    // 前端验证答案
    const result = validateAnswer(levelId, code, level);

    if (result.correct) {
      // 计算分数
      const status = get().getLevelStatus(levelId);
      const attempts = status.attempts + 1;
      let score = level.maxScore;
      if (attempts > 3) score = Math.floor(score * 0.9);

      // 提交分数到后端记录
      try {
        await progressApi.submitScore(levelId, score, code);
        await get().fetchProgress();
      } catch (error) {
        // 即使后端提交失败，前端验证结果仍然有效
        console.error('Failed to submit score to server:', error);
      }

      return {
        correct: true,
        score,
        message: result.message
      };
    }

    return {
      correct: false,
      message: result.message
    };
  },

  getLevelStatus: (levelId: number) => {
    const progress = get().progress.find(p => p.levelId === levelId);
    return {
      completed: !!progress && progress.score > 0,
      score: progress?.score || 0,
      attempts: progress?.attempts || 0
    };
  },

  getCurrentStage: () => {
    const { progress, levels } = get();
    if (progress.length === 0) return 1;

    const completedLevelIds = new Set(progress.filter(p => p.score > 0).map(p => p.levelId));
    const stages = [...new Set(levels.map(l => l.stage))].sort((a, b) => a - b);

    for (const stage of stages) {
      const stageLevels = levels.filter(l => l.stage === stage);
      const completedInStage = stageLevels.filter(l => completedLevelIds.has(l.id)).length;
      if (completedInStage < stageLevels.length) {
        return stage;
      }
    }

    return stages[stages.length - 1] || 1;
  },

  isStageComplete: (stageId: number) => {
    const { levels, progress } = get();
    const completedLevelIds = new Set(progress.filter(p => p.score > 0).map(p => p.levelId));
    const stageLevels = levels.filter(l => l.stage === stageId);
    if (stageLevels.length === 0) return false;
    return stageLevels.every(l => completedLevelIds.has(l.id));
  },

  isAllComplete: () => {
    const { levels, progress } = get();
    if (levels.length === 0) return false;
    const completedLevelIds = new Set(progress.filter(p => p.score > 0).map(p => p.levelId));
    return levels.every(l => completedLevelIds.has(l.id));
  },

  getStageStats: (stageId: number) => {
    const { levels, progress } = get();
    const stageLevels = levels.filter(l => l.stage === stageId);
    const completedLevelIds = new Set(progress.filter(p => p.score > 0).map(p => p.levelId));
    const completedInStage = stageLevels.filter(l => completedLevelIds.has(l.id));
    const totalScore = completedInStage.reduce((sum, l) => {
      const p = progress.find(p => p.levelId === l.id);
      return sum + (p?.score || 0);
    }, 0);
    const maxScore = stageLevels.reduce((sum, l) => sum + l.maxScore, 0);
    return {
      totalLevels: stageLevels.length,
      completedLevels: completedInStage.length,
      totalScore,
      maxScore,
      levels: stageLevels,
    };
  },

  getStageLevels: (stageId: number) => {
    return get().levels.filter(l => l.stage === stageId);
  },

  isLastLevelInStage: (levelId: number) => {
    const { levels } = get();
    const level = levels.find(l => l.id === levelId);
    if (!level) return false;
    const stageLevels = levels.filter(l => l.stage === level.stage);
    const maxOrder = Math.max(...stageLevels.map(l => l.order));
    return level.order === maxOrder;
  },
}));
