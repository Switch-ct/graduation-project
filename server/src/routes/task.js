const express = require('express');
const db = require('../config/db');
const auth = require('../middleware/auth');

const router = express.Router();
router.use(auth);

// 单个任务详情
router.get('/:id', async (req, res) => {
  try {
    const r = await db.query('SELECT * FROM tasks WHERE id = $1', [req.params.id]);
    if (r.rows.length === 0) return res.status(404).json({ message: '任务不存在' });
    res.json(r.rows[0]);
  } catch (e) { res.status(500).json({ message: '服务器错误' }); }
});

// 获取某项目的所有任务（树形结构）
router.get('/project/:projectId', async (req, res) => {
  try {
    const rows = await db.prepare('SELECT * FROM tasks WHERE project_id = ? ORDER BY wbs_code').all(req.params.projectId);
    const taskMap = {};
    const tree = [];
    rows.forEach(t => {
      taskMap[t.id] = { ...t, children: [] };
    });
    rows.forEach(t => {
      if (t.parent_id && taskMap[t.parent_id]) {
        taskMap[t.parent_id].children.push(taskMap[t.id]);
      } else {
        tree.push(taskMap[t.id]);
      }
    });
    res.json(tree);
  } catch (err) {
    console.error('查询任务树失败:', err.message);
    res.status(500).json({ message: '查询失败: ' + err.message });
  }
});

// 获取所有任务（扁平）
router.get('/flat/:projectId', async (req, res) => {
  try {
    const rows = await db.prepare('SELECT * FROM tasks WHERE project_id = ? ORDER BY wbs_code').all(req.params.projectId);
    res.json(rows);
  } catch (err) {
    console.error('查询任务失败:', err.message);
    res.status(500).json({ message: '查询失败: ' + err.message });
  }
});

// 创建任务
router.post('/', async (req, res) => {
  try {
    const { project_id, parent_id, wbs_code, name, start_date, end_date, duration, progress, assignee, status, description } = req.body;
    const result = await db.prepare(
      'INSERT INTO tasks (project_id, parent_id, wbs_code, name, start_date, end_date, duration, progress, assignee, status, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    ).run(project_id, parent_id, wbs_code, name, start_date, end_date, duration, progress, assignee, status || 'pending', description);
    res.json({ id: result.lastInsertRowid, message: '创建成功' });
  } catch (err) {
    console.error('创建任务失败:', err.message);
    res.status(500).json({ message: '创建失败: ' + err.message });
  }
});

// 更新任务
router.put('/:id', async (req, res) => {
  try {
    const { name, start_date, end_date, duration, progress, assignee, status, description } = req.body;
    // 记录变更日志：查询旧值
    const oldRes = await db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id);
    await db.prepare(
      'UPDATE tasks SET name=COALESCE(?, name), start_date=COALESCE(?, start_date), end_date=COALESCE(?, end_date), duration=COALESCE(?, duration), progress=COALESCE(?, progress), assignee=COALESCE(?, assignee), status=COALESCE(?, status), description=COALESCE(?, description) WHERE id=?'
    ).run(
      name, start_date, end_date, duration,
      progress, assignee, status, description,
      req.params.id
    );
    // 自动写变更日志
    const operator = req.user?.real_name || req.user?.username || '匿名';
    const fields = { name, progress, status, assignee, start_date, end_date, duration, description };
    for (const [field, newVal] of Object.entries(fields)) {
      if (newVal === undefined || newVal === null) continue;
      const oldVal = oldRes[field];
      if (oldVal !== newVal) {
        await db.prepare(
          `INSERT INTO change_logs (entity_type, entity_id, action, field_name, old_value, new_value, operator_name)
           VALUES ('task', ?, 'update', ?, ?, ?, ?)`
        ).run(req.params.id, field, oldVal == null ? null : String(oldVal), String(newVal), operator);
      }
    }
    res.json({ message: '更新成功' });
  } catch (err) {
    console.error('更新任务失败:', err.message);
    res.status(500).json({ message: '更新失败: ' + err.message });
  }
});

// 删除任务
router.delete('/:id', async (req, res) => {
  try {
    await db.prepare('DELETE FROM tasks WHERE id = ? OR parent_id = ?').run(req.params.id, req.params.id);
    res.json({ message: '删除成功' });
  } catch (err) {
    console.error('删除任务失败:', err.message);
    res.status(500).json({ message: '删除失败: ' + err.message });
  }
});

// 获取进度统计
router.get('/stats/:projectId', async (req, res) => {
  try {
    const row = await db.prepare(`
      SELECT
        COUNT(*)::int as total,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END)::int as completed,
        SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END)::int as in_progress,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END)::int as pending,
        SUM(CASE WHEN status = 'delayed' THEN 1 ELSE 0 END)::int as delayed,
        ROUND(AVG(progress)::numeric, 1) as avg_progress
      FROM tasks WHERE project_id = ?
    `).get(req.params.projectId);
    res.json(row);
  } catch (err) {
    console.error('查询统计失败:', err.message);
    res.status(500).json({ message: '查询失败: ' + err.message });
  }
});

module.exports = router;