/**
 * 实时比赛数据服务
 * 数据源: ESPN 公开 API — fifa.world scoreboard + summary (事件+统计)
 * 完全免费，无需API Key
 */

const https = require('https');

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY || '';

function espnFetch(path) {
  return new Promise((resolve, reject) => {
    https.get({ hostname: 'site.api.espn.com', path, timeout: 10000 }, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        try { resolve(JSON.parse(d)); } catch (e) { reject(e); }
      });
    }).on('error', reject).on('timeout', function() { this.destroy(); reject(new Error('timeout')); });
  });
}

class LiveDataService {
  async syncToDatabase(io) {
    const result = await this._syncFromESPN(io);
    if (result.updatedCount > 0) {
      console.log(`  ⚡ ESPN: ${result.updatedCount}场更新 (${result.liveCount}场live)`);
      return { ...result, source: 'espn' };
    }
    // 回退：时间推进状态
    const r2 = this._autoAdvanceStatus(io);
    if (r2.updatedCount > 0) console.log(`  ⏱ 时间推进: ${r2.updatedCount}场`);
    return { ...r2, source: 'clock' };
  }

  async _syncFromESPN(io) {
    const { matches } = require('../models/database');
    let updatedCount = 0, liveCount = 0;
    const now = new Date();

    // 覆盖整个世界杯期间：6月11日 → 今天+2天
    const dates = [];
    const start = new Date('2026-06-11');
    const end = new Date(now);
    end.setDate(end.getDate() + 2);
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      dates.push(d.toISOString().slice(0, 10).replace(/-/g, ''));
    }

