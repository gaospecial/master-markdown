import type { NextApiRequest, NextApiResponse } from 'next';
import { query } from '../../../db/db';
import { ensureUser, handleCors } from '../../../db/session';
import { verifySubmitSignature } from '../../../db/signature';
import type { Progress } from '../../../lib/types';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // 处理CORS
  if (handleCors(req, res)) return;

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { levelId, score, code, timestamp, signature } = req.body;
    const userId = await ensureUser(req, res);

    if (!levelId || score === undefined) {
      return res.status(400).json({ error: 'Missing levelId or score' });
    }

    // 验证签名
    const signatureResult = verifySubmitSignature(levelId, score, timestamp, signature);
    if (!signatureResult.valid) {
      return res.status(403).json({ error: signatureResult.error });
    }

    // 获取已有进度
    const { rows: existing } = await query(
      'SELECT * FROM progress WHERE user_id = $1 AND level_id = $2',
      [userId, levelId]
    );

    const existingProgress = existing[0] || null;
    const attempts = (existingProgress?.attempts || 0) + 1;

    let progress: Progress;

    if (existingProgress) {
      // 保留最高分
      const { rows } = await query(
        `UPDATE progress
         SET score = GREATEST($1, score), attempts = $2, code = $3, completed_at = NOW()
         WHERE user_id = $4 AND level_id = $5
         RETURNING id, user_id AS "userId", level_id AS "levelId", score, attempts, code, completed_at AS "completedAt"`,
        [score, attempts, code || null, userId, levelId]
      );
      progress = rows[0];
    } else {
      const { rows } = await query(
        `INSERT INTO progress (user_id, level_id, score, attempts, code)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, user_id AS "userId", level_id AS "levelId", score, attempts, code, completed_at AS "completedAt"`,
        [userId, levelId, score, attempts, code || null]
      );
      progress = rows[0];
    }

    res.status(200).json({ success: true, progress });
  } catch (error) {
    console.error('Submit error:', error);
    res.status(500).json({ error: 'Failed to submit score' });
  }
}
