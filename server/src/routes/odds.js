const express = require('express');
const router = express.Router();
const oddsService = require('../services/oddsService');

router.get('/match/:matchId', (req, res) => {
  const data = oddsService.getByMatch(parseInt(req.params.matchId));
  res.json({ success: true, data });
});

router.get('/team/:teamId', (req, res) => {
  const data = oddsService.getTeamAnalysis(parseInt(req.params.teamId));
  if (!data) return res.status(404).json({ success: false, message: '球队不存在' });
  res.json({ success: true, data });
});

router.get('/analysis', (req, res) => {
  const { type, team, compare } = req.query;
  if (team) {
    const data = oddsService.getTeamAnalysis(parseInt(team));
    return res.json({ success: true, data });
  }
  if (compare) {
    const ids = compare.split(',').map(Number);
    if (ids.length === 2) {
      const data = oddsService.compareTeams(ids[0], ids[1]);
      return res.json({ success: true, data });
    }
  }
  if (type) {
    const data = oddsService.getMatchTypeAnalysis(type);
    return res.json({ success: true, data });
  }
  const data = oddsService.getAllTeamsRanking();
  res.json({ success: true, data });
});

router.get('/stages', (req, res) => {
  const data = oddsService.getStageAnalysis();
  res.json({ success: true, data });
});

router.get('/match-types', (req, res) => {
  const group = oddsService.getMatchTypeAnalysis('group');
  const knockout = oddsService.getMatchTypeAnalysis('knockout');
  res.json({ success: true, data: { group, knockout } });
});

router.get('/comparison', (req, res) => {
  const { a, b } = req.query;
  if (!a || !b) return res.status(400).json({ success: false, message: '需要两个球队ID' });
  const data = oddsService.compareTeams(parseInt(a), parseInt(b));
  res.json({ success: true, data });
});

module.exports = router;
