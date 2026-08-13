const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

const router = express.Router();

// 登录
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await db.prepare('SELECT * FROM users WHERE username = ?').get(username);
    if (!user) {
      return res.status(401).json({ message: '用户名或密码错误' });
    }
    const valid = bcrypt.compareSync(password, user.password);
    if (!valid) {
      return res.status(401).json({ message: '用户名或密码错误' });
    }
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    res.json({ token, user: { id: user.id, username: user.username, real_name: user.real_name, role: user.role } });
  } catch (err) {
    console.error('登录失败:', err.message);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 注册
router.post('/register', async (req, res) => {
  try {
    const { username, password, real_name, role } = req.body;
    const hashed = bcrypt.hashSync(password, 10);
    await db.prepare('INSERT INTO users (username, password, real_name, role) VALUES (?, ?, ?, ?)').run(username, hashed, real_name, role || 'user');
    res.json({ message: '创建成功' });
  } catch (err) {
    if (err.message?.includes('duplicate key') || err.message?.includes('unique')) {
      return res.status(400).json({ message: '用户名已存在' });
    }
    console.error('注册失败:', err.message);
    res.status(500).json({ message: '服务器错误' });
  }
});

module.exports = router;