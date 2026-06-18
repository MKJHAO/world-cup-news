/**
 * 世界杯比赛实时模拟引擎
 *
 * 自动推进比赛时间线: scheduled → live → first_half → halftime → second_half → completed
 * 随机生成比赛事件(进球/黄牌/红牌/换人)，通过 WebSocket 实时推送
 */

const { teams, players, matches, matchEvents, matchStats, standings } = require('../models/database');
const predictionService = require('./predictionService');

// 模拟状态存储（内存中）
const activeSims = new Map();  // matchId → { speed, paused, halftimeTimer }

class MatchSimulator {
  // ==================== 公共 API ====================

  /**
   * 启动单场比赛模拟
   * @param {number} matchId - 比赛 ID
   * @param {number} speed - 速度倍率 (1=正常/6=加速/60=演示)
   * @param {object} io - Socket.IO Server 实例
   */
  startMatch(matchId, speed = 1, io) {
    const match = matches.getById(matchId);
    if (!match) return { success: false, message: '比赛不存在' };
    if (match.status === 'completed') return { success: false, message: '比赛已结束，无法模拟' };

    // 如果已在模拟中，先停止
    if (activeSims.has(matchId)) {
      this.stopMatch(matchId);
    }

    // 初始化模拟状态
    activeSims.set(matchId, { speed, paused: false, halftimeTimer: null });

    // 设置标志位
    matches.update(matchId, {
      match_minute: 0,
      injury_time: 0,
      simulated: true,
      sim_speed: speed
    });

    // 如果比赛还是 scheduled，立即推进到 live
    if (match.status === 'scheduled') {
      this._transitionStatus(matchId, 'live', 0, io);
    }

    console.log(`  🎮 模拟已启动: 比赛 #${matchId} (速度: ${speed}x)`);
    return { success: true, data: { matchId, speed, status: 'started' } };
  }

  /**
   * 停止单场比赛模拟
   */
  stopMatch(matchId) {
    const sim = activeSims.get(matchId);
    if (sim?.halftimeTimer) {
      clearTimeout(sim.halftimeTimer);
    }
    activeSims.delete(matchId);

    // 保留 simulated 标记和当前 minute，但不再推进
    console.log(`  ⏸ 模拟已停止: 比赛 #${matchId}`);
    return { success: true, data: { matchId, status: 'stopped' } };
  }

  /**
   * 启动全部今日未开始比赛
   */
  startAllToday(speed = 1, io) {
    const allMatches = matches.getAll();
    const today = new Date().toISOString().slice(0, 10);

    // 只筛选今天及之前日期的未完成比赛（不限赛事年份）
    const candidates = allMatches.filter(m => {
      if (m.status === 'completed') return false;
      if (activeSims.has(m.id)) return false;
      const mDate = (m.match_date || '').slice(0, 10);
      return mDate && mDate <= today;
    }).slice(0, 6); // 最多同时模拟6场

    const started = [];
    for (const m of candidates) {
      const result = this.startMatch(m.id, speed, io);
      if (result.success) started.push(m.id);
    }

    console.log(`  🎮 批量启动 ${started.length} 场比赛模拟`);
    return { success: true, data: { count: started.length, matches: started } };
  }

