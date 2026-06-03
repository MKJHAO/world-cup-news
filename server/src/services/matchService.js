const { matches, teams, matchEvents } = require('../models/database');

class MatchService {
  getAll({ group, stage, status, search, tournament, limit = 50, offset = 0 } = {}) {
    let result = matches.getAll();

    if (tournament) result = result.filter(m => {
      const t = m.tournament || (m.match_date && m.match_date.startsWith('202') ? m.match_date.slice(0, 4) : 'unknown');
      return t === tournament;
    });
    if (group) result = result.filter(m => m.group_name === group);
    if (stage) result = result.filter(m => m.stage === stage);
    if (status) result = result.filter(m => m.status === status);
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(m => {
        const ht = teams.getById(m.home_team_id);
        const at = teams.getById(m.away_team_id);
        return (ht?.name && ht.name.toLowerCase().includes(q)) ||
               (ht?.name_cn && ht.name_cn.includes(q)) ||
               (at?.name && at.name.toLowerCase().includes(q)) ||
               (at?.name_cn && at.name_cn.includes(q)) ||
               (m.stadium && m.stadium.toLowerCase().includes(q)) ||
               (m.group_name && m.group_name.toLowerCase().includes(q));
      });
    }

    result.sort((a, b) => new Date(b.match_date) - new Date(a.match_date));

    const enriched = result.slice(offset, offset + limit).map(m => this._enrich(m));
    return enriched;
  }

  _enrich(m) {
    const ht = teams.getById(m.home_team_id);
    const at = teams.getById(m.away_team_id);
    return {
      ...m,
      home_team_name: ht?.name || '', home_team_cn: ht?.name_cn || '', home_flag: ht?.flag_emoji || '', home_color: ht?.color_primary || '',
      away_team_name: at?.name || '', away_team_cn: at?.name_cn || '', away_flag: at?.flag_emoji || '', away_color: at?.color_primary || ''
    };
  }

  getById(id) {
    const match = matches.getById(id);
    if (!match) return null;
    const result = this._enrich(match);
    result.events = matchEvents.query(e => e.match_id === id).sort((a, b) => a.minute - b.minute);
    result.events = result.events.map(e => {
      const t = teams.getById(e.team_id);
      return { ...e, team_name: t?.name || '', team_cn: t?.name_cn || '' };
    });
    return result;
  }

  getTodayMatches() {
    const today = new Date().toISOString().split('T')[0];
    return matches.query(m => m.match_date.startsWith(today))
      .sort((a, b) => new Date(a.match_date) - new Date(b.match_date))
      .map(m => this._enrich(m));
  }

  getByDate(date) {
    return matches.query(m => m.match_date.startsWith(date))
      .sort((a, b) => new Date(a.match_date) - new Date(b.match_date))
      .map(m => this._enrich(m));
  }

  getMatchDates() {
    const dates = [...new Set(matches.getAll().map(m => m.match_date.split(' ')[0]))];
    return dates.sort().map(d => ({ date: d }));
  }

  getKnockoutBracket() {
    return matches.query(m => ['round16', 'quarter', 'semi', 'third', 'final'].includes(m.stage))
      .sort((a, b) => new Date(a.match_date) - new Date(b.match_date))
      .map(m => this._enrich(m));
  }
}

module.exports = new MatchService();
