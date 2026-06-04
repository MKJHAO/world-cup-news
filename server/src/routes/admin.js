const express = require('express');
const router = express.Router();
const { teams, players, matches, matchEvents, standings, news, goalScorers } = require('../models/database');

// 比赛管理
router.get('/matches', (req, res) => {
  const result = matches.getAll().sort((a, b) => new Date(b.match_date) - new Date(a.match_date)).slice(0, 100).map(m => {
    const ht = teams.getById(m.home_team_id);
    const at = teams.getById(m.away_team_id);
    return { ...m, home_team_cn: ht?.name_cn || '', away_team_cn: at?.name_cn || '' };
  });
  res.json({ success: true, data: result });
});

router.put('/matches/:id', (req, res) => {
  const { status, home_score, away_score, home_penalty, away_penalty } = req.body;
  const id = parseInt(req.params.id);

  const match = matches.getById(id);
  if (!match) return res.status(404).json({ success: false, message: '比赛不存在' });

  matches.update(id, {
    status,
    home_score: typeof home_score === 'number' ? home_score : (home_score || 0),
    away_score: typeof away_score === 'number' ? away_score : (away_score || 0),
    home_penalty: home_penalty || 0,
    away_penalty: away_penalty || 0
  });

  const updatedMatch = matches.getById(id);

  if (status === 'completed') {
    updateStandings(updatedMatch);
    // 触发预测评分
    try {
      const predictionGameService = require('../services/predictionGameService');
      const scored = predictionGameService.scoreMatchPredictions(id);
      if (scored > 0) {
        console.log(`  🎯 已结算 ${scored} 条预测 (比赛 #${id})`);
        // WebSocket通知
        const io = req.app.get('io');
        if (io) {
          io.emit('prediction_scored', { match_id: id, count: scored, points: 0 });
        }
      }
    } catch (e) {
      console.error('预测评分失败:', e.message);
    }
  }

  const ht = teams.getById(updatedMatch.home_team_id);
  const at = teams.getById(updatedMatch.away_team_id);
  const enriched = { ...updatedMatch, home_team_cn: ht?.name_cn || '', away_team_cn: at?.name_cn || '' };

  const io = req.app.get('io');
  if (io) {
    io.emit('match_updated', enriched);
    if (match.group_name) io.emit(`group_${match.group_name}_update`, enriched);
  }

  res.json({ success: true, data: enriched });
});

router.post('/matches/:id/events', (req, res) => {
  const { team_id, player_name, event_type, minute, extra_info } = req.body;
  const event = matchEvents.insert({
    match_id: parseInt(req.params.id), team_id, player_name, event_type, minute: parseInt(minute), extra_info: extra_info || ''
  });

  const io = req.app.get('io');
  if (io) {
    io.emit(`match_${req.params.id}_event`, event);
    io.emit('new_event', { match_id: parseInt(req.params.id), event });
  }

  res.json({ success: true, data: event });
});

function updateStandings(match) {
  if (!match.group_name || match.stage !== 'group') return;
  recalculateGroupStandings(match.group_name);
}

function recalculateGroupStandings(groupName) {
  const groupMatches = matches.query(m =>
    m.group_name === groupName && m.stage === 'group' && m.status === 'completed'
  );

  const groupStandings = standings.query(s => s.group_name === groupName);
  const teamStats = {};

  groupStandings.forEach(s => {
    teamStats[s.team_id] = { played: 0, won: 0, drawn: 0, lost: 0, goals_for: 0, goals_against: 0, goal_diff: 0, points: 0 };
  });

  groupMatches.forEach(m => {
    if (!teamStats[m.home_team_id]) teamStats[m.home_team_id] = { played: 0, won: 0, drawn: 0, lost: 0, goals_for: 0, goals_against: 0, goal_diff: 0, points: 0 };
    if (!teamStats[m.away_team_id]) teamStats[m.away_team_id] = { played: 0, won: 0, drawn: 0, lost: 0, goals_for: 0, goals_against: 0, goal_diff: 0, points: 0 };

    const homePts = m.home_score > m.away_score ? 3 : (m.home_score === m.away_score ? 1 : 0);
    const awayPts = m.away_score > m.home_score ? 3 : (m.home_score === m.away_score ? 1 : 0);

    teamStats[m.home_team_id].played++;
    teamStats[m.home_team_id].goals_for += m.home_score;
    teamStats[m.home_team_id].goals_against += m.away_score;
    teamStats[m.home_team_id].points += homePts;
    if (homePts === 3) teamStats[m.home_team_id].won++;
    else if (homePts === 1) teamStats[m.home_team_id].drawn++;
    else teamStats[m.home_team_id].lost++;

    teamStats[m.away_team_id].played++;
    teamStats[m.away_team_id].goals_for += m.away_score;
    teamStats[m.away_team_id].goals_against += m.home_score;
    teamStats[m.away_team_id].points += awayPts;
    if (awayPts === 3) teamStats[m.away_team_id].won++;
    else if (awayPts === 1) teamStats[m.away_team_id].drawn++;
    else teamStats[m.away_team_id].lost++;
  });

  Object.entries(teamStats).forEach(([teamId, stats]) => {
    stats.goal_diff = stats.goals_for - stats.goals_against;
    const existing = groupStandings.find(s => s.team_id === parseInt(teamId));
    if (existing) {
      standings.update(existing.id, stats);
    }
  });
}

// 新闻管理
router.get('/news', (req, res) => {
  res.json({ success: true, data: news.getAll().sort((a, b) => new Date(b.published_at) - new Date(a.published_at)) });
});

router.post('/news', (req, res) => {
  const { title, summary, content, cover_url, category, source } = req.body;
  const article = news.insert({
    title, summary, content, cover_url: cover_url || '', category: category || 'general',
    source: source || '', published_at: new Date().toISOString()
  });
  res.json({ success: true, data: article });
});

router.delete('/news/:id', (req, res) => {
  news.delete(parseInt(req.params.id));
  res.json({ success: true });
});

// 统计概览
router.get('/stats', (req, res) => {
  const allMatches = matches.getAll();
  const completed = allMatches.filter(m => m.status === 'completed');
  const totalGoals = completed.reduce((s, m) => s + m.home_score + m.away_score, 0);
  const avgGoals = completed.length > 0 ? (totalGoals / completed.length).toFixed(1) : '0';
  const now = new Date();
  const upcoming2026 = allMatches.filter(m => new Date(m.match_date) > now && (m.match_date || '').startsWith('2026')).length;

  res.json({
    success: true,
    data: {
      totalMatches: allMatches.length,
      totalGoals,
      avgGoals,
      totalTeams: teams.count(),
      totalPlayers: players.count(),
      totalNews: news.count(),
      upcoming2026Matches: upcoming2026
    }
  });
});

module.exports = router;
