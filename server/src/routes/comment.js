// 任务评论路由
const express = require('express');
const router = express.Router();
const db = require('../config/db');

// 列表
router.get('/task/:taskId', async (req, res) => {
  try {
    const r = await db.query(
      'SELECT * FROM comments WHERE task_id = $1 ORDER BY created_at DESC',
      [req.params.taskId]
    );
    res.json(r.rows);
  } catch (e) {
    console.error('GET /comments/task/:id error:', e);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 新增
router.post('/', async (req, res) => {
  try {
    const { task_id, content } = req.body;
    if (!task_id || !content) {
      return res.status(400).json({ message: '任务ID和内容不能为空' });
    }
    // 从 JWT 取当前用户
    const userId = req.user?.id;
    const userName = req.user?.real_name || req.user?.username || '匿名';
    const r = await db.query(
      'INSERT INTO comments (task_id, user_id, user_name, content) VALUES ($1, $2, $3, $4) RETURNING *',
      [task_id, userId, userName, content]
    );
    res.status(201).json(r.rows[0]);
  } catch (e) {
    console.error('POST /comments error:', e);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 删除
router.delete('/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM comments WHERE id = $1', [req.params.id]);
    res.json({ message: '删除成功' });
  } catch (e) {
    res.status(500).json({ message: '服务器错误' });
  }
});

module.exports = router;
