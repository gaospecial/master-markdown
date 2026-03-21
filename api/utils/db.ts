import { Pool } from 'pg';

// 数据库连接池（serverless环境下会自动复用连接）
let pool: Pool | null = null;

export function getPool(): Pool {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 10, // serverless环境下保持较小的连接池
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });
  }
  return pool;
}

// 用于执行查询的辅助函数
export async function query(text: string, params?: any[]) {
  const pool = getPool();
  const result = await pool.query(text, params);
  return result;
}
