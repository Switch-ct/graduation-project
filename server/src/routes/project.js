const express = require('express');
const db = require('../config/db');
const auth = require('../middleware/auth');

const router = express.Router();
router.use(auth);

// 获取项目列表
router.get('/', async (req, res) => {
  try {
    const result = await db.prepare('SELECT * FROM projects ORDER BY created_at DESC').all();
    res.json(result);
  } catch (err) {
    console.error('查询项目失败:', err.message);
    res.status(500).json({ message: '查询失败: ' + err.message });
  }
});

// 获取单个项目
router.get('/:id', async (req, res) => {
  try {
    const row = await db.prepare('SELECT * FROM projects WHERE id = $1').get(req.params.id);
    if (!row) return res.status(404).json({ message: '项目不存在' });
    res.json(row);
  } catch (err) {
    console.error('查询项目失败:', err.message);
    res.status(500).json({ message: '查询失败: ' + err.message });
  }
});

// 创建项目
router.post('/', async (req, res) => {
  try {
    const { name, location, start_date, end_date, total_budget, manager, description, status } = req.body;
    const result = await db.prepare(
      'INSERT INTO projects (name, location, start_date, end_date, total_budget, manager, description, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    ).run(name, location, start_date, end_date, total_budget, manager, description, status || 'planning');
    res.json({ id: result.lastInsertRowid, message: '创建成功' });
  } catch (err) {
    console.error('创建项目失败:', err.message);
    res.status(500).json({ message: '创建失败: ' + err.message });
  }
});

// 更新项目
router.put('/:id', async (req, res) => {
  try {
    const { name, location, start_date, end_date, total_budget, manager, description, status } = req.body;
    await db.prepare(
      'UPDATE projects SET name=COALESCE(?, name), location=COALESCE(?, location), start_date=COALESCE(?, start_date), end_date=COALESCE(?, end_date), total_budget=COALESCE(?, total_budget), manager=COALESCE(?, manager), description=COALESCE(?, description), status=COALESCE(?, status) WHERE id=?'
    ).run(
      name, location, start_date, end_date,
      total_budget, manager, description, status,
      req.params.id
    );
    res.json({ message: '更新成功' });
  } catch (err) {
    console.error('更新项目失败:', err.message);
    res.status(500).json({ message: '更新失败: ' + err.message });
  }
});

// 删除项目
router.delete('/:id', async (req, res) => {
  try {
    await db.prepare('DELETE FROM projects WHERE id = ?').run(req.params.id);
    res.json({ message: '删除成功' });
  } catch (err) {
    console.error('删除项目失败:', err.message);
    res.status(500).json({ message: '删除失败: ' + err.message });
  }
});

module.exports = router;