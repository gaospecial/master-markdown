# Master Markdown 部署文档

## 架构概述

简化后的架构：
- **前端**：React SPA → 部署到 Vercel（不变）
- **后端**：极简 Express API（单文件）→ 部署到 bio-spring.top
- **数据库**：PostgreSQL → bio-spring.top 服务器
- **验证逻辑**：在前端完成，后端只记录成绩

```
┌────────────────┐     ┌──────────────────────────────┐
│  Vercel (前端)  │────→│  bio-spring.top (后端 + DB)   │
│  React SPA      │     │  Express API + PostgreSQL     │
│  + 答案验证      │     │  只负责记录成绩 + 排行榜       │
└────────────────┘     └──────────────────────────────┘
```

## 一、服务器配置（bio-spring.top）

### 1. 创建 PostgreSQL 数据库

```bash
# 创建数据库
sudo -u postgres createdb master_markdown

# 创建用户
sudo -u postgres psql -c "CREATE USER md_app WITH PASSWORD 'YOUR_PASSWORD';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE master_markdown TO md_app;"

# 授予 schema 权限
sudo -u postgres psql -d master_markdown -c "GRANT ALL ON SCHEMA public TO md_app;"
sudo -u postgres psql -d master_markdown -c "ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO md_app;"
sudo -u postgres psql -d master_markdown -c "ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO md_app;"

# 初始化表
psql -U md_app -d master_markdown -f server-simple/init.sql
```

### 2. 部署 API

```bash
# 在服务器上
cd /var/www
git clone git@github.com:gaospecial/master-markdown.git
cd master-markdown/server-simple

# 安装依赖
npm install

# 创建 .env 文件
cp .env.example .env
# 编辑 .env，填入真实的数据库密码和 session secret

# 使用 pm2 管理进程
npm install -g pm2
pm2 start api.js --name master-markdown-api
pm2 save
pm2 startup
```

### 3. Nginx 反向代理

```nginx
# /etc/nginx/sites-available/api.bio-spring.top
server {
    listen 443 ssl;
    server_name api.bio-spring.top;

    ssl_certificate     /path/to/ssl/cert.pem;
    ssl_certificate_key /path/to/ssl/key.pem;

    location /master-markdown/ {
        proxy_pass http://127.0.0.1:3100/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/api.bio-spring.top /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## 二、前端部署（Vercel）

### 1. 环境变量

在 Vercel 项目设置中添加：

```
VITE_API_URL=https://api.bio-spring.top/master-markdown
```

### 2. 构建命令

```
Build Command: cd client && npm run build
Output Directory: client/dist
```

### 3. vercel.json

已有的 `vercel.json` 配置 SPA 路由重写，无需修改。

## 三、本地开发

```bash
# 1. 前端
cd client
npm install
npm run dev  # http://localhost:5173

# 2. 后端
cd server-simple
npm install
cp .env.example .env
# 编辑 .env: DATABASE_URL, CORS_ORIGIN=http://localhost:5173
node api.js  # http://localhost:3100

# 3. 前端 .env
# client/.env.local
VITE_API_URL=http://localhost:3100
```

## 四、API 端点

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/health` | 健康检查 |
| GET | `/user/me` | 获取当前用户 |
| POST | `/user/nickname` | 设置昵称 |
| GET | `/progress` | 获取用户进度 |
| GET | `/progress/score` | 获取总分 |
| POST | `/progress/submit` | 提交成绩（levelId, score, code） |
| GET | `/leaderboard` | 排行榜 |

## 五、文件结构

```
server-simple/
├── api.js          # 主服务文件（唯一的 JS 文件）
├── init.sql        # 数据库初始化脚本
├── package.json    # 依赖声明
├── .env.example    # 环境变量示例
└── .env            # 实际环境变量（不提交到 git）

client/src/
├── data/levels.ts       # 静态关卡数据（前端）
├── utils/validators.ts  # 答案验证器（前端）
├── api/client.ts        # API 客户端
├── stores/gameStore.ts  # 游戏状态管理
└── ...                  # 其他前端文件
```

## 六、与旧架构的区别

| 项目 | 旧架构 | 新架构 |
|------|--------|--------|
| 后端 | TypeScript + Prisma + Render | 单文件 JS + pg + bio-spring.top |
| 关卡数据 | 后端数据库 seed | 前端静态数据 |
| 答案验证 | 后端验证 | 前端验证 |
| 后端职责 | 关卡 + 验证 + 成绩 + 排行榜 | 仅成绩 + 排行榜 |
| 依赖 | Prisma ORM | 直接 pg 驱动 |
| 文件数 | ~15 个后端文件 | 1 个 api.js + 1 个 init.sql |

> **注意**: 旧的 `server/` 目录和 Render 部署可以在新架构验证通过后删除。
