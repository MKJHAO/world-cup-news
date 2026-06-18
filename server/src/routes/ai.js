const express = require('express');
const router = express.Router();
const aiService = require('../services/aiService');

// AI聊天
router.post('/chat', async (req, res) => {
  const { message, history, style } = req.body;
  if (!message) {
    return res.status(400).json({ success: false, message: '请输入消息' });
  }
  try {
    const data = await aiService.chat({ message, history: history || [], style: style || 'professional' });
    res.json({ success: true, data });
  } catch (e) {
    res.status(500).json({ success: false, message: 'AI服务异常' });
  }
});

// 赛前分析报告
router.get('/report/pre/:matchId', async (req, res) => {
  try {
    const data = await aiService.generatePreMatchReport(parseInt(req.params.matchId));
    if (!data) return res.status(503).json({ success: false, message: 'AI服务未配置' });
    res.json({ success: true, data });
  } catch (e) {
    res.status(400).json({ success: false, message: e.message });
  }
});

// 赛后总结报告
router.get('/report/post/:matchId', async (req, res) => {
  try {
    const data = await aiService.generatePostMatchSummary(parseInt(req.params.matchId));
    if (!data) return res.status(503).json({ success: false, message: 'AI服务未配置' });
    res.json({ success: true, data });
  } catch (e) {
    res.status(400).json({ success: false, message: e.message });
  }
});

// 实时解说生成（独立于聊天，不污染对话历史）
router.post('/commentary', async (req, res) => {
  const { matchId, homeTeam, awayTeam, homeScore, awayScore, status, minute } = req.body;
  if (!matchId) {
    return res.status(400).json({ success: false, message: '缺少比赛ID' });
  }
  try {
    const { matches } = require('../models/database');
    const match = matches.getById(parseInt(matchId));
    if (!match) return res.status(404).json({ success: false, message: '比赛不存在' });

    // 用当前请求的数据更新 match 对象（用于解说上下文）
    const ctx = {
      ...match,
      home_score: homeScore ?? match.home_score,
      away_score: awayScore ?? match.away_score,
      status: status || match.status
    };

    const text = await aiService.generateCommentaryChunk(ctx, 'professional');
    if (!text) return res.status(503).json({ success: false, message: 'AI服务未配置' });
    res.json({ success: true, data: { text } });
  } catch (e) {
    res.status(500).json({ success: false, message: '解说生成失败' });
  }
});

// 可选解说风格
router.get('/commentary/styles', (req, res) => {
  res.json({
    success: true,
    data: [
      { value: 'professional', label: '专业解说', icon: '🎙️' },
      { value: 'humorous', label: '幽默风趣', icon: '😄' },
      { value: 'dialect', label: '接地气', icon: '🤝' }
    ]
  });
});

module.exports = router;
