import { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { query } from './db';

const SESSION_SECRET = process.env.SESSION_SECRET || 'dev-secret-change-me';
const SESSION_MAX_AGE = 30 * 24 * 60 * 60 * 1000; // 30天

export interface SessionUser {
  userId: string;
}

// 生成JWT令牌
export function generateToken(userId: string): string {
  return jwt.sign({ userId }, SESSION_SECRET, { expiresIn: '30d' });
}

// 验证JWT令牌
export function verifyToken(token: string): SessionUser | null {
  try {
    const decoded = jwt.verify(token, SESSION_SECRET) as { userId: string };
    return { userId: decoded.userId };
  } catch (error) {
    return null;
  }
}

// 从请求中获取用户信息，如果没有则创建新用户
export async function ensureUser(req: NextApiRequest, res: NextApiResponse): Promise<string> {
  // 从cookie或authorization header获取token
  let token = req.cookies['session-token'];

  if (!token && req.headers.authorization?.startsWith('Bearer ')) {
    token = req.headers.authorization.substring(7);
  }

  let userId: string | null = null;

  // 验证现有token
  if (token) {
    const session = verifyToken(token);
    if (session) {
      userId = session.userId;
    }
  }

  // 如果没有有效用户，创建新用户
  if (!userId) {
    userId = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // 插入新用户到数据库
    await query(
      'INSERT INTO users (id, nickname) VALUES ($1, $2) ON CONFLICT (id) DO NOTHING',
      [userId, '匿名玩家']
    );

    // 生成新token并设置cookie
    const newToken = generateToken(userId);
    res.setHeader(
      'Set-Cookie',
      `session-token=${newToken}; Path=/; Max-Age=${SESSION_MAX_AGE / 1000}; HttpOnly; Secure; SameSite=None`
    );
  } else {
    // 确保用户存在于数据库
    const { rows } = await query('SELECT id FROM users WHERE id = $1', [userId]);
    if (rows.length === 0) {
      await query(
        'INSERT INTO users (id, nickname) VALUES ($1, $2)',
        [userId, '匿名玩家']
      );
    }
  }

  return userId;
}

// 处理OPTIONS请求的CORS
export function handleCors(req: NextApiRequest, res: NextApiResponse): boolean {
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return true;
  }
  return false;
}