  /**
   * 自动推进到期比赛（基于真实时间）
   * 启动时调用一次，之后每分钟cron调用
   */
  autoAdvance(io) {
    const allMatches = matches.getAll();
    const now = new Date();

    for (const match of allMatches) {
      // 只处理 scheduled 状态的2026比赛
      if (match.status !== 'scheduled') continue;
      if (match.tournament !== '2026' && match.tournament !== 2026) continue;
      if (match.simulated) continue; // 跳过被手动模拟的

      const kickoff = new Date(match.match_date);
      if (isNaN(kickoff.getTime())) continue;
      if (kickoff > now) continue; // 还没到开球时间

      // 计算已过分钟数
      const elapsedMs = now - kickoff;
      const elapsedMin = Math.floor(elapsedMs / 60000);

      if (elapsedMin < 0) continue;

      // 比赛已过时间对应的状态
      let newStatus, newMinute;
      if (elapsedMin >= 105) {
        // 超过105分钟 → 比赛结束
        newStatus = 'completed';
        newMinute = 90;
      } else if (elapsedMin >= 60) {
        newStatus = 'second_half';
        newMinute = Math.min(elapsedMin, 90);
      } else if (elapsedMin >= 45) {
        newStatus = 'halftime';
        newMinute = 45;
      } else if (elapsedMin >= 1) {
        newStatus = 'first_half';
        newMinute = elapsedMin;
      } else {
        newStatus = 'live';
        newMinute = 0;
      }

      // 更新比赛状态
      matches.update(match.id, {
        status: newStatus,
        match_minute: newMinute,
        home_score: match.home_score || 0,
        away_score: match.away_score || 0
      });

      // 如果是进行中，生成到目前为止应有的比分
      if (['first_half', 'second_half'].includes(newStatus) && newMinute > 0) {
        this._generateRetroactiveEvents(match.id, newMinute, io);
      }

      // 如果已完成，生成最终比分和统计
      if (newStatus === 'completed') {
        this._generateRetroactiveEvents(match.id, 90, io);
        this._onMatchCompleted(match.id, io);
      }

      const updated = matches.getById(match.id);
      const enriched = this._enrichMatch(updated);
      io.emit('match_updated', enriched);
    }
  }

  /**
   * 回溯生成比赛事件（补上从0分钟到当前分钟应有的进球）
   */
  _generateRetroactiveEvents(matchId, upToMinute, io) {
    const match = matches.getById(matchId);
    if (!match) return;

    const homeTeam = teams.getById(match.home_team_id);
    const awayTeam = teams.getById(match.away_team_id);
    if (!homeTeam || !awayTeam) return;

    const homeStr = predictionService._calculateStrength(homeTeam);
    const awayStr = predictionService._calculateStrength(awayTeam);
    const totalStr = homeStr + awayStr;

    // 模拟从1分钟到当前分钟，每5分钟检查一次
    for (let min = 5; min <= upToMinute; min += 5) {
      if (min > 90) break;

      // 概率检查
      const rand = Math.random();
      let eventType = null;

      if (rand < 0.08) eventType = 'goal';
      else if (rand < 0.16) eventType = 'yellow_card';
      else if (rand < 0.165) eventType = 'red_card';

      if (!eventType) continue;

      // 进球归属
      let teamId;
      if (eventType === 'goal') {
        teamId = Math.random() < (homeStr / totalStr) ? match.home_team_id : match.away_team_id;
      } else {
        teamId = Math.random() < 0.5 ? match.home_team_id : match.away_team_id;
      }

      const teamPlayers = players.query(p => p.team_id === teamId);
      const playerName = teamPlayers.length > 0
        ? teamPlayers[Math.floor(Math.random() * teamPlayers.length)].name
        : '球员';

      // 写入事件（去重：同一分钟同一类型不重复）
      const existing = matchEvents.query(e => e.match_id === matchId && e.minute === min && e.event_type === eventType);
      if (existing.length > 0) continue;

      matchEvents.insert({
        match_id: matchId,
        team_id: teamId,
        player_name: playerName,
        event_type: eventType,
        minute: min,
        extra_info: eventType === 'goal' ? this._randomGoalType() : ''
      });

      if (eventType === 'goal') {
        if (teamId === match.home_team_id) {
          matches.update(matchId, { home_score: (match.home_score || 0) + 1 });
        } else {
          matches.update(matchId, { away_score: (match.away_score || 0) + 1 });
        }
      }
    }
  }

  /**
   * 停止全部模拟
   */
  stopAll() {
    let count = 0;
    for (const [id] of activeSims) {
      this.stopMatch(id);
      count++;
    }
    return { success: true, data: { count } };
  }

  /**
   * 全局 tick 驱动 (由 setInterval 调用)
   */
  tickAll(io) {
    if (!io || activeSims.size === 0) return;

    for (const [matchId, sim] of activeSims) {
      if (sim.paused) continue;
      try {
        this._tick(matchId, sim.speed, io);
      } catch (e) {
        console.error(`  ⚠️ 模拟 tick 失败 (比赛 #${matchId}):`, e.message);
      }
    }
  }

