# 部署指南 - 工程项目施工进度管理系统

> 适合场景：纯外网演示给导师/评委查看
> 部署时间：约 10-15 分钟
> 费用：完全免费

## 架构总览

```
┌─────────────┐      HTTPS      ┌─────────────┐
│  Vercel     │  ─────────────►  │  Render     │
│  (前端静态)  │                  │  (Node后端)  │
│  *.vercel.app│ ◄─────────────  │  *.onrender.com
└─────────────┘                  └──────┬──────┘
                                        │ SSL
                                        ▼
                                 ┌─────────────┐
                                 │  Neon       │
                                 │  (PostgreSQL)│
                                 │  free tier  │
                                 └─────────────┘
```

## 步骤 1：创建 PostgreSQL 数据库（Neon，免费）

1. 访问 [https://neon.tech](https://neon.tech)
2. 点击 **Sign Up**，用 GitHub 账号登录
3. 创建新项目：
   - Project name: `graduation-project`
   - Region: `US East (Ohio)` 或 `Asia Pacific (Singapore)`（选离你近的）
   - PostgreSQL version: 16
4. 在 Dashboard 点击 **Connection Details** → 复制 **Connection string**
   - 形如：`postgres://username:password@ep-xxx.region.aws.neon.tech/graduation-project?sslmode=require`
   - ⚠️ 这一串等下要用，先存到记事本

## 步骤 2：部署后端（Render，免费）

1. 访问 [https://render.com](https://render.com)
2. 用 GitHub 账号登录
3. 点击 **New +** → **Web Service**
4. 连接 GitHub 仓库 `switchtt/graduation-project`
5. 配置：
   - **Name**: `graduation-server`
   - **Region**: `Singapore` 或 `Oregon`
   - **Branch**: `master`
   - **Root Directory**: `server`（重要！）
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node src/app.js`
   - **Instance Type**: `Free` ⚠️ 免费版 15 分钟无活动会休眠
6. 点击 **Advanced** → 添加环境变量：
   - `DATABASE_URL` = 第 1 步复制的连接串
   - `JWT_SECRET` = 随便一串，如 `grad2026projectSecretKey`
   - `NODE_ENV` = `production`
   - `FRONTEND_URL` = 留空或填 `*`（先不限制 CORS）
7. 点击 **Create Web Service**
8. 等待部署完成（约 2-3 分钟），记下后端 URL（如 `https://graduation-server.onrender.com`）

### 测试后端
在浏览器访问 `https://graduation-server.onrender.com/api/health`
应该看到：`{"status":"ok","time":"..."}`

## 步骤 3：部署前端（Vercel，免费）

1. 访问 [https://vercel.com](https://vercel.com)
2. 用 GitHub 账号登录
3. 点击 **Add New...** → **Project**
4. 导入 `graduation-project` 仓库
5. 配置：
   - **Project Name**: `graduation-project`
   - **Framework Preset**: `Vite`
   - **Root Directory**: `web`（重要！需要先编辑）
   - **Build Command**: `vite build`（默认）
   - **Output Directory**: `dist`（默认）
6. 点击 **Environment Variables** 添加：
   - `VITE_API_URL` = 第 2 步得到的后端 URL + `/api`
   - 例子：`https://graduation-server.onrender.com/api`
7. 点击 **Deploy**
8. 等待部署完成（约 1-2 分钟），得到前端 URL（如 `https://graduation-project.vercel.app`）

## 步骤 4：测试

1. 打开前端 URL
2. 应该看到登录页
3. 用默认账号登录：`admin` / `admin123`
4. 测试所有功能

## 步骤 5：配置 CORS（部署完成后）

后端的 `FRONTEND_URL` 环境变量需要设置为前端 URL：

1. 回到 Render 控制台
2. 选 `graduation-server` → **Environment** → 修改 `FRONTEND_URL`
3. 值设为前端 URL（如 `https://graduation-project.vercel.app`）
4. 保存后会自动重启

## 常见问题

### Q1: 第一次打开后端很慢（30-50 秒）？
**A**: Render 免费版会自动休眠。冷启动需要 30-50 秒。解决方案：
- 付费 $7/月可避免休眠
- 或者用 UptimeRobot 每 5 分钟 ping 一次保持活跃

### Q2: 部署后报 CORS 错误？
**A**: 检查 Render 的 `FRONTEND_URL` 环境变量是否设置正确。

### Q3: 数据库连接失败？
**A**: 检查 `DATABASE_URL` 格式是否正确，必须包含 `?sslmode=require`。

### Q4: 想用自定义域名？
**A**: Vercel 和 Render 都支持绑定自定义域名，免费。

### Q5: 怎么更新代码？
**A**: 直接 push 到 GitHub，Render 和 Vercel 会自动重新部署。

## 域名建议

如果你想给系统绑定一个简单好记的域名：
- Vercel: 在项目 Settings → Domains 添加，免费自动 HTTPS
- Render: 在服务 Settings → Custom Domain 添加

## 给导师的话术

> "系统已经部署到公网，访问地址是 https://你的域名.vercel.app
> 默认账号 admin / admin123
> 系统基于 Vue3 + Node.js + PostgreSQL，完全免费部署在 Vercel + Render + Neon 平台"