const express = require('express');
const router = express.Router();
const predictionService = require('../services/predictionService');

// 全局沙盘概览
router.get('/sandbox', (req, res) => {
  const data = predictionService.getFullSandbox();
  res.json({ success: true, data });
});

// 球队实力排名
router.get('/rankings', (req, res) => {
  const data = predictionService.getTeamRankings();
  res.json({ success: true, data });
});

// 单队预测详情
router.get('/team/:teamId', (req, res) => {
  const data = predictionService.getTeamPrediction(parseInt(req.params.teamId));
  if (!data) return res.status(404).json({ success: false, message: '球队不存在' });
  res.json({ success: true, data });
});

// 小组沙盘
router.get('/group/:groupName', (req, res) => {
  const data = predictionService.getGroupSandbox(req.params.groupName);
  if (!data) return res.status(404).json({ success: false, message: '小组不存在' });
  res.json({ success: true, data });
});

// 球队雷达图数据
router.get('/radar/:teamId', (req, res) => {
  const data = predictionService.getTeamRadar(parseInt(req.params.teamId));
  if (!data) return res.status(404).json({ success: false, message: '球队不存在' });
  res.json({ success: true, data });
});

module.exports = router;
