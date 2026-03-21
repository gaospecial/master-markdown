import type { NextApiRequest, NextApiResponse } from 'next';
import { query } from '../utils/db';
import { handleCors } from '../utils/session';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // 处理CORS
  if (handleCors(req, res)) return;

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // 测试数据库连接
    await query('SELECT 1');
    res.status(200).json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development'
    });
  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({
      status: 'error',
      error: (error as Error).message
    });
  }
}
