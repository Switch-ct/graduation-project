const express = require('express');
const db = require('../config/db');
const auth = require('../middleware/auth');

const router = express.Router();
router.use(auth);

// 获取用户列表
router.get('/', async (req, res) => {
  try {
    const users = await db.prepare('SELECT id, username, real_name, role, created_at FROM users ORDER BY id').all();
    res.json(users);
  } catch (err) {
    console.error('查询用户失败:', err.message);
    res.status(500).json({ message: '查询失败' });
  }
});

module.exports = router;