const express = require('express');
const router = express.Router();
const matchService = require('../services/matchService');

router.get('/', (req, res) => {
  const { group, stage, status, search, tournament, limit, offset } = req.query;
  const matches = matchService.getAll({
    group, stage, status, search, tournament,
    limit: parseInt(limit) || 50,
    offset: parseInt(offset) || 0
  });
  res.json({ success: true, data: matches });
});

router.get('/today', (req, res) => {
  const matches = matchService.getTodayMatches();
  res.json({ success: true, data: matches });
});

router.get('/dates', (req, res) => {
  const dates = matchService.getMatchDates();
  res.json({ success: true, data: dates });
});

router.get('/date/:date', (req, res) => {
  const matches = matchService.getByDate(req.params.date);
  res.json({ success: true, data: matches });
});

router.get('/bracket', (req, res) => {
  const matches = matchService.getKnockoutBracket();
  res.json({ success: true, data: matches });
});

// 进行中的比赛 (直播)
router.get('/live', (req, res) => {
  const { matches } = require('../models/database');
  const liveMatches = matches.query(m =>
    ['live', 'first_half', 'halftime', 'second_half'].includes(m.status)
  );
  const enriched = liveMatches.map(m => matchService._enrich(m));
  res.json({ success: true, data: enriched });
});

// 比赛聊天历史
router.get('/:id/chat', (req, res) => {
  const { matchMessages } = require('../models/database');
  const msgs = matchMessages.query(m => m.match_id === parseInt(req.params.id))
    .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
    .slice(-200);
  res.json({ success: true, data: msgs });
});

// 比赛统计数据
router.get('/:id/statistics', (req, res) => {
  const statsService = require('../services/statsService');
  const stats = statsService.getByMatch(parseInt(req.params.id));
  res.json({ success: true, data: stats });
});

router.get('/:id', (req, res) => {
  const match = matchService.getById(parseInt(req.params.id));
  if (!match) return res.status(404).json({ success: false, message: '比赛不存在' });
  res.json({ success: true, data: match });
});

module.exports = router;