  /**
   * 获取当前模拟状态
   */
  getStatus() {
    const sims = [];
    for (const [id, sim] of activeSims) {
      const m = matches.getById(id);
      sims.push({
        matchId: id,
        status: m?.status || 'unknown',
        minute: m?.match_minute || 0,
        home_score: m?.home_score || 0,
        away_score: m?.away_score || 0,
        speed: sim.speed,
        paused: sim.paused
      });
    }
    return { success: true, data: { activeSimulations: sims, count: sims.length } };
  }

  // ==================== 内部方法 ====================

  /**
   * 单场比赛单次 tick
   */
  _tick(matchId, speed, io) {
    const match = matches.getById(matchId);
    if (!match || match.status === 'completed') {
      this.stopMatch(matchId);
      return;
    }

    // 比赛时间推进: 每次 tick 推进 0.5 × speed 分钟
    const increment = 0.5 * speed;
    let newMinute = (match.match_minute || 0) + increment;

    // ===== 状态转换逻辑 =====

    // scheduled → live (开球)
    if (match.status === 'scheduled') {
      this._transitionStatus(matchId, 'live', 0, io);
      newMinute = 0;
    }

    // live → first_half (第1分钟开始)
    if (match.status === 'live' && newMinute >= 1) {
      this._transitionStatus(matchId, 'first_half', newMinute, io);
    }

    // first_half → halftime (45分钟)
    if (match.status === 'first_half' && newMinute >= 45) {
      this._transitionStatus(matchId, 'halftime', 45, io);
      // 中场休息自动推进 (5分钟实际时间 / speed)
      const halftimeDelay = Math.max(10000, Math.round(300000 / speed));
      const sim = activeSims.get(matchId);
      if (sim?.halftimeTimer) clearTimeout(sim.halftimeTimer);
      const timer = setTimeout(() => {
        this._transitionStatus(matchId, 'second_half', 45, io);
        matches.update(matchId, { match_minute: 45 });
      }, halftimeDelay);
      if (sim) sim.halftimeTimer = timer;
      activeSims.set(matchId, sim || { speed, paused: false, halftimeTimer: timer });
      this._updateMinute(matchId, 45, io);
      return; // 中场休息期间不生成事件
    }

    // second_half → completed (90分钟)
    if (match.status === 'second_half' && newMinute >= 90) {
      this._transitionStatus(matchId, 'completed', 90, io);
      this._onMatchCompleted(matchId, io);
      return;
    }

    // 更新比赛分钟数
    this._updateMinute(matchId, Math.round(newMinute * 10) / 10, io);

    // ===== 事件生成 (每5分钟检查一次) =====
    const prevCheckpoint = Math.floor((match.match_minute || 0) / 5);
    const newCheckpoint = Math.floor(newMinute / 5);
    if (newCheckpoint > prevCheckpoint && match.status !== 'halftime') {
      this._maybeGenerateEvent(matchId, Math.floor(newMinute), io);
    }

    // ===== 关键事件触发AI解说 =====
    // (进球等关键事件在 _maybeGenerateEvent 中触发)
  }

  /**
   * 状态转换
   */
  _transitionStatus(matchId, newStatus, minute, io) {
    matches.update(matchId, {
      status: newStatus,
      match_minute: minute
    });

    const match = matches.getById(matchId);
    const enriched = this._enrichMatch(match);

    // WebSocket 推送
    io.emit('match_updated', enriched);

    // 状态变化日志
    const statusLabels = {
      live: '🔴 开球', first_half: '🟢 上半场', halftime: '🟡 中场休息',
      second_half: '🔵 下半场', completed: '⏹ 比赛结束'
    };
    console.log(`  ${statusLabels[newStatus] || newStatus}: 比赛 #${matchId} (${minute}')`);
  }

  /**
   * 更新比赛分钟数（不改变状态）
   */
  _updateMinute(matchId, minute, io) {
    matches.update(matchId, { match_minute: minute });

    // 每2分钟推送一次更新（减少推送频率）
    const lastPush = this._lastPushTime?.get(matchId) || 0;
    const now = Date.now();
    if (now - lastPush > 15000 || Math.abs((this._lastMinute?.get(matchId) || 0) - minute) >= 5) {
      const match = matches.getById(matchId);
      const enriched = this._enrichMatch(match);
      io.emit('match_updated', enriched);
      if (!this._lastPushTime) this._lastPushTime = new Map();
      if (!this._lastMinute) this._lastMinute = new Map();
      this._lastPushTime.set(matchId, now);
      this._lastMinute.set(matchId, minute);
    }
  }

