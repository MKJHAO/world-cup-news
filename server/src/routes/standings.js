const express = require('express');
const router = express.Router();
const standingService = require('../services/standingService');

router.get('/', (req, res) => {
  const { group, tournament } = req.query;
  const standings = standingService.getByGroup(group || null, tournament || null);
  res.json({ success: true, data: standings });
});

router.get('/groups', (req, res) => {
  const groups = standingService.getAllGroups();
  res.json({ success: true, data: groups });
});

router.get('/scorers', (req, res) => {
  const limit = parseInt(req.query.limit) || 10;
  const scorers = standingService.getTopScorers(limit);
  res.json({ success: true, data: scorers });
});

module.exports = router;