    for (const dateStr of dates) {
      try {
        const data = await espnFetch(`/apis/site/v2/sports/soccer/fifa.world/scoreboard?dates=${dateStr}`);
        const events = data.events || [];
        for (const evt of events) {
          const comp = evt.competitions?.[0];
          if (!comp) continue;
          const status = this._mapESPNStatus(comp.status?.type?.name);
          const h = comp.competitors?.[0], a = comp.competitors?.[1];
          if (!h || !a) continue;

          const localMatch = this._findLocalMatchESPN(matches, evt.date, h.team?.displayName || '', a.team?.displayName || '');
          if (!localMatch) continue;

          const prev = localMatch.status;
          matches.update(localMatch.id, {
            status, home_score: parseInt(h.score) || 0, away_score: parseInt(a.score) || 0,
            match_minute: ['first_half','halftime','second_half'].includes(status) ? (comp.status?.displayClock || 0) : (status === 'completed' ? 90 : 0),
          });
          updatedCount++;
          if (['first_half','halftime','second_half'].includes(status)) liveCount++;
          if (io) this._emitMatchUpdate(io, localMatch.id);

          // 完赛 → 拉取ESPN事件+统计（如果没有事件数据）
          if (status === 'completed') {
            const { matchEvents } = require('../models/database');
            const hasEvents = matchEvents.query(e => e.match_id === localMatch.id).length > 0;
            if (!hasEvents) {
              try { await this._syncDetail(evt.id, localMatch.id, io); } catch (e) {}
            }
          }
        }
      } catch (e) { /* ignore */ }
    }
    return { updatedCount, liveCount };
  }

  /** 拉取ESPN详情：比赛事件 + 统计数据 */
  async _syncDetail(espnId, localId, io) {
    const data = await espnFetch(`/apis/site/v2/sports/soccer/fifa.world/summary?event=${espnId}`);
    // 事件
    await this._syncESPNEvents(data, localId);
    // 统计
    await this._syncESPNStats(data, localId);
    if (io) this._emitMatchUpdate(io, localId);
  }

  /** 同步进球/红黄牌事件 */
  async _syncESPNEvents(data, localId) {
    const { matchEvents, matches, teams: teamsDb } = require('../models/database');
    const match = matches.getById(localId);
    if (!match) return;
    const comps = data.header?.competitions || [];
    const details = comps[0]?.details || [];
    if (!details.length) return;

    const ht = teamsDb.getById(match.home_team_id);
    const at = teamsDb.getById(match.away_team_id);
    const existing = matchEvents.query(e => e.match_id === localId);

    for (const d of details) {
      let eventType = '';
      if (d.scoringPlay) eventType = d.penaltyShot ? 'penalty_goal' : 'goal';
      else if (d.redCard) eventType = 'red_card';
      else if (d.yellowCard) eventType = 'yellow_card';
      else continue;

      const minute = Math.round((d.clock?.value || 0) / 60);
      const player = d.participants?.[0]?.athlete?.displayName || 'Unknown';
      const teamName = (d.team?.displayName || '').toLowerCase();
      const isHome = (ht?.name || '').toLowerCase() === teamName || (ht?.name_cn || '') === teamName;
      const teamId = isHome ? match.home_team_id : match.away_team_id;

      if (existing.find(e => e.minute === minute && e.event_type === eventType && e.player_name === player)) continue;

      const extra = [];
      if (d.participants?.[1]?.athlete?.displayName) extra.push('助攻:' + d.participants[1].athlete.displayName);
      if (d.penaltyShot) extra.push('点球');

      matchEvents.insert({ match_id: localId, team_id: teamId, player_name: player, event_type: eventType, minute, extra_info: extra.join(' ') });
    }
  }

  /** 同步ESPN Boxscore统计数据 */
  async _syncESPNStats(data, localId) {
    const bs = data.boxscore;
    if (!bs?.teams?.length) return;
    const { matchStats, matches, teams: teamsDb } = require('../models/database');
    const match = matches.getById(localId);
    if (!match) return;

    const ht = teamsDb.getById(match.home_team_id);
    const STAT_MAP = { 'possessionPct':'possession','totalShots':'shots_total','shotsOnTarget':'shots_on_target','wonCorners':'corners','foulsCommitted':'fouls','offsides':'offsides','totalPasses':'passes','passPct':'pass_accuracy','yellowCards':'yellow_cards','redCards':'red_cards','saves':'saves' };

    // 清除旧统计
    matchStats.query(s => s.match_id === localId).forEach(s => matchStats.delete(s.id));

    for (const t of bs.teams) {
      const name = (t.team?.displayName || '').toLowerCase();
      const isHome = (ht?.name || '').toLowerCase() === name || (ht?.name_cn || '') === name;
      const stat = { match_id: localId, team_id: isHome ? match.home_team_id : match.away_team_id };
      (t.statistics || []).forEach(s => {
        const f = STAT_MAP[s.name];
        if (f) stat[f] = typeof s.displayValue === 'number' ? s.displayValue : (parseFloat(s.displayValue) || Math.round((s.value || 0) * 100) / 100);
      });
      stat.possession = stat.possession || 50;
      stat.shots_total = stat.shots_total || 0;
      stat.shots_on_target = stat.shots_on_target || 0;
      stat.corners = stat.corners || 0;
      stat.fouls = stat.fouls || 0;
      stat.passes = stat.passes || 0;
      stat.pass_accuracy = stat.pass_accuracy || 0;
      stat.yellow_cards = stat.yellow_cards || 0;
      stat.red_cards = stat.red_cards || 0;
      matchStats.insert(stat);
    }
  }

  // ===== 时间推进 (兜底) =====
  _autoAdvanceStatus(io) {
    const { matches, teams } = require('../models/database');
    const all = matches.getAll();
    const now = new Date();
    let n = 0;
    for (const m of all) {
      if (m.status !== 'scheduled') continue;
      const ko = new Date(m.match_date);
      if (isNaN(ko.getTime()) || ko > now) continue;
      const el = Math.floor((now - ko) / 60000);
      if (el < 0) continue;
      let s, mn;
      if (el >= 120) { s = 'completed'; mn = 90; }
      else if (el >= 60) { s = 'second_half'; mn = Math.min(el, 90); }
      else if (el >= 45) { s = 'halftime'; mn = 45; }
      else if (el >= 1) { s = 'first_half'; mn = el; }
      else { s = 'live'; mn = 0; }
      matches.update(m.id, { status: s, match_minute: mn });
      n++;
      if (io) this._emitMatchUpdate(io, m.id);
    }
    return { updatedCount: n, liveCount: 0 };
  }

  // ===== 匹配工具 =====
  _findLocalMatchESPN(matches, espnDate, homeName, awayName) {
    const all = matches.getAll();
    const espnDt = new Date(espnDate);
    if (isNaN(espnDt.getTime())) return null;
    const espnDay = espnDt.toISOString().substring(0, 10);
    const ALIASES = { 'czechia':'czech','czechrepublic':'czech','bosniaherzegovina':'bosnia','bosnia':'bosnia','unitedstates':'usa','usa':'usa','southkorea':'korea','korearepublic':'korea','korea':'korea','iran':'iran' };
    const norm = s => { const x = (s||'').toLowerCase().replace(/[^a-z]/g,''); return ALIASES[x] || x; };
    const { teams } = require('../models/database');
    const allTeams = teams.getAll();
    return all.find(m => {
      const md = (m.match_date || '').substring(0, 10);
      if (md !== espnDay) { const mDt = new Date(md + 'T00:00:00Z'); if (isNaN(mDt.getTime())) return false; if (Math.abs(mDt - espnDt) / 86400000 > 2) return false; }
      const ht = allTeams.find(t => t.id === m.home_team_id);
      const at = allTeams.find(t => t.id === m.away_team_id);
      const h = norm(homeName), a = norm(awayName);
      const mh = norm((ht?.name_cn||'') + (ht?.name||''));
      const ma = norm((at?.name_cn||'') + (at?.name||''));
      return (mh.includes(h) || h.includes(mh)) && (ma.includes(a) || a.includes(ma));
    });
  }

  _emitMatchUpdate(io, matchId) {
    const { matches, teams } = require('../models/database');
    const m = matches.getById(matchId);
    if (!m) return;
    const ht = teams.getById(m.home_team_id), at = teams.getById(m.away_team_id);
    io.emit('match_updated', { ...m, home_team_cn: ht?.name_cn || '', away_team_cn: at?.name_cn || '', home_team_name: ht?.name || '', away_team_name: at?.name || '', home_flag: ht?.flag_emoji || '', away_flag: at?.flag_emoji || '' });
  }

  _mapESPNStatus(n) {
    const m = { 'STATUS_SCHEDULED':'scheduled','STATUS_IN_PROGRESS':'first_half','STATUS_HALFTIME':'halftime','STATUS_FULL_TIME':'completed','STATUS_FINAL':'completed','STATUS_POSTPONED':'scheduled' };
    return m[n] || 'scheduled';
  }
}

module.exports = new LiveDataService();
