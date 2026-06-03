const { odds, matches, teams } = require('../models/database');

class OddsService {
  getByMatch(matchId) {
    return odds.query(o => o.match_id === matchId);
  }

  getTeamAnalysis(teamId) {
    const team = teams.getById(teamId);
    if (!team) return null;

    const teamMatches = matches.query(m =>
      (m.home_team_id === teamId || m.away_team_id === teamId) && m.status === 'completed'
    );
    const teamOdds = odds.query(o => o.team_id === teamId);

    const groupOdds = teamOdds.filter(o => {
      const m = matches.getById(o.match_id);
      return m && m.stage === 'group';
    });
    const knockoutOdds = teamOdds.filter(o => {
      const m = matches.getById(o.match_id);
      return m && ['round16', 'quarter', 'semi', 'third', 'final', 'round32'].includes(m.stage);
    });

    const avgWinProb = teamOdds.length > 0
      ? teamOdds.reduce((s, o) => s + (o.implied_win_prob || 0), 0) / teamOdds.length
      : 0;

    const winCount = teamMatches.filter(m => {
      const isHome = m.home_team_id === teamId;
      return isHome ? m.home_score > m.away_score : m.away_score > m.home_score;
    }).length;

    const actualWinRate = teamMatches.length > 0 ? winCount / teamMatches.length : 0;

    return {
      team: { id: teamId, name: team.name, name_cn: team.name_cn, group_name: team.group_name },
      totalMatches: teamMatches.length,
      totalOdds: teamOdds.length,
      avgWinProb: Math.round(avgWinProb * 1000) / 10,
      actualWinRate: Math.round(actualWinRate * 1000) / 10,
      groupStage: { count: groupOdds.length, avgProb: groupOdds.length > 0 ? Math.round(groupOdds.reduce((s, o) => s + (o.implied_win_prob || 0), 0) / groupOdds.length * 1000) / 10 : 0 },
      knockout: { count: knockoutOdds.length, avgProb: knockoutOdds.length > 0 ? Math.round(knockoutOdds.reduce((s, o) => s + (o.implied_win_prob || 0), 0) / knockoutOdds.length * 1000) / 10 : 0 },
      recentOdds: teamOdds.slice(-5).reverse()
    };
  }

  getMatchTypeAnalysis(type = 'group') {
    const result = odds.getAll();
    const filtered = result.filter(o => {
      const m = matches.getById(o.match_id);
      if (!m) return false;
      if (type === 'knockout') return ['round16', 'quarter', 'semi', 'third', 'final', 'round32'].includes(m.stage);
      return m.stage === type;
    });

    const avgWinProb = filtered.length > 0 ? Math.round(filtered.reduce((s, o) => s + (o.implied_win_prob || 0), 0) / filtered.length * 1000) / 10 : 0;
    const avgDrawProb = filtered.length > 0 ? Math.round(filtered.reduce((s, o) => s + (o.implied_draw_prob || 0), 0) / filtered.length * 1000) / 10 : 0;

    return {
      type,
      totalRecords: filtered.length,
      avgWinProb,
      avgDrawProb,
      distribution: this._getProbDistribution(filtered)
    };
  }

  getStageAnalysis() {
    const stages = ['group', 'round16', 'quarter', 'semi', 'third', 'final'];
    return stages.map(stage => {
      const stageMatches = matches.query(m => m.stage === stage && m.status === 'completed');
      const stageOdds = odds.query(o => {
        const m = matches.getById(o.match_id);
        return m && m.stage === stage;
      });

      const favorites = stageOdds.filter(o => o.implied_win_prob > 0.45);
      const actualWins = favorites.filter(o => {
        const m = matches.getById(o.match_id);
        if (!m) return false;
        const isHome = o.team_id === m.home_team_id;
        return isHome ? m.home_score > m.away_score : m.away_score > m.home_score;
      }).length;

      return {
        stage,
        matchCount: stageMatches.length,
        oddsCount: stageOdds.length,
        avgFavoriteProb: stageOdds.length > 0 ? Math.round(stageOdds.filter(o => o.implied_win_prob > 0.45).reduce((s, o) => s + o.implied_win_prob, 0) / Math.max(favorites.length, 1) * 1000) / 10 : 0,
        favoriteWinRate: favorites.length > 0 ? Math.round(actualWins / favorites.length * 1000) / 10 : 0
      };
    });
  }

  compareTeams(teamId1, teamId2) {
    return {
      teamA: this.getTeamAnalysis(teamId1),
      teamB: this.getTeamAnalysis(teamId2)
    };
  }

  getAllTeamsRanking() {
    const allTeams = teams.getAll();
    const rankings = allTeams.map(t => {
      const analysis = this.getTeamAnalysis(t.id);
      return {
        team_id: t.id, name: t.name, name_cn: t.name_cn, group_name: t.group_name,
        avgWinProb: analysis?.avgWinProb || 0,
        actualWinRate: analysis?.actualWinRate || 0,
        totalMatches: analysis?.totalMatches || 0
      };
    }).filter(r => r.totalMatches > 0);

    rankings.sort((a, b) => b.avgWinProb - a.avgWinProb);
    return rankings;
  }

  _getProbDistribution(data) {
    const bins = { '0-20%': 0, '20-35%': 0, '35-50%': 0, '50-65%': 0, '65-100%': 0 };
    data.forEach(o => {
      const p = (o.implied_win_prob || 0) * 100;
      if (p < 20) bins['0-20%']++;
      else if (p < 35) bins['20-35%']++;
      else if (p < 50) bins['35-50%']++;
      else if (p < 65) bins['50-65%']++;
      else bins['65-100%']++;
    });
    return bins;
  }
}

module.exports = new OddsService();
