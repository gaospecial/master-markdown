# 部署指南

本项目采用前后端分离部署：
- **前端**：部署到 Vercel（静态网站托管）
- **后端**：部署到 Render（免费 Node.js 服务）

---

## 一、后端部署到 Render

### 1. 准备工作

确保你的代码已经推送到 GitHub 仓库。

### 2. 注册 Render 账号

访问 https://render.com 并使用 GitHub 账号登录。

### 3. 创建 Web Service

1. 点击 **"New +"** → 选择 **"Web Service"**
2. 连接你的 GitHub 仓库（授权 Render 访问）
3. 选择 `master-markdown` 仓库

### 4. 配置服务

填写以下配置：

| 配置项 | 值 |
|--------|-----|
| **Name** | `md-master-api`（或你喜欢的名字） |
| **Region** | Singapore（新加坡，离中国最近） |
| **Branch** | `main` 或 `master` |
| **Root Directory** | `server` |
| **Runtime** | `Node` |
| **Build Command** | `npm install && npm run build && npx prisma generate && npx prisma migrate deploy && npm run db:seed` |
| **Start Command** | `npm start` |
| **Instance Type** | `Free` |

### 5. 设置环境变量

在 **Environment Variables** 部分添加：

```
DATABASE_URL=file:./prisma/dev.db
NODE_ENV=production
SESSION_SECRET=your-random-secret-key-here-change-this
CLIENT_URL=https://master-markdown.vercel.app
PORT=3001
```

**重要**：
- `SESSION_SECRET`：请生成一个随机字符串（至少 32 位）
- `CLIENT_URL`：先填写你的 Vercel 域名（下一步会获取）

### 6. 部署

点击 **"Create Web Service"**，Render 会自动开始构建和部署。

首次部署大约需要 **5-10 分钟**。

### 7. 获取后端 URL

部署成功后，你会看到类似这样的 URL：
```
https://md-master-api.onrender.com
```

**记下这个 URL**，下一步需要用到。

---

## 二、前端部署到 Vercel

### 1. 前端已经部署

如果你的前端已经在 Vercel 上，只需要添加环境变量。

### 2. 配置环境变量

在 Vercel 项目设置中：

1. 进入 **Settings** → **Environment Variables**
2. 添加新变量：

```
VITE_API_URL=https://master-markdown.onrender.com/api
```

**注意**：替换为你的 Render 后端 URL，并在末尾加上 `/api`

### 3. 重新部署

添加环境变量后，Vercel 会自动触发重新部署。

或者手动触发：**Deployments** → 点击最新部署旁的 **"..."** → **"Redeploy"**

---

## 三、更新后端环境变量

现在你有了 Vercel 的前端 URL，回到 Render：

1. 进入你的 Web Service
2. 点击 **Environment** 标签
3. 更新 `CLIENT_URL` 为你的 Vercel URL：
   ```
   CLIENT_URL=https://your-app.vercel.app
   ```
4. 点击 **"Save Changes"**

Render 会自动重新部署。

---

## 四、验证部署

### 1. 测试后端

访问：`https://your-render-url.onrender.com/api/levels`

应该返回关卡数据的 JSON。

### 2. 测试前端

访问你的 Vercel URL，尝试：
- 修改昵称
- 完成一个关卡
- 查看排行榜

如果一切正常，部署成功！🎉

---

## 五、常见问题

### Q1: Render 服务休眠

**问题**：免费版 Render 在 15 分钟无活动后会休眠，首次访问需要 30-60 秒唤醒。

**解决方案**：
- 接受这个限制（免费服务的代价）
- 或者升级到付费版（$7/月）保持常驻

### Q2: 前端显示"无法连接到服务器"

**检查清单**：
1. Render 后端是否部署成功？
2. Vercel 环境变量 `VITE_API_URL` 是否正确？
3. Render 的 `CLIENT_URL` 是否设置为 Vercel 域名？
4. 浏览器控制台是否有 CORS 错误？

### Q3: TypeScript 编译错误

如果看到 `Could not find a declaration file for module 'express'` 等错误：

**原因**：构建依赖（TypeScript、类型定义）必须在 `dependencies` 中，不能只在 `devDependencies`。

**解决**：已在 `server/package.json` 中将构建相关依赖移到 `dependencies`。

### Q4: 数据库迁移失败

如果 Render 构建时提示 Prisma 错误：

1. 检查 `server/prisma/schema.prisma` 文件是否正确
2. 确保 Build Command 包含 `npx prisma generate`
3. 查看 Render 的构建日志，找到具体错误

### Q4: Session 不工作

确保：
1. `SESSION_SECRET` 已设置
2. 前端 API 客户端使用了 `withCredentials: true`
3. CORS 配置允许 credentials

---

## 六、本地开发

本地开发时不需要设置 `VITE_API_URL`，前端会自动使用相对路径 `/api`。

启动开发服务器：

```bash
# 同时启动前后端
npm run dev

# 或分别启动
cd server && npm run dev  # 后端：http://localhost:3001
cd client && npm run dev  # 前端：http://localhost:5173
```

---

## 七、更新部署

### 更新后端

推送代码到 GitHub，Render 会自动检测并重新部署。

### 更新前端

推送代码到 GitHub，Vercel 会自动检测并重新部署。

---

## 八、成本

- **Vercel**：完全免费（个人项目）
- **Render**：完全免费（有休眠限制）

**总成本：$0/月** 🎉

---

## 九、备选方案

如果 Render 不满意，可以考虑：

### Railway
- 免费额度：$5/月（约 500 小时）
- 需要信用卡验证（不扣费）
- 部署：https://railway.app

### Fly.io
- 免费额度：3 个小型应用
- 配置稍复杂
- 部署：https://fly.io

---

## 十、技术支持

如果遇到问题：

1. 查看 Render 构建日志
2. 查看浏览器控制台错误
3. 检查网络请求（F12 → Network）
4. 参考本文档的"常见问题"部分

祝部署顺利！🚀
