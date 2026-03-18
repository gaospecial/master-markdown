-- Master Markdown 数据库初始化脚本
-- 在 PostgreSQL 中运行此脚本创建所需的表

-- 用户表
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(64) PRIMARY KEY,
  nickname VARCHAR(20) NOT NULL DEFAULT '匿名玩家',
  created_at TIMESTAMP DEFAULT NOW()
);

-- 进度表
CREATE TABLE IF NOT EXISTS progress (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL REFERENCES users(id),
  level_id INTEGER NOT NULL,
  score INTEGER NOT NULL DEFAULT 0,
  attempts INTEGER NOT NULL DEFAULT 0,
  code TEXT,
  completed_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, level_id)
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_progress_user_id ON progress(user_id);
CREATE INDEX IF NOT EXISTS idx_progress_level_id ON progress(level_id);
