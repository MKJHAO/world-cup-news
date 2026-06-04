const express = require('express');
const router = express.Router();
const userService = require('../services/userService');

// 注册
router.post('/register', (req, res) => {
  try {
    const { nickname } = req.body;
    const result = userService.register(nickname);
    res.json({ success: true, data: result });
  } catch (e) {
    res.status(400).json({ success: false, message: e.message });
  }
});

// 获取当前用户信息
router.get('/me', userService.userAuth, (req, res) => {
  const user = userService.getById(req.user.id);
  res.json({ success: true, data: user });
});

// 获取用户公开信息
router.get('/:id', (req, res) => {
  const user = userService.getById(parseInt(req.params.id));
  if (!user) return res.status(404).json({ success: false, message: '用户不存在' });
  res.json({ success: true, data: user });
});

module.exports = router;
