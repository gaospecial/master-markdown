import type { NextApiRequest, NextApiResponse } from 'next';
import { query } from '../../../db/db';
import { ensureUser, handleCors } from '../../../db/session';
import type { Progress } from '../../../lib/types';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // 处理CORS
  if (handleCors(req, res)) return;

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const userId = await ensureUser(req, res);

    const { rows } = await query(
      'SELECT id, user_id AS "userId", level_id AS "levelId", score, attempts, code, completed_at AS "completedAt" FROM progress WHERE user_id = $1',
      [userId]
    );

    const progress: Progress[] = rows;
    const totalScore = progress.reduce((sum, p) => sum + p.score, 0);

    res.status(200).json({
      totalScore,
      completedLevels: progress.length,
      progress
    });
  } catch (error) {
    console.error('Failed to fetch score:', error);
    res.status(500).json({ error: 'Failed to fetch score' });
  }
}
