/**
 * Master Markdown - 极简 API 服务
 * 后端只负责记录成绩，不做答案验证
 * 部署到 api.bio-spring.top/master-markdown
 */
require('dotenv').config();

const express = require('express');
const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);
const cors = require('cors');
const crypto = require('crypto');
const { Pool } = require('pg');

// ===== 提交签名密钥 =====
const SUBMIT_SECRET = process.env.SUBMIT_SECRET || 'md-master-default-secret';
const SUBMIT_TIMESTAMP_TOLERANCE = 5 * 60 * 1000; // 5 分钟有效期

// ===== 数据库连接 =====
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// ===== Express 应用 =====
const app = express();
const PORT = process.env.PORT || 3100;

app.use(express.json());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true
}));

app.use(session({
  store: new pgSession({ pool, createTableIfMissing: true }),
  secret: process.env.SESSION_SECRET || 'dev-secret-change-me',
  resave: false,
  saveUninitialized: true,
  cookie: {
    maxAge: 30 * 24 * 60 * 60 * 1000,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    httpOnly: true
  }
}));

// ===== 辅助函数 =====
async function ensureUser(req) {
  if (!req.session.userId) {
    req.session.userId = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
  const userId = req.session.userId;
  const { rows } = await pool.query('SELECT id FROM users WHERE id = $1', [userId]);
  if (rows.length === 0) {
    await pool.query('INSERT INTO users (id, nickname) VALUES ($1, $2)', [userId, '匿名玩家']);
  }
  return userId;
}

// ===== 用户路由 =====
app.get('/user/me', async (req, res) => {
  try {
    const userId = await ensureUser(req);
    const { rows } = await pool.query('SELECT id, nickname, created_at AS "createdAt" FROM users WHERE id = $1', [userId]);
    res.json({ user: rows[0] });
  } catch (error) {
    console.error('Failed to get user:', error);
    res.status(500).json({ error: 'Failed to get user info' });
  }
});

app.post('/user/nickname', async (req, res) => {
  try {
    const { nickname } = req.body;
    if (!nickname || nickname.length < 1 || nickname.length > 20) {
      return res.status(400).json({ error: '昵称长度应在 1-20 字符之间' });
    }
    const userId = await ensureUser(req);
    const { rows } = await pool.query(
      'UPDATE users SET nickname = $1 WHERE id = $2 RETURNING id, nickname, created_at AS "createdAt"',
      [nickname, userId]
    );
    res.json({ user: rows[0] });
  } catch (error) {
    console.error('Failed to set nickname:', error);
    res.status(500).json({ error: 'Failed to update nickname' });
  }
});

// ===== 进度路由 =====
app.get('/progress', async (req, res) => {
  try {
    const userId = await ensureUser(req);
    const { rows } = await pool.query(
      'SELECT id, user_id AS "userId", level_id AS "levelId", score, attempts, code, completed_at AS "completedAt" FROM progress WHERE user_id = $1',
      [userId]
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch progress' });
  }
});

app.get('/progress/score', async (req, res) => {
  try {
    const userId = await ensureUser(req);
    const { rows } = await pool.query(
      'SELECT id, user_id AS "userId", level_id AS "levelId", score, attempts, code, completed_at AS "completedAt" FROM progress WHERE user_id = $1',
      [userId]
    );
    const totalScore = rows.reduce((sum, p) => sum + p.score, 0);
    res.json({ totalScore, completedLevels: rows.length, progress: rows });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch score' });
  }
});

// 提交成绩 — 前端已验证答案，后端验证签名后记录分数
app.post('/progress/submit', async (req, res) => {
  try {
    const { levelId, score, code, timestamp, signature } = req.body;
    const userId = await ensureUser(req);

    if (!levelId || score === undefined) {
      return res.status(400).json({ error: 'Missing levelId or score' });
    }

    // ===== HMAC 签名验证 =====
    if (!timestamp || !signature) {
      return res.status(403).json({ error: 'Missing signature' });
    }
    // 检查时间戳是否在有效期内（防重放攻击）
    if (Math.abs(Date.now() - timestamp) > SUBMIT_TIMESTAMP_TOLERANCE) {
      return res.status(403).json({ error: 'Request expired' });
    }
    // 验证签名
    const payload = `${levelId}:${score}:${timestamp}`;
    const expectedSignature = crypto
      .createHmac('sha256', SUBMIT_SECRET)
      .update(payload)
      .digest('hex');
    if (signature !== expectedSignature) {
      return res.status(403).json({ error: 'Invalid signature' });
    }

    // 获取已有进度
    const { rows: existing } = await pool.query(
      'SELECT * FROM progress WHERE user_id = $1 AND level_id = $2', [userId, levelId]
    );
    const existingProgress = existing[0] || null;
    const attempts = (existingProgress?.attempts || 0) + 1;

    let progress;
    if (existingProgress) {
      // 保留最高分
      const { rows } = await pool.query(
        `UPDATE progress SET score = GREATEST($1, score), attempts = $2, code = $3, completed_at = NOW()
         WHERE user_id = $4 AND level_id = $5 RETURNING *`,
        [score, attempts, code || null, userId, levelId]
      );
      progress = rows[0];
    } else {
      const { rows } = await pool.query(
        'INSERT INTO progress (user_id, level_id, score, attempts, code) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [userId, levelId, score, attempts, code || null]
      );
      progress = rows[0];
    }

    res.json({ success: true, progress });
  } catch (error) {
    console.error('Submit error:', error);
    res.status(500).json({ error: 'Failed to submit score' });
  }
});

// ===== 排行榜路由 =====
app.get('/leaderboard', async (req, res) => {
  try {
    const { rows } = await pool.query(`
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
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

// ===== 健康检查 =====
app.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  } catch (error) {
    res.status(500).json({ status: 'error', error: error.message });
  }
});

// ===== 启动 =====
app.listen(PORT, () => {
  console.log(`Master Markdown API running on port ${PORT}`);
});
