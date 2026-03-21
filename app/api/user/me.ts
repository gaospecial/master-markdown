import type { NextApiRequest, NextApiResponse } from 'next';
import { query } from '../../../db/db';
import { ensureUser, handleCors } from '../../../db/session';
import type { User } from '../../../lib/types';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // 处理CORS
  if (handleCors(req, res)) return;

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const userId = await ensureUser(req, res);

    const { rows } = await query(
      'SELECT id, nickname, created_at AS "createdAt" FROM users WHERE id = $1',
      [userId]
    );

    const user: User = rows[0];
    res.status(200).json({ user });
  } catch (error) {
    console.error('Failed to get user:', error);
    res.status(500).json({ error: 'Failed to get user info' });
  }
}
