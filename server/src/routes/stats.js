// 关键路径 & 延期预警 & 工作量统计
const express = require('express');
const router = express.Router();
const db = require('../config/db');

// === 关键路径算法 ===
// 输入：扁平任务列表
// 输出：每个任务的最早开始、最晚开始、是否在关键路径
function calcCriticalPath(tasks) {
  if (!tasks || tasks.length === 0) return [];
  // 建立 ID 索引
  const map = {};
  for (const t of tasks) map[t.id] = { ...t, children: [] };

  // 父子依赖（简化版：父任务依赖所有子任务，子任务完成后父任务才能开始）
  const taskIds = new Set(tasks.map(t => t.id));
  const dependencyMap = {}; // taskId -> [dependsOnIds]
  for (const t of tasks) {
    dependencyMap[t.id] = [];
  }
  // 父依赖子
  const childIds = {};
  for (const t of tasks) {
    if (t.parent_id && taskIds.has(t.parent_id)) {
      if (!childIds[t.parent_id]) childIds[t.parent_id] = [];
      childIds[t.parent_id].push(t.id);
      dependencyMap[t.id].push(t.parent_id);
    }
  }

  // 正向：计算最早开始 ES
  // 简化：所有子节点完成（duration 之和）后，父节点才能开始
  const ES = {}, EF = {}, LS = {}, LF = {};
  // 递归计算 ES（按 ID 拓扑序）
  function calcES(id) {
    if (ES[id] !== undefined) return ES[id];
    if (!map[id].start_date) {
      ES[id] = 0; EF[id] = map[id].duration || 0;
      return ES[id];
    }
    ES[id] = new Date(map[id].start_date).getTime();
    if (childIds[id]) {
      let maxEnd = ES[id];
      for (const cid of childIds[id]) {
        const cend = calcEF(cid);
        if (cend > maxEnd) maxEnd = cend;
      }
      ES[id] = maxEnd;
    }
    EF[id] = ES[id] + (map[id].duration || 0) * 86400000;
    return ES[id];
  }
  function calcEF(id) {
    calcES(id);
    return EF[id];
  }

  // 第一次遍历算 ES
  for (const t of tasks) calcES(t.id);

  // 找项目结束时间（所有任务 EF 最大）
  let projectEnd = 0;
  for (const id in EF) if (EF[id] > projectEnd) projectEnd = EF[id];

  // 反向：计算最晚开始 LF
  function calcLF(id) {
    if (LF[id] !== undefined) return LF[id];
    LF[id] = projectEnd;
    if (childIds[id]) {
      let minChildStart = LF[id];
      for (const cid of childIds[id]) {
        const ces = calcES(cid);
        if (ces < minChildStart) minChildStart = ces;
      }
      LF[id] = minChildStart;
    }
    LS[id] = LF[id] - (map[id].duration || 0) * 86400000;
    return LF[id];
  }
  for (const t of tasks) calcLF(t.id);

  // 关键路径：ES === LS 且无 slack
  return tasks.map(t => {
    const slack = LS[t.id] - ES[t.id];
    return {
      ...t,
      earliest_start: ES[t.id],
      latest_start: LS[t.id],
      slack_days: Math.round(slack / 86400000),
      is_critical: Math.abs(slack) < 86400000, // 容差 1 天
    };
  });
}

// === 接口：项目关键路径 ===
router.get('/critical-path/project/:projectId', async (req, res) => {
  try {
    const r = await db.query(
      'SELECT * FROM tasks WHERE project_id = $1 ORDER BY wbs_code',
      [req.params.projectId]
    );
    const result = calcCriticalPath(r.rows);
    res.json({
      tasks: result,
      critical_count: result.filter(t => t.is_critical).length,
    });
  } catch (e) {
    console.error('GET critical-path error:', e);
    res.status(500).json({ message: '服务器错误' });
  }
});

// === 接口：项目延期预警 ===
router.get('/overdue/project/:projectId', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    // 项目本身延期
    const projRes = await db.query('SELECT * FROM projects WHERE id = $1', [req.params.projectId]);
    if (projRes.rows.length === 0) return res.status(404).json({ message: '项目不存在' });
    const project = projRes.rows[0];

    const overdue = {
      project: null,
      tasks: [],
    };

    // 检查项目是否延期
    if (project.end_date && project.end_date < today && project.status !== 'completed') {
      const days = Math.floor((new Date(today) - new Date(project.end_date)) / 86400000);
      overdue.project = {
        id: project.id,
        name: project.name,
        planned_end: project.end_date,
        days_overdue: days,
      };
    }

    // 检查延期任务
    const taskRes = await db.query(
      `SELECT id, wbs_code, name, end_date, progress, status FROM tasks
       WHERE project_id = $1 AND end_date < $2 AND status != 'completed'
       ORDER BY end_date`,
      [req.params.projectId, today]
    );
    for (const t of taskRes.rows) {
      const days = Math.floor((new Date(today) - new Date(t.end_date)) / 86400000);
      overdue.tasks.push({
        ...t,
        days_overdue: days,
      });
    }

    res.json(overdue);
  } catch (e) {
    console.error('GET overdue error:', e);
    res.status(500).json({ message: '服务器错误' });
  }
});

