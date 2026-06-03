const express = require('express');
const router = express.Router();
const dataFetcher = require('../services/dataFetcher');

// 刷新全部数据
router.post('/refresh', async (req, res) => {
  try {
    const result = await dataFetcher.refreshAll();
    res.json({ success: true, data: result });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// 仅刷新2026世界杯赛程
router.post('/refresh/worldcup2026', async (req, res) => {
  try {
    const result = await dataFetcher.syncWorldCup2026();
    res.json({ success: true, data: result });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// 仅刷新新闻
router.post('/refresh/news', async (req, res) => {
  try {
    const result = await dataFetcher.fetchLatestNews();
    res.json({ success: true, data: result });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// 获取数据同步状态
router.get('/status', (req, res) => {
  const { matches, news, teams } = require('../models/database');
  const now = new Date();
  const upcoming2026 = matches.query(m =>
    new Date(m.match_date) > now && m.match_date.startsWith('2026')
  ).length;
  const total2026 = matches.query(m => m.match_date.startsWith('2026')).length;

  res.json({
    success: true,
    data: {
      totalTeams: teams.count(),
      totalMatches: matches.count(),
      totalNews: news.count(),
      upcoming2026Matches: upcoming2026,
      total2026Matches: total2026
    }
  });
});

module.exports = router;
