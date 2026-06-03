const { matchStats, matches } = require('../models/database');

class StatsService {
  getByMatch(matchId) {
    return matchStats.query(s => s.match_id === matchId);
  }

  generateForMatch(match) {
    const homeGoals = match.home_score || 0;
    const awayGoals = match.away_score || 0;
    const totalGoals = homeGoals + awayGoals;

    const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
    const randFloat = (min, max) => Math.round((Math.random() * (max - min) + min) * 10) / 10;

    // 控球率 (胜方偏高)
    let homePossession, awayPossession;
    if (homeGoals > awayGoals) {
      homePossession = rand(48, 62);
    } else if (awayGoals > homeGoals) {
      homePossession = rand(38, 52);
    } else {
      homePossession = rand(45, 55);
    }
    awayPossession = 100 - homePossession;

    // 射门总数 (与进球正相关)
    const homeShots = rand(homeGoals * 2 + 3, homeGoals * 4 + 8);
    const awayShots = rand(awayGoals * 2 + 3, awayGoals * 4 + 8);

    // 射正
    const homeShotsOn = rand(Math.floor(homeShots * 0.3), Math.floor(homeShots * 0.5));
    const awayShotsOn = rand(Math.floor(awayShots * 0.3), Math.floor(awayShots * 0.5));

    // xG
    const homeXG = randFloat(homeGoals * 0.8, homeGoals * 2.0 + 0.5);
    const awayXG = randFloat(awayGoals * 0.8, awayGoals * 2.0 + 0.5);

    return {
      home: {
        match_id: match.id, team_id: match.home_team_id,
        possession: homePossession, shots_total: homeShots,
        shots_on_target: homeShotsOn, corners: rand(2, 9),
        fouls: rand(8, 18), yellow_cards: rand(0, 4), red_cards: rand(0, 1),
        offsides: rand(1, 5), passes: rand(350, 620),
        pass_accuracy: rand(75, 89), xg: homeXG
      },
      away: {
        match_id: match.id, team_id: match.away_team_id,
        possession: awayPossession, shots_total: awayShots,
        shots_on_target: awayShotsOn, corners: rand(2, 9),
        fouls: rand(8, 18), yellow_cards: rand(0, 4), red_cards: rand(0, 1),
        offsides: rand(1, 5), passes: rand(350, 620),
        pass_accuracy: rand(75, 89), xg: awayXG
      }
    };
  }

  seedStatsForCompletedMatches() {
    const completedMatches = matches.query(m => m.status === 'completed');
    const existingStatMatchIds = new Set(matchStats.getAll().map(s => s.match_id));

    let added = 0;
    completedMatches.forEach(match => {
      if (existingStatMatchIds.has(match.id)) return;
      const stats = this.generateForMatch(match);
      matchStats.insert(stats.home);
      matchStats.insert(stats.away);
      added++;
    });

    if (added > 0) {
      console.log(`📊 生成了 ${added} 场比赛的统计数据`);
    }
    return added;
  }
}

module.exports = new StatsService();
