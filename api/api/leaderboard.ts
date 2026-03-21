import type { NextApiRequest, NextApiResponse } from 'next';
import { query } from '../utils/db';
import { handleCors } from '../utils/session';
import type { LeaderboardEntry } from '../types';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // 处理CORS
  if (handleCors(req, res)) return;

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { rows } = await query(`
      SELECT u.id, u.nickname,
             COALESCE(SUM(p.score), 0)::int AS "totalScore",
             COUNT(p.id)::int AS "completedLevels"
      FROM users u
      LEFT JOIN progress p ON u.id = p.user_id AND p.score > 0
      GROUP BY u.id, u.nickname
      HAVING COALESCE(SUM(p.score), 0) > 0
      ORDER BY "totalScore" DESC
      LIMIT 50
    `);

    const leaderboard: LeaderboardEntry[] = rows;
    res.status(200).json(leaderboard);
  } catch (error) {
    console.error('Failed to fetch leaderboard:', error);
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
}
