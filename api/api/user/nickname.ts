import type { NextApiRequest, NextApiResponse } from 'next';
import { query } from '../../utils/db';
import { ensureUser, handleCors } from '../../utils/session';
import type { User } from '../../types';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // 处理CORS
  if (handleCors(req, res)) return;

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { nickname } = req.body;

    if (!nickname || nickname.length < 1 || nickname.length > 20) {
      return res.status(400).json({ error: '昵称长度应在 1-20 字符之间' });
    }

    const userId = await ensureUser(req, res);

    const { rows } = await query(
      'UPDATE users SET nickname = $1 WHERE id = $2 RETURNING id, nickname, created_at AS "createdAt"',
      [nickname, userId]
    );

    const user: User = rows[0];
    res.status(200).json({ user });
  } catch (error) {
    console.error('Failed to set nickname:', error);
    res.status(500).json({ error: 'Failed to update nickname' });
  }
}
