const express = require('express');
const router = express.Router();
const teamService = require('../services/teamService');

router.get('/', (req, res) => {
  const { group, search, limit } = req.query;
  const teams = teamService.getAll({ group, search, limit });
  res.json({ success: true, data: teams });
});

// H2H历史交锋
router.get('/:id/h2h', (req, res) => {
  const opponentId = parseInt(req.query.opponent);
  if (!opponentId) return res.status(400).json({ success: false, message: '缺少对手ID' });
  const h2h = teamService.getH2H(parseInt(req.params.id), opponentId);
  res.json({ success: true, data: h2h });
});

router.get('/:id', (req, res) => {
  const team = teamService.getById(parseInt(req.params.id));
  if (!team) return res.status(404).json({ success: false, message: '球队不存在' });
  res.json({ success: true, data: team });
});

module.exports = router;