  /**
   * 随机生成比赛事件
   */
  _maybeGenerateEvent(matchId, minute, io) {
    const match = matches.getById(matchId);
    if (!match || match.status === 'completed' || match.status === 'halftime') return;

    const homeTeam = teams.getById(match.home_team_id);
    const awayTeam = teams.getById(match.away_team_id);
    if (!homeTeam || !awayTeam) return;

    // 实力评分
    const homeStr = predictionService._calculateStrength(homeTeam);
    const awayStr = predictionService._calculateStrength(awayTeam);
    const totalStr = homeStr + awayStr;

    // 比分差距
    const goalDiff = Math.abs((match.home_score || 0) - (match.away_score || 0));

    // ===== 概率计算 =====
    let goalProb = 0.07;
    let yellowProb = 0.09;
    let redProb = 0.005;
    let subProb = 0.10;

    // 调整因子
    const isLateGame = minute >= 75;
    if (isLateGame) {
      goalProb *= 1.2;
      yellowProb *= 1.3;
    }
    if (goalDiff >= 5) goalProb *= 0.5;
    if (goalDiff === 0 && minute >= 85) goalProb *= 1.4;

    // substitution 仅在 60-80 分钟区间
    if (minute < 60 || minute > 80) subProb = 0;

    // 轮盘赌选择事件类型
    const rand = Math.random();
    let eventType = null;

    if (subProb > 0 && rand < subProb) {
      eventType = 'substitution';
    } else if (rand < subProb + goalProb) {
      eventType = 'goal';
    } else if (rand < subProb + goalProb + yellowProb) {
      eventType = 'yellow_card';
    } else if (rand < subProb + goalProb + yellowProb + redProb) {
      eventType = 'red_card';
    }

    if (!eventType) return;

    // ===== 选择球队 =====
    let teamId, teamType;
    if (eventType === 'goal') {
      // 进球归属: 实力加权
      const goalRand = Math.random();
      teamId = goalRand < (homeStr / totalStr) ? match.home_team_id : match.away_team_id;
      teamType = teamId === match.home_team_id ? 'home' : 'away';
    } else {
      // 其他事件: 随机选择
      teamId = Math.random() < 0.5 ? match.home_team_id : match.away_team_id;
      teamType = teamId === match.home_team_id ? 'home' : 'away';
    }

    // ===== 选择球员 =====
    const teamPlayers = players.query(p => p.team_id === teamId);
    let playerName = '未知球员';
    if (teamPlayers.length > 0) {
      if (eventType === 'goal') {
        // 进球优先选前锋/中场
        const forwards = teamPlayers.filter(p =>
          ['forward', 'midfielder', 'striker', 'winger', 'Forward', 'Midfielder'].includes(p.position)
        );
        const pool = forwards.length > 0 ? forwards : teamPlayers;
        playerName = pool[Math.floor(Math.random() * pool.length)].name;
      } else {
        playerName = teamPlayers[Math.floor(Math.random() * teamPlayers.length)].name;
      }
    }

    // ===== 生成事件数据 =====
    const event = matchEvents.insert({
      match_id: matchId,
      team_id: teamId,
      player_name: playerName,
      event_type: eventType,
      minute: minute,
      extra_info: eventType === 'goal' ? this._randomGoalType() : ''
    });

    // 进球 → 更新比分
    if (eventType === 'goal') {
      if (teamId === match.home_team_id) {
        matches.update(matchId, { home_score: (match.home_score || 0) + 1 });
      } else {
        matches.update(matchId, { away_score: (match.away_score || 0) + 1 });
      }
    }

    // ===== WebSocket 推送 =====
    const updatedMatch = matches.getById(matchId);
    const enrichedMatch = this._enrichMatch(updatedMatch);

    // 推送比赛更新
    io.emit('match_updated', enrichedMatch);

    // 推送新事件
    io.emit('match_event_added', {
      ...event,
      team_type: teamType,
      home_score: updatedMatch.home_score,
      away_score: updatedMatch.away_score
    });

    // ===== 进球触发AI解说 =====
    if (eventType === 'goal') {
      try {
        const aiService = require('./aiService');
        aiService.generateCommentaryChunk(updatedMatch).then(commentary => {
          if (commentary) {
            io.emit(`match_${matchId}_commentary`, {
              text: commentary,
              match_id: matchId,
              timestamp: new Date().toISOString()
            });
          }
        }).catch(() => {});
      } catch (e) {
        // AI解说失败不影响模拟
      }
    }
  }

