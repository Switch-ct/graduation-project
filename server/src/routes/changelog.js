// 变更日志路由
const express = require('express');
const router = express.Router();
const db = require('../config/db');

// 查询某个实体的变更记录
router.get('/:entityType/:entityId', async (req, res) => {
  try {
    const r = await db.query(
      `SELECT * FROM change_logs
       WHERE entity_type = $1 AND entity_id = $2
       ORDER BY created_at DESC LIMIT 100`,
      [req.params.entityType, req.params.entityId]
    );
    res.json(r.rows);
  } catch (e) {
    console.error('GET /changelog error:', e);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 最近 N 条全局变更记录
router.get('/', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const r = await db.query(
      `SELECT * FROM change_logs ORDER BY created_at DESC LIMIT $1`,
      [Math.min(limit, 200)]
    );
    res.json(r.rows);
  } catch (e) {
    res.status(500).json({ message: '服务器错误' });
  }
});

// 写一条变更记录（其它模块调用）
async function logChange(client, entityType, entityId, action, fieldName, oldVal, newVal, userId, userName) {
  try {
    await (client || db).query(
      `INSERT INTO change_logs (entity_type, entity_id, action, field_name, old_value, new_value, operator_id, operator_name)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [entityType, entityId, action, fieldName, oldVal ? String(oldVal) : null, newVal ? String(newVal) : null, userId, userName]
    );
  } catch (e) {
    console.error('logChange error:', e);
  }
}

module.exports = router;
module.exports.logChange = logChange;