// === 接口：全局延期预警（首页 Dashboard + 延期列表用） ===
router.get('/overdue/all', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    // 延期项目：按延期天数从大到小排
    const projRes = await db.query(
      `SELECT p.id, p.name, p.end_date, p.status, p.manager
       FROM projects p
       WHERE p.end_date < $1 AND p.status != 'completed'
       ORDER BY p.end_date ASC`,
      [today]
    );
    const overdueProjects = projRes.rows.map(p => ({
      ...p,
      days_overdue: Math.floor((new Date(today) - new Date(p.end_date)) / 86400000),
    })).sort((a, b) => b.days_overdue - a.days_overdue);

    // 延期任务：取所有（不再 LIMIT 20）+ 负责人
    const taskRes = await db.query(
      `SELECT t.id, t.wbs_code, t.name, t.end_date, t.status, t.assignee,
              t.project_id, p.name as project_name
       FROM tasks t JOIN projects p ON t.project_id = p.id
       WHERE t.end_date < $1 AND t.status != 'completed'
       ORDER BY t.end_date ASC`,
      [today]
    );
    const overdueTasks = taskRes.rows.map(t => ({
      ...t,
      days_overdue: Math.floor((new Date(today) - new Date(t.end_date)) / 86400000),
    })).sort((a, b) => b.days_overdue - a.days_overdue);

    // 汇总：所有延期任务的 days_overdue 总和（评估影响面）
    const totalImpact = overdueTasks.reduce((s, t) => s + t.days_overdue, 0);

    res.json({
      overdue_projects: overdueProjects,
      overdue_tasks: overdueTasks,
      summary: {
        project_count: overdueProjects.length,
        task_count: overdueTasks.length,
        total_impact_days: totalImpact,
      }
    });
  } catch (e) {
    console.error('GET overdue/all error:', e);
    res.status(500).json({ message: '服务器错误' });
  }
});

// === 接口：工作量统计（按负责人） ===
router.get('/workload', async (req, res) => {
  try {
    const r = await db.query(
      `SELECT
         COALESCE(assignee, '未分配') as name,
         COUNT(*) as total_tasks,
         SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress,
         SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
         SUM(CASE WHEN status = 'delayed' THEN 1 ELSE 0 END) as delayed,
         ROUND(AVG(progress), 1) as avg_progress
       FROM tasks
       GROUP BY assignee
       ORDER BY total_tasks DESC`
    );
    res.json(r.rows);
  } catch (e) {
    console.error('GET workload error:', e);
    res.status(500).json({ message: '服务器错误' });
  }
});

// === 接口：Dashboard 增强统计 ===
router.get('/dashboard', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    // 项目状态分布
    const projectStats = await db.query(
      `SELECT status, COUNT(*) as cnt FROM projects GROUP BY status`
    );
    // 任务状态分布
    const taskStats = await db.query(
      `SELECT status, COUNT(*) as cnt FROM tasks GROUP BY status`
    );
    // 7 项目预算
    const budgetStats = await db.query(
      `SELECT name, total_budget, status FROM projects WHERE total_budget IS NOT NULL ORDER BY total_budget DESC`
    );
    // 即将到期（未来 7 天内）
    const upcomingRes = await db.query(
      `SELECT t.id, t.wbs_code, t.name, t.end_date, p.name as project_name
       FROM tasks t JOIN projects p ON t.project_id = p.id
       WHERE t.end_date >= $1 AND t.end_date <= $2 AND t.status != 'completed'
       ORDER BY t.end_date LIMIT 10`,
      [today, new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]]
    );
    res.json({
      project_status: projectStats.rows,
      task_status: taskStats.rows,
      projects_by_budget: budgetStats.rows,
      upcoming_tasks: upcomingRes.rows,
    });
  } catch (e) {
    console.error('GET dashboard error:', e);
    res.status(500).json({ message: '服务器错误' });
  }
});

module.exports = router;