  /**
   * 比赛完成后的连锁操作
   */
  _onMatchCompleted(matchId, io) {
    const match = matches.getById(matchId);
    if (!match) return;

    console.log(`  🏁 比赛完成: #${matchId} (${match.home_score} - ${match.away_score})`);

    // 1. 生成比赛统计
    try {
      const statsService = require('./statsService');
      const stats = statsService.generateForMatch(match);
      if (stats) {
        matchStats.insert(stats.home);
        matchStats.insert(stats.away);
        console.log('    📊 统计数据已生成');
      }
    } catch (e) {
      console.error('    ⚠️ 统计生成失败:', e.message);
    }

    // 2. 更新积分榜 (小组赛)
    if (match.stage === 'group' && match.group_name) {
      try {
        this._recalculateGroupStandings(match.group_name);
        console.log(`    📋 小组 ${match.group_name} 积分榜已更新`);
        io.emit(`group_${match.group_name}_update`, { group_name: match.group_name });
      } catch (e) {
        console.error(`    ⚠️ 积分榜更新失败:`, e.message);
      }
    }

    // 3. 结算预测
    try {
      const predictionGameService = require('./predictionGameService');
      const scored = predictionGameService.scoreMatchPredictions(matchId);
      if (scored > 0) {
        console.log(`    🎯 已结算 ${scored} 条预测`);
        io.emit('prediction_scored', { match_id: matchId, count: scored });
      }
    } catch (e) {
      console.error(`    ⚠️ 预测结算失败:`, e.message);
    }

    // 4. 推送最终比赛更新
    const enriched = this._enrichMatch(match);
    io.emit('match_updated', enriched);

    // 5. 清理模拟状态
    this.stopMatch(matchId);
  }

  /**
   * 重新计算小组积分榜
   */
  _recalculateGroupStandings(groupName) {
    const groupMatches = matches.query(m =>
      m.group_name === groupName && m.stage === 'group' && m.status === 'completed'
    );

    const groupStandings = standings.query(s => s.group_name === groupName);
    const teamStats = {};

    groupStandings.forEach(s => {
      teamStats[s.team_id] = { played: 0, won: 0, drawn: 0, lost: 0, goals_for: 0, goals_against: 0, goal_diff: 0, points: 0 };
    });

    groupMatches.forEach(m => {
      if (!teamStats[m.home_team_id]) {
        teamStats[m.home_team_id] = { played: 0, won: 0, drawn: 0, lost: 0, goals_for: 0, goals_against: 0, goal_diff: 0, points: 0 };
      }
      if (!teamStats[m.away_team_id]) {
        teamStats[m.away_team_id] = { played: 0, won: 0, drawn: 0, lost: 0, goals_for: 0, goals_against: 0, goal_diff: 0, points: 0 };
      }

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

  /**
   * 丰富比赛数据（注入球队信息）
   */
  _enrichMatch(match) {
    const ht = teams.getById(match.home_team_id);
    const at = teams.getById(match.away_team_id);
    return {
      ...match,
      home_team_name: ht?.name || '',
      home_team_cn: ht?.name_cn || '',
      home_flag: ht?.flag_emoji || '',
      home_color: ht?.color_primary || '',
      away_team_name: at?.name || '',
      away_team_cn: at?.name_cn || '',
      away_flag: at?.flag_emoji || '',
      away_color: at?.color_primary || ''
    };
  }

  /**
   * 随机进球方式
   */
  _randomGoalType() {
    const types = ['', '', '', '', '头球', '远射', '点球', '任意球', '补射', '单刀'];
    return types[Math.floor(Math.random() * types.length)];
  }
}

module.exports = new MatchSimulator();
