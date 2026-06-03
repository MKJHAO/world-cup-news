const express = require('express');
const router = express.Router();
const gossipService = require('../services/gossipService');

router.get('/team/:teamId', (req, res) => {
  const data = gossipService.getTeamGossipStats(parseInt(req.params.teamId));
  if (!data) return res.status(404).json({ success: false, message: '球队不存在' });
  res.json({ success: true, data });
});

router.get('/all', (req, res) => {
  const data = gossipService.getAllGossipStats();
  res.json({ success: true, data });
});

router.get('/trend/:teamId', (req, res) => {
  const data = gossipService.getGossipTrend(parseInt(req.params.teamId));
  if (!data) return res.status(404).json({ success: false, message: '球队不存在' });
  res.json({ success: true, data });
});

module.exports = router;
