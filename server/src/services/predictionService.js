const { teams, matches, odds, news } = require('../models/database');

class PredictionService {
  // FIFA排名 → 实力分映射 (排名越低实力越强, 输出0-100)
  _rankToScore(rank) {
    if (!rank || rank <= 0) return 50;
    if (rank <= 5) return 90 + (5 - rank) * 0.5;
    if (rank <= 10) return 85 + (10 - rank) * 1;
    if (rank <= 20) return 75 + (20 - rank) * 0.5;
    if (rank <= 30) return 65 + (30 - rank) * 0.5;
    if (rank <= 50) return 45 + (50 - rank) * 0.5;
    if (rank <= 80) return 25 + (80 - rank) * 0.4;
    return Math.max(5, 25 - (rank - 80) * 0.2);
  }

  // 综合实力评分
  _calculateStrength(team) {
    const rankScore = this._rankToScore(team.fifa_rank || 50);

    // 历史胜率加权
    const teamMatches = matches.query(m =>
      (m.home_team_id === team.id || m.away_team_id === team.id) && m.status === 'completed'
    );
    let histBonus = 0;
    if (teamMatches.length > 0) {
      const wins = teamMatches.filter(m => {
        const isHome = m.home_team_id === team.id;
        return isHome ? m.home_score > m.away_score : m.away_score > m.home_score;
      }).length;
      histBonus = (wins / teamMatches.length - 0.5) * 10;
    }

    // 赔率隐含胜率加权
    const teamOdds = odds.query(o => o.team_id === team.id);
    let oddsBonus = 0;
    if (teamOdds.length > 0) {
      const avgImpliedWin = teamOdds.reduce((s, o) => s + (o.implied_win_prob || 0), 0) / teamOdds.length;
      oddsBonus = (avgImpliedWin - 0.4) * 15;
    }

    return Math.round(Math.max(5, Math.min(95, rankScore + histBonus + oddsBonus)));
  }

  // 所有球队实力排名
  getTeamRankings() {
    const allTeams = teams.getAll();
    return allTeams
      .map(t => ({
        id: t.id, name: t.name, name_cn: t.name_cn,
        group_name: t.group_name, fifa_rank: t.fifa_rank,
        strength: this._calculateStrength(t),
        color: t.color_primary
      }))
      .sort((a, b) => b.strength - a.strength);
  }

  // 两队对阵概率计算
  _matchupProbs(strengthA, strengthB) {
    const diff = strengthA - strengthB; // 正=主队强
    // 基于实力差计算胜率 (ElO-style)
    const rawWin = 1 / (1 + Math.pow(10, -diff / 25));
    // 平局概率: 实力越接近平局概率越高
    const drawBase = 0.28 * Math.exp(-Math.pow(diff / 20, 2));
    const win = Math.round((rawWin - drawBase * 0.5) * 1000) / 1000;
    const draw = Math.round(drawBase * 1000) / 1000;
    const lose = Math.round((1 - win - draw) * 1000) / 1000;
    // 确保非负
    return {
      win: Math.max(0.01, win),
      draw: Math.max(0.01, draw),
      lose: Math.max(0.01, lose)
    };
  }

  // 单队胜率总览
  getTeamPrediction(teamId) {
    const team = teams.getById(teamId);
    if (!team) return null;

    const strength = this._calculateStrength(team);
    const ranking = this.getTeamRankings();
    const rank = ranking.findIndex(r => r.id === teamId) + 1;
    const totalTeams = ranking.length;

    // 与同组其他球队的对阵概率
    const groupOpponents = ranking.filter(r =>
      r.group_name === team.group_name && r.id !== teamId
    );
    const matchups = groupOpponents.map(o => {
      const probs = this._matchupProbs(strength, o.strength);
      return {
        opponent_id: o.id, opponent_name: o.name, opponent_cn: o.name_cn,
        opponent_strength: o.strength,
        win_prob: Math.round(probs.win * 100),
        draw_prob: Math.round(probs.draw * 100),
        lose_prob: Math.round(probs.lose * 100)
      };
    });

    // 小组晋级概率模拟 (简化: 基于小组内排名)
    const groupTeams = ranking.filter(r => r.group_name === team.group_name)
      .sort((a, b) => b.strength - a.strength);
    const groupRank = groupTeams.findIndex(r => r.id === teamId) + 1;
    const groupSize = groupTeams.length;
    // 前2晋级 (48队12组, 前2+8个最佳第三晋级32强)
    let advanceProb;
    if (groupRank <= 2) advanceProb = Math.round(90 - (groupRank - 1) * 25);
    else if (groupRank === 3) advanceProb = 40;
    else advanceProb = Math.max(5, 15 - (groupRank - 4) * 5);

    // 花边关联
    const gossipCount = news.query(n =>
      n.category === 'gossip' &&
      (n.title.includes(team.name_cn) || n.title.includes(team.name) ||
       (n.content || '').includes(team.name_cn) || (n.content || '').includes(team.name))
    ).length;

    return {
      team: { id: team.id, name: team.name, name_cn: team.name_cn, group_name: team.group_name },
      strength, rank, totalTeams,
      percentRank: Math.round((1 - rank / totalTeams) * 100),
      matchups,
      groupAdvanceProb: advanceProb,
      gossipCount,
      gossipLevel: Math.min(5, gossipCount)
    };
  }

