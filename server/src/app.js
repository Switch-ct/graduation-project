const express = require('express');
const cors = require('cors');
require('dotenv').config();

const init = require('./config/init');
const auth = require('./middleware/auth');
const projectRoutes = require('./routes/project');
const taskRoutes = require('./routes/task');
const userRoutes = require('./routes/user');
const authRoutes = require('./routes/auth');
const commentRoutes = require('./routes/comment');
const attachmentRoutes = require('./routes/attachment');
const changelogRoutes = require('./routes/changelog');
const statsRoutes = require('./routes/stats');

const app = express();

// CORS - 允许前端域名访问
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true,
}));

app.use(express.json({ limit: '5mb' }));  // 加大以支持附件 base64

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// 路由
app.use('/api/auth', authRoutes);
app.use('/api/projects', auth, projectRoutes);
app.use('/api/tasks', auth, taskRoutes);
app.use('/api/users', auth, userRoutes);
app.use('/api/comments', auth, commentRoutes);
app.use('/api/attachments', auth, attachmentRoutes);
app.use('/api/changelogs', auth, changelogRoutes);
app.use('/api/stats', auth, statsRoutes);

// 404
app.use((req, res) => {
  res.status(404).json({ message: '接口不存在' });
});

// 错误处理
app.use((err, req, res, next) => {
  console.error('服务器错误:', err);
  res.status(500).json({ message: '服务器内部错误' });
});

const PORT = process.env.PORT || 3000;

async function start() {
  try {
    await init();
    app.listen(PORT, () => {
      console.log(`✅ 施工进度管理系统后端运行在端口 ${PORT}`);
    });
  } catch (err) {
    console.error('启动失败:', err);
    process.exit(1);
  }
}

start();