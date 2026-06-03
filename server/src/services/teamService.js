const { teams, players, matches } = require('../models/database');

class TeamService {
  getAll({ group, search, limit } = {}) {
    let result = teams.getAll();
    if (group) result = result.filter(t => t.group_name === group);
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(t =>
        (t.name && t.name.toLowerCase().includes(q)) ||
        (t.name_cn && t.name_cn.includes(q))
      );
    }
    result.sort((a, b) => a.group_name.localeCompare(b.group_name) || a.fifa_rank - b.fifa_rank);
    if (limit) result = result.slice(0, parseInt(limit));
    return result;
  }

  getH2H(teamId, opponentId) {
    const h2hMatches = matches.query(m =>
      ((m.home_team_id === teamId && m.away_team_id === opponentId) ||
       (m.home_team_id === opponentId && m.away_team_id === teamId)) &&
      m.status === 'completed'
    ).sort((a, b) => new Date(b.match_date) - new Date(a.match_date));

    let wins = 0, draws = 0, losses = 0, goalsFor = 0, goalsAgainst = 0;
    h2hMatches.forEach(m => {
      const isHome = m.home_team_id === teamId;
      const gf = isHome ? m.home_score : m.away_score;
      const ga = isHome ? m.away_score : m.home_score;
      goalsFor += gf; goalsAgainst += ga;
      if (gf > ga) wins++;
      else if (gf === ga) draws++;
      else losses++;
    });

    const teamA = teams.getById(teamId);
    const teamB = teams.getById(opponentId);

    return {
      summary: {
        total: h2hMatches.length,
        teamA: { id: teamId, name: teamA?.name_cn || teamA?.name || '', wins, draws, losses, goalsFor, goalsAgainst },
        teamB: { id: opponentId, name: teamB?.name_cn || teamB?.name || '', wins: losses, draws, losses: wins, goalsFor: goalsAgainst, goalsAgainst: goalsFor }
      },
      recent: h2hMatches.slice(0, 5).map(m => ({
        id: m.id, match_date: m.match_date, stage: m.stage,
        home_team_id: m.home_team_id, away_team_id: m.away_team_id,
        home_score: m.home_score, away_score: m.away_score,
        home_name: (teams.getById(m.home_team_id)?.name_cn || ''),
        away_name: (teams.getById(m.away_team_id)?.name_cn || '')
      }))
    };
  }

  getById(id) {
    const team = teams.getById(id);
    if (!team) return null;

    team.players = players.query(p => p.team_id === id).sort((a, b) => a.number - b.number);

    team.recent_matches = matches.query(m =>
      (m.home_team_id === id || m.away_team_id === id) && m.status === 'completed'
    ).sort((a, b) => new Date(b.match_date) - new Date(a.match_date)).slice(0, 10).map(m => {
      const isHome = m.home_team_id === id;
      const oppId = isHome ? m.away_team_id : m.home_team_id;
      const opp = teams.getById(oppId);
      return {
        ...m,
        venue: isHome ? 'home' : 'away',
        opponent_name: opp?.name || '',
        opponent_cn: opp?.name_cn || '',
        opponent_flag: opp?.flag_emoji || ''
      };
    });

    return team;
  }
}

module.exports = new TeamService();