  // 小组沙盘数据
  getGroupSandbox(groupName) {
    const ranking = this.getTeamRankings();
    const groupTeams = ranking.filter(r => r.group_name === groupName);

    const enriched = groupTeams.map(t => {
      const pred = this.getTeamPrediction(t.id);
      return {
        ...t,
        advanceProb: pred?.groupAdvanceProb || 0,
        gossipLevel: pred?.gossipLevel || 0
      };
    }).sort((a, b) => b.strength - a.strength);

    // 生成小组内所有对阵的胜/平/负概率
    const fixtures = [];
    for (let i = 0; i < enriched.length; i++) {
      for (let j = i + 1; j < enriched.length; j++) {
        const probs = this._matchupProbs(enriched[i].strength, enriched[j].strength);
        fixtures.push({
          home: { id: enriched[i].id, name: enriched[i].name, name_cn: enriched[i].name_cn },
          away: { id: enriched[j].id, name: enriched[j].name, name_cn: enriched[j].name_cn },
          win_prob: Math.round(probs.win * 100),
          draw_prob: Math.round(probs.draw * 100),
          lose_prob: Math.round(probs.lose * 100)
        });
      }
    }

    return {
      group_name: groupName,
      teams: enriched,
      fixtures,
      summary: {
        favToAdvance: enriched.slice(0, 2).map(t => t.name_cn),
        darkHorse: enriched.find(t => t.strength < 60 && t.advanceProb > 25)?.name_cn || null
      }
    };
  }

  // 全局沙盘概览
  getFullSandbox() {
    const ranking = this.getTeamRankings();
    const groups = [...new Set(ranking.map(r => r.group_name).filter(Boolean))].sort();

    const groupData = groups.map(g => this.getGroupSandbox(g));

    const top16 = ranking.slice(0, 16);
    const top8 = ranking.slice(0, 8);
    const top4 = ranking.slice(0, 4);

    // 趣味预测
    const champion = top4[0];
    const darkHorse = ranking.find(r => r.strength < 55 && ranking.indexOf(r) <= 30);

    return {
      groups: groupData,
      powerRanking: ranking.slice(0, 20).map((r, i) => ({
        rank: i + 1, ...r
      })),
      prediction: {
        champion: champion ? { name: champion.name, name_cn: champion.name_cn, strength: champion.strength } : null,
        darkHorse: darkHorse ? { name: darkHorse.name, name_cn: darkHorse.name_cn, strength: darkHorse.strength } : null,
        top4: top4.map(r => ({ name: r.name, name_cn: r.name_cn, strength: r.strength })),
        top8: top8.map(r => ({ name: r.name, name_cn: r.name_cn }))
      }
    };
  }

  // 球队实力雷达数据
  getTeamRadar(teamId) {
    const team = teams.getById(teamId);
    if (!team) return null;

    const ranking = this.getTeamRankings();
    const rank = ranking.findIndex(r => r.id === teamId) + 1;
    const strength = this._calculateStrength(team);

    // 进攻分: 基于历史进球
    const teamMatches = matches.query(m =>
      (m.home_team_id === teamId || m.away_team_id === teamId) && m.status === 'completed'
    );
    const avgGoals = teamMatches.length > 0
      ? teamMatches.reduce((s, m) => s + (m.home_team_id === teamId ? m.home_score : m.away_score), 0) / teamMatches.length
      : 1.2;
    const attack = Math.round(Math.min(95, avgGoals * 20 + strength * 0.15));

    // 防守分
    const avgConceded = teamMatches.length > 0
      ? teamMatches.reduce((s, m) => s + (m.home_team_id === teamId ? m.away_score : m.home_score), 0) / teamMatches.length
      : 1.2;
    const defense = Math.round(Math.min(95, (3 - Math.min(3, avgConceded)) * 25 + strength * 0.2));

    // 经验分: 基于FIFA排名和历史比赛数
    const experience = Math.round(Math.min(95, (100 - Math.min(100, team.fifa_rank || 50)) * 0.6 + teamMatches.length * 2));

    // 状态分: 基于近期比赛结果
    const recent = [...teamMatches].sort((a, b) => new Date(b.match_date) - new Date(a.match_date)).slice(0, 5);
    const recentWins = recent.filter(m =>
      (m.home_team_id === teamId && m.home_score > m.away_score) ||
      (m.away_team_id === teamId && m.away_score > m.home_score)
    ).length;
    const form = Math.round(40 + (recentWins / Math.max(1, recent.length)) * 55);

    return {
      team: { id: team.id, name: team.name, name_cn: team.name_cn },
      rank, strength,
      attack, defense, experience, form,
      // 雷达最大值均为100
      maxValue: 100
    };
  }
}

module.exports = new PredictionService();
