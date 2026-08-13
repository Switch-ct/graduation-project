// 任务附件路由（base64 简单存数据库）
const express = require('express');
const router = express.Router();
const db = require('../config/db');

// 列表（不含 file_data，节省带宽）
router.get('/task/:taskId', async (req, res) => {
  try {
    const r = await db.query(
      `SELECT id, task_id, file_name, file_size, mime_type, uploader_id, uploader_name, created_at
       FROM attachments WHERE task_id = $1 ORDER BY created_at DESC`,
      [req.params.taskId]
    );
    res.json(r.rows);
  } catch (e) {
    console.error('GET /attachments/task/:id error:', e);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 下载（返回 base64）
router.get('/:id/download', async (req, res) => {
  try {
    const r = await db.query('SELECT * FROM attachments WHERE id = $1', [req.params.id]);
    if (r.rows.length === 0) return res.status(404).json({ message: '附件不存在' });
    const att = r.rows[0];
    res.json({
      file_name: att.file_name,
      mime_type: att.mime_type,
      file_size: att.file_size,
      file_data: att.file_data,
    });
  } catch (e) {
    res.status(500).json({ message: '服务器错误' });
  }
});

// 上传（前端把文件转 base64 传过来）
router.post('/', async (req, res) => {
  try {
    const { task_id, file_name, file_size, mime_type, file_data } = req.body;
    if (!task_id || !file_name || !file_data) {
      return res.status(400).json({ message: '参数不完整' });
    }
    // 限制：单文件 2MB
    if (file_size > 2 * 1024 * 1024) {
      return res.status(400).json({ message: '文件大小不能超过 2MB' });
    }
    const userId = req.user?.id;
    const userName = req.user?.real_name || req.user?.username || '匿名';
    const r = await db.query(
      `INSERT INTO attachments (task_id, file_name, file_size, mime_type, uploader_id, uploader_name, file_data)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id, file_name, file_size, mime_type, created_at`,
      [task_id, file_name, file_size, mime_type, userId, userName, file_data]
    );
    res.status(201).json(r.rows[0]);
  } catch (e) {
    console.error('POST /attachments error:', e);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 删除
router.delete('/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM attachments WHERE id = $1', [req.params.id]);
    res.json({ message: '删除成功' });
  } catch (e) {
    res.status(500).json({ message: '服务器错误' });
  }
});

module.exports = router;
