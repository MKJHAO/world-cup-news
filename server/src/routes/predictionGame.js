const express = require('express');
const router = express.Router();
const userService = require('../services/userService');
const predictionGameService = require('../services/predictionGameService');

// 用户认证中间件（所有写操作需要登录）
const auth = userService.userAuth;

// ==================== 预测 ====================

// 提交预测
router.post('/predictions/submit', auth, (req, res) => {
  try {
    const { match_id, predicted_result, predicted_home_score, predicted_away_score } = req.body;
    if (!match_id || !predicted_result) {
      return res.status(400).json({ success: false, message: '缺少必要参数' });
    }
    const prediction = predictionGameService.submitPrediction(
      req.user.id, match_id, predicted_result, predicted_home_score, predicted_away_score
    );
    res.json({ success: true, data: prediction });
  } catch (e) {
    res.status(400).json({ success: false, message: e.message });
  }
});

// 我的预测列表
router.get('/predictions/my', auth, (req, res) => {
  const data = predictionGameService.getUserPredictions(req.user.id, req.query);
  res.json({ success: true, data });
});

// 待结算预测
router.get('/predictions/pending', auth, (req, res) => {
  const data = predictionGameService.getPendingPredictions(req.user.id);
  res.json({ success: true, data });
});

// 某场比赛的预测（比赛开始后公开）
router.get('/predictions/match/:matchId', (req, res) => {
  const data = predictionGameService.getPredictionsByMatch(parseInt(req.params.matchId));
  res.json({ success: true, data });
});

// ==================== 排行榜 ====================

router.get('/leaderboard', (req, res) => {
  const { type, limit } = req.query;
  const data = predictionGameService.getLeaderboard({ type: type || 'all_time', limit: limit ? parseInt(limit) : 50 });
  res.json({ success: true, data });
});

// ==================== 群组 ====================

// 创建群组
router.post('/groups', auth, (req, res) => {
  try {
    const { name } = req.body;
    const group = predictionGameService.createGroup(name, req.user.id);
    res.json({ success: true, data: group });
  } catch (e) {
    res.status(400).json({ success: false, message: e.message });
  }
});

// 加入群组
router.post('/groups/join', auth, (req, res) => {
  try {
    const { invite_code } = req.body;
    const result = predictionGameService.joinGroup(invite_code, req.user.id);
    res.json({ success: true, data: result });
  } catch (e) {
    res.status(400).json({ success: false, message: e.message });
  }
});

// 我的群组
router.get('/groups/my', auth, (req, res) => {
  const data = predictionGameService.getUserGroups(req.user.id);
  res.json({ success: true, data });
});

// 群组详情
router.get('/groups/:id', (req, res) => {
  const data = predictionGameService.getGroup(parseInt(req.params.id));
  if (!data) return res.status(404).json({ success: false, message: '群组不存在' });
  res.json({ success: true, data });
});

// 退出群组
router.post('/groups/:id/leave', auth, (req, res) => {
  try {
    predictionGameService.leaveGroup(parseInt(req.params.id), req.user.id);
    res.json({ success: true, data: null });
  } catch (e) {
    res.status(400).json({ success: false, message: e.message });
  }
});

// ==================== Bracket Challenge ====================

// 提交Bracket
router.post('/bracket/submit', auth, (req, res) => {
  try {
    const bracket = predictionGameService.submitBracket(req.user.id, req.body);
    res.json({ success: true, data: bracket });
  } catch (e) {
    res.status(400).json({ success: false, message: e.message });
  }
});

// 我的Bracket
router.get('/bracket/my', auth, (req, res) => {
  const data = predictionGameService.getUserBracket(req.user.id);
  res.json({ success: true, data });
});

// Bracket排行榜
router.get('/bracket/leaderboard', (req, res) => {
  const data = predictionGameService.getBracketLeaderboard();
  res.json({ success: true, data });
});

module.exports = router;
