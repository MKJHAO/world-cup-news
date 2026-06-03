const { standings, teams, goalScorers, matches } = require('../models/database');

class StandingService {
  _generate2026Standings(group) {
    const allTeams = teams.getAll();
    const existingStandings = standings.getAll().filter(s => s.tournament === '2026');
    const existingTeamIds = new Set(existingStandings.map(s => s.team_id));

    // 过滤：只对未在2026积分榜中的球队生成占位数据
    const eligible = allTeams.filter(t => !existingTeamIds.has(t.id) && t.group_name);
    const groups = group ? [group] : [...new Set(eligible.map(t => t.group_name))].sort();

    const result = [];
    let nextId = standings.getAll().length + 1;
    groups.forEach(g => {
      const groupTeams = eligible.filter(t => t.group_name === g);
      // 随机排位用于初始展示（后续有真实数据再更新）
      const shuffled = [...groupTeams].sort(() => 0.5 - Math.random());
      shuffled.forEach((t, i) => {
        const played = 0, won = 0, drawn = 0, lost = 0;
        const goals_for = 0, goals_against = 0;
        result.push({
          id: nextId++, team_id: t.id, group_name: g,
          played, won, drawn, lost, goals_for, goals_against, goal_diff: 0, points: 0,
          tournament: '2026'
        });
      });
    });
    return result;
  }

  calculateForm(teamId) {
    const teamMatches = matches.query(m =>
      (m.home_team_id === teamId || m.away_team_id === teamId) && m.status === 'completed'
    ).sort((a, b) => new Date(b.match_date) - new Date(a.match_date)).slice(0, 5);

    return teamMatches.map(m => {
      const isHome = m.home_team_id === teamId;
      const gf = isHome ? m.home_score : m.away_score;
      const ga = isHome ? m.away_score : m.home_score;
      const oppId = isHome ? m.away_team_id : m.home_team_id;
      const opp = teams.getById(oppId);
      return {
        result: gf > ga ? 'W' : gf === ga ? 'D' : 'L',
        match_id: m.id,
        opponent_name: opp?.name_cn || opp?.name || '',
        score: `${gf}-${ga}`
      };
    });
  }

  getByGroup(group, tournament) {
    let result = standings.getAll();

    if (tournament) {
      result = result.filter(s => {
        const t = s.tournament || '2022';
        return t === tournament;
      });
    }

    // 2026积分榜为空时自动生成占位数据
    if ((!tournament || tournament === '2026') && result.length === 0) {
      const generated = this._generate2026Standings(group || null);
      // 合并回数据库（下次启动有数据）
      generated.forEach(s => {
        if (!standings.getById(s.id)) standings.insert(s);
      });
      result = generated;
    }

    if (group) result = result.filter(s => s.group_name === group);

    const enriched = result.map(s => {
      const t = teams.getById(s.team_id);
      return {
        ...s, name: t?.name || '', name_cn: t?.name_cn || '', flag_emoji: t?.flag_emoji || '',
        form: this.calculateForm(s.team_id)
      };
    });

    enriched.sort((a, b) => {
      if (group) {
        return b.points - a.points || b.goal_diff - a.goal_diff || b.goals_for - a.goals_for;
      }
      return a.group_name.localeCompare(b.group_name) || b.points - a.points || b.goal_diff - a.goal_diff || b.goals_for - a.goals_for;
    });

    return enriched;
  }

  getTopScorers(limit = 10) {
    const result = goalScorers.getAll()
      .sort((a, b) => b.goals - a.goals || b.assists - a.assists)
      .slice(0, limit)
      .map(s => {
        const t = teams.getById(s.team_id);
        return { ...s, team_name: t?.name || '', team_cn: t?.name_cn || '', flag_emoji: t?.flag_emoji || '' };
      });
    return result;
  }

  getAllGroups() {
    const groups = [...new Set(standings.getAll().map(s => s.group_name))];
    return groups.sort().map(g => ({ group_name: g }));
  }
}

module.exports = new StandingService();
