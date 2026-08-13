# 基于Web技术的工程项目施工进度管理系统设计

> 广州大学2027届高等学历继续教育本科毕业设计
> 专业：工程管理 | 姓名：龙超滔 | 学号：245201111078

基于 Vue3 + Element Plus + Node.js + Express + PostgreSQL 的施工进度管理系统。

## 📦 源码仓库

- **公开仓库**：https://gitee.com/switchtt/construction-progress-management

## 🌐 在线访问

**演示地址**：https://graduation-project-alpha-nine.vercel.app

| 项目 | 值 |
|------|-----|
| 系统地址 | https://graduation-project-alpha-nine.vercel.app |
| 默认账号 | `admin` / `admin123` |
| 内置数据 | 7 个项目、124 个任务、11 个用户 |

> 导师和评委可直接通过上述链接访问系统，无需注册。

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | Vue 3 + Vite + Element Plus + ECharts |
| 后端 | Node.js + Express |
| 数据库 | PostgreSQL（Neon Serverless）/ SQLite（本地开发） |
| 认证 | JWT（jsonwebtoken + bcryptjs） |

## 系统部署

本系统采用前后端分离架构部署于公网环境，整体部署架构如图所示：

```
┌──────────────────┐      HTTPS       ┌──────────────────┐
│  Vercel CDN       │  ───────────►  │  Render          │
│  (前端静态托管)   │                  │  (Node后端服务)   │
│  *.vercel.app    │ ◄───────────   │  *.onrender.com  │
└──────────────────┘                  └─────────┬────────┘
                                                │ SSL/TLS
                                                ▼
                                       ┌──────────────────┐
                                       │  Neon            │
                                       │  (PostgreSQL)    │
                                       │  Serverless      │
                                       └──────────────────┘
```

### 部署平台说明

| 平台 | 用途 | 免费额度 |
|------|------|----------|
| **Vercel** | 前端静态托管 + 全球 CDN | 100GB 流量/月 |
| **Render** | Node.js 后端服务 | 750 小时/月（休眠后冷启动 30-50s） |
| **Neon** | Serverless PostgreSQL | 0.5GB 存储，自动休眠 |

### 部署环境变量

**后端**（在 Render Dashboard 配置）：
| Key | 用途 |
|-----|------|
| `DATABASE_URL` | Neon PostgreSQL 连接串 |
| `JWT_SECRET` | JWT 签名密钥 |
| `NODE_ENV` | 运行环境（production） |
| `FRONTEND_URL` | 允许跨域的前端域名 |

**前端**（在 Vercel Dashboard 配置）：
| Key | 用途 |
|-----|------|
| `VITE_API_URL` | 后端 API 地址 |

### 本地开发

本地开发使用 SQLite 零安装启动：

#### 后端
```bash
cd server
npm install
npm run dev
# 运行在 http://localhost:3000
```

#### 前端
```bash
cd web
npm install
npm run dev
# 运行在 http://localhost:5173
```

## 项目结构

```
├── server/          # 后端服务
│   └── src/
│       ├── app.js          # 入口
│       ├── config/
│       │   ├── db.js       # PostgreSQL 连接池
│       │   └── init.js     # 表结构 + 种子数据
│       ├── middleware/
│       │   └── auth.js     # JWT认证中间件
│       └── routes/
│           ├── auth.js     # 登录/注册
│           ├── project.js  # 项目CRUD
│           ├── task.js     # 任务CRUD + WBS + 统计
│           └── user.js     # 用户管理
├── web/             # 前端应用
│   └── src/
│       ├── api/index.js       # Axios 封装
│       ├── router/index.js    # 路由配置
│       ├── layout/MainLayout.vue
│       └── views/
│           ├── Login.vue        # 登录
│           ├── Dashboard.vue    # 工作台
│           ├── Projects.vue     # 项目管理
│           ├── ProjectDetail.vue # 项目详情 + WBS
│           ├── GanttChart.vue   # 甘特图
│           └── Users.vue        # 用户管理
├── docs/            # 文档
│   └── DEPLOY.md    # 部署指南
└── thesis/          # 论文文档
    ├── 选题申报表-龙超滔-施工进度管理系统.docx
    ├── 毕业论文-龙超滔-施工进度管理系统-初稿.docx
    └── generate.py              # 论文生成脚本
```

## 功能模块

- ✅ 用户认证（JWT + bcrypt 密码加密）
- ✅ 项目管理（CRUD + 状态追踪）
- ✅ WBS 任务分解（树形结构 + 多层级）
- ✅ 甘特图可视化（ECharts 自定义渲染）
- ✅ 进度统计与跟踪（实时百分比、状态分布）
- ✅ 用户管理（角色权限）
- ✅ 响应式 UI（Element Plus + 白色主题）

## API 接口

| 模块 | 端点 | 方法 | 描述 |
|------|------|------|------|
| 认证 | `/api/auth/login` | POST | 用户登录 |
| 项目 | `/api/projects` | GET/POST | 项目列表/创建 |
| 项目 | `/api/projects/:id` | GET/PUT/DELETE | 项目详情/更新/删除 |
| 任务 | `/api/tasks/project/:id` | GET | 项目任务树 |
| 任务 | `/api/tasks/flat/:id` | GET | 项目任务扁平列表 |
| 任务 | `/api/tasks` | POST | 创建任务 |
| 任务 | `/api/tasks/:id` | PUT/DELETE | 更新/删除任务 |
| 任务 | `/api/tasks/stats/:id` | GET | 任务统计 |
| 用户 | `/api/users` | GET | 用户列表 |

完整 API 文档参见 `docs/DEPLOY.md`。