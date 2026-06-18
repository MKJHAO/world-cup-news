/**
 * 比赛模拟引擎管理路由
 * 挂载在 /api/admin/simulator 下，已通过 adminAuth 中间件认证
 */

const express = require('express');
const router = express.Router();
const matchSimulator = require('../services/matchSimulator');

// 启动单场比赛模拟
router.post('/start/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const speed = parseInt(req.body.speed) || 1;
  const io = req.app.get('io');
  const result = matchSimulator.startMatch(id, speed, io);
  res.json(result);
});

// 停止单场比赛模拟
router.post('/stop/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const result = matchSimulator.stopMatch(id);
  res.json(result);
});

// 启动全部今日比赛
router.post('/start-all', (req, res) => {
  const speed = parseInt(req.body.speed) || 1;
  const io = req.app.get('io');
  const result = matchSimulator.startAllToday(speed, io);
  res.json(result);
});

// 停止全部模拟
router.post('/stop-all', (req, res) => {
  const result = matchSimulator.stopAll();
  res.json(result);
});

// 查看模拟状态
router.get('/status', (req, res) => {
  const result = matchSimulator.getStatus();
  res.json(result);
});

module.exports = router;
