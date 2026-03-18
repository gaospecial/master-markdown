# MD Master - Markdown 闯关小游戏

一个帮助用户学习 Markdown 和 Quarto Markdown (QMD) 语法的网页闯关小游戏，采用渐进式难度设计，支持积分排行榜。

## 架构概述

```
┌────────────────────┐      ┌──────────────────────────────┐
│  Vercel (前端)      │─────→│  bio-spring.top (后端 + DB)   │
│  React SPA          │      │  Express API + PostgreSQL     │
│  关卡数据 + 答案验证  │      │  仅负责记录成绩 + 排行榜       │
└────────────────────┘      └──────────────────────────────┘
```

- **前端**：React SPA 部署到 Vercel，包含关卡数据和答案验证逻辑
- **后端**：极简 Express API（单文件 `api.js`）部署到 bio-spring.top
- **数据库**：PostgreSQL，仅存储用户和成绩数据

## 技术栈

### 前端

- React 18 + TypeScript
- Vite (构建工具)
- React Router v6 (路由)
- Zustand (状态管理)
- Tailwind CSS + Headless UI (UI 组件)
- Monaco Editor (代码编辑)
- react-markdown + remark-gfm (Markdown 渲染)

### 后端

- Node.js + Express.js（单文件 `api.js`）
- PostgreSQL（数据库）
- pg（数据库驱动，无 ORM）
- express-session（Session 管理）

## 功能特性

- 20 个精心设计的关卡，涵盖 Markdown 基础和 Quarto Markdown 进阶
- 实时代码编辑与 Markdown 预览
- 前端答案验证，即时反馈
- 积分排行榜系统
- 个人进度追踪
- 响应式设计

## 关卡结构

| 阶段 | 名称 | 关卡范围 | 内容 |
|------|------|----------|------|
| 1 | Markdown 基础 | 1-8 | 标题、段落、粗体斜体、列表、链接、图片、引用、代码块 |
| 2 | Markdown 进阶 | 9-12 | 分隔线、表格、任务列表、脚注 |
| 3 | QMD 入门 | 13-16 | YAML 元数据、代码单元格、单元格选项、图表输出 |
| 4 | QMD 进阶 | 17-20 | 交叉引用、参考文献、标注框、综合挑战 |

## 快速开始

### 本地开发

#### 1. 启动后端

```bash
cd server-simple
npm install
cp .env.example .env
# 编辑 .env，配置 DATABASE_URL 和 CORS_ORIGIN
node api.js
```

后端运行在 http://localhost:3100

#### 2. 启动前端

```bash
cd client
npm install
# 创建 .env.local
echo "VITE_API_URL=http://localhost:3100" > .env.local
npm run dev
```

前端运行在 http://localhost:5173

### 数据库初始化

```bash
# 在 PostgreSQL 中创建数据库后，运行初始化脚本
psql -U your_user -d master_markdown -f server-simple/init.sql
```

## 项目结构

```
master-markdown/
├── client/                      # 前端项目（Vercel 部署）
│   ├── src/
│   │   ├── components/          # React 组件
│   │   ├── pages/               # 页面组件
│   │   ├── stores/              # Zustand 状态管理
│   │   ├── api/                 # API 客户端
│   │   ├── data/                # 静态关卡数据
│   │   ├── utils/               # 答案验证器
│   │   ├── types/               # TypeScript 类型定义
│   │   └── App.tsx              # 应用入口
│   └── package.json
├── server-simple/               # 极简后端（bio-spring.top 部署）
│   ├── api.js                   # 唯一的服务文件
│   ├── init.sql                 # 数据库初始化脚本
│   ├── package.json             # 依赖声明
│   └── .env.example             # 环境变量示例
├── vercel.json                  # Vercel 部署配置
├── test-api.sh                  # API 测试脚本
├── DEPLOY.md                    # 详细部署文档
└── README.md
```

## API 端点

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/health` | 健康检查 |
| GET | `/user/me` | 获取当前用户（自动创建） |
| POST | `/user/nickname` | 设置昵称 |
| GET | `/progress` | 获取用户进度 |
| GET | `/progress/score` | 获取总分 |
| POST | `/progress/submit` | 提交成绩 |
| GET | `/leaderboard` | 排行榜 |

## 部署

详细的部署指南请查看 **[DEPLOY.md](./DEPLOY.md)**。

### 部署方案

- **前端**：Vercel（自动从 GitHub 部署）
- **后端**：bio-spring.top 服务器（pm2 + Nginx 反向代理）
- **数据库**：bio-spring.top 上的 PostgreSQL

### Vercel 环境变量

```
VITE_API_URL=https://api.bio-spring.top/master-markdown
```

### 测试

```bash
# 运行 API 测试脚本
bash test-api.sh
```

## 许可证

MIT License
