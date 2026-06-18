/**
 * 公开模拟 API — 无需管理员认证
 * 挂载在 /api/simulator 下
 */

const express = require('express');
const router = express.Router();
const matchSimulator = require('../services/matchSimulator');

// 一键启动全部今日比赛（60x演示速度）
router.post('/quick-start', (req, res) => {
  const speed = parseInt(req.body?.speed) || 60;
  const io = req.app.get('io');
  const result = matchSimulator.startAllToday(speed, io);
  res.json(result);
});

// 启动指定比赛
router.post('/quick-start/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const speed = parseInt(req.body?.speed) || 60;
  const io = req.app.get('io');
  const result = matchSimulator.startMatch(id, speed, io);
  res.json(result);
});

// 停止全部模拟
router.post('/quick-stop', (req, res) => {
  const result = matchSimulator.stopAll();
  res.json(result);
});

// 查看模拟状态
router.get('/status', (req, res) => {
  const result = matchSimulator.getStatus();
  res.json(result);
});

module.exports = router;
