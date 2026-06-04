const crypto = require('crypto');
const { userPredictions, predictionGroups, groupMemberships, bracketPredictions, users, matches } = require('../models/database');

class PredictionGameService {
  // ==================== 预测提交 ====================

  submitPrediction(userId, matchId, predictedResult, predictedHomeScore, predictedAwayScore) {
    // 验证比赛存在
    const match = matches.getById(matchId);
    if (!match) throw new Error('比赛不存在');

    // 检查截止时间（比赛开始前15分钟）
    if (!this._checkDeadline(match)) {
      throw new Error('预测已截止（比赛开始前15分钟锁定）');
    }

    // 验证预测结果
    if (!['home', 'draw', 'away'].includes(predictedResult)) {
      throw new Error('预测结果无效');
    }
    if (typeof predictedHomeScore !== 'number' || typeof predictedAwayScore !== 'number') {
      throw new Error('比分必须是数字');
    }
    if (predictedHomeScore < 0 || predictedAwayScore < 0) {
      throw new Error('比分不能为负数');
    }

    // 检查是否已有预测（更新还是新建）
    const existing = userPredictions.findOne(p => p.user_id === userId && p.match_id === matchId);
    if (existing) {
      return userPredictions.update(existing.id, {
        predicted_result: predictedResult,
        predicted_home_score: predictedHomeScore,
        predicted_away_score: predictedAwayScore,
        submitted_at: new Date().toISOString()
      });
    }

    return userPredictions.insert({
      user_id: userId,
      match_id: matchId,
      predicted_result: predictedResult,
      predicted_home_score: predictedHomeScore,
      predicted_away_score: predictedAwayScore,
      points_earned: 0,
      result_status: 'pending',
      submitted_at: new Date().toISOString()
    });
  }

  // 获取用户的所有预测
  getUserPredictions(userId, filters = {}) {
    let preds = userPredictions.query(p => p.user_id === userId);
    if (filters.status) {
      preds = preds.filter(p => p.result_status === filters.status);
    }
    if (filters.matchId) {
      preds = preds.filter(p => p.match_id === filters.matchId);
    }
    // 按提交时间倒序
    preds.sort((a, b) => new Date(b.submitted_at) - new Date(a.submitted_at));
    // 附加比赛信息
    return preds.map(p => {
      const match = matches.getById(p.match_id);
      return { ...p, match: match ? { id: match.id, home_team_id: match.home_team_id, away_team_id: match.away_team_id, match_date: match.match_date, status: match.status, home_score: match.home_score, away_score: match.away_score, group_name: match.group_name, stage: match.stage } : null };
    });
  }

  // 获取用户待结算的预测
  getPendingPredictions(userId) {
    return this.getUserPredictions(userId, { status: 'pending' });
  }

  // 获取某场比赛的所有预测（比赛开始后公开）
  getPredictionsByMatch(matchId) {
    const match = matches.getById(matchId);
    if (!match) return [];
    // 比赛开始前不公开他人预测
    if (new Date(match.match_date) > new Date()) return [];
    const preds = userPredictions.query(p => p.match_id === matchId);
    return preds.map(p => {
      const user = users.getById(p.user_id);
      return { ...p, user: user ? { id: user.id, nickname: user.nickname } : null };
    });
  }

  // ==================== 评分系统 ====================

  _calculatePoints(predictedResult, predictedScore, actualResult, actualScore) {
    const [pH, pA] = predictedScore;
    const [aH, aA] = actualScore;

    // 精确比分
    if (pH === aH && pA === aA) {
      return { points: 25, status: 'correct_score' };
    }

    // 正确结果 + 正确净胜球
    const predictedDiff = pH - pA;
    const actualDiff = aH - aA;
    const predictedOutcome = predictedDiff > 0 ? 'home' : predictedDiff < 0 ? 'away' : 'draw';
    const actualOutcome = actualDiff > 0 ? 'home' : actualDiff < 0 ? 'away' : 'draw';

    if (predictedOutcome === actualOutcome && predictedDiff === actualDiff) {
      return { points: 20, status: 'correct_diff' };
    }

    // 仅正确结果
    if (predictedResult === actualResult) {
      return { points: 10, status: 'correct_result' };
    }

    return { points: 0, status: 'wrong' };
  }

  _getActualResult(homeScore, awayScore) {
    if (homeScore > awayScore) return 'home';
    if (homeScore < awayScore) return 'away';
    return 'draw';
  }

  // 对某场比赛的所有预测进行评分
  scoreMatchPredictions(matchId) {
    const match = matches.getById(matchId);
    if (!match || match.status !== 'completed') return;

    const actualResult = this._getActualResult(match.home_score, match.away_score);
    const actualScore = [match.home_score, match.away_score];

    const preds = userPredictions.query(p => p.match_id === matchId && p.result_status === 'pending');
    let scored = 0;

    preds.forEach(pred => {
      const { points, status } = this._calculatePoints(
        pred.predicted_result,
        [pred.predicted_home_score, pred.predicted_away_score],
        actualResult,
        actualScore
      );

      userPredictions.update(pred.id, {
        points_earned: points,
        result_status: status
      });

      // 更新用户统计
      const user = users.getById(pred.user_id);
      if (user) {
        const isCorrect = status !== 'wrong';
        users.update(pred.user_id, {
          total_points: (user.total_points || 0) + points,
          weekly_points: (user.weekly_points || 0) + points,
          predictions_count: (user.predictions_count || 0) + 1,
          correct_count: (user.correct_count || 0) + (isCorrect ? 1 : 0),
          accuracy: (user.predictions_count || 0) + 1 > 0
            ? Math.round((((user.correct_count || 0) + (isCorrect ? 1 : 0)) / ((user.predictions_count || 0) + 1)) * 100)
            : 0
        });
      }

      scored++;
    });

    return scored;
  }

  // ==================== 排行榜 ====================

  getLeaderboard({ type = 'all_time', limit = 50 } = {}) {
    const allUsers = users.getAll();
    const sorted = allUsers
      .filter(u => type === 'all_time' ? u.total_points > 0 : u.weekly_points > 0)
      .sort((a, b) => {
        const aPts = type === 'all_time' ? (a.total_points || 0) : (a.weekly_points || 0);
        const bPts = type === 'all_time' ? (b.total_points || 0) : (b.weekly_points || 0);
        if (bPts !== aPts) return bPts - aPts;
        return (b.accuracy || 0) - (a.accuracy || 0);
      })
      .slice(0, limit)
      .map((u, i) => ({
        rank: i + 1,
        id: u.id,
        nickname: u.nickname,
        points: type === 'all_time' ? (u.total_points || 0) : (u.weekly_points || 0),
        accuracy: u.accuracy || 0,
        predictions_count: u.predictions_count || 0
      }));
    return sorted;
  }

  // 获取群组内排行榜
  getGroupLeaderboard(groupId) {
    const members = groupMemberships.query(m => m.group_id === groupId);
    const memberIds = members.map(m => m.user_id);
    const allUsers = users.getAll().filter(u => memberIds.includes(u.id));
    return allUsers
      .sort((a, b) => (b.total_points || 0) - (a.total_points || 0))
      .map((u, i) => ({
        rank: i + 1,
        id: u.id,
        nickname: u.nickname,
        points: u.total_points || 0,
        accuracy: u.accuracy || 0,
        predictions_count: u.predictions_count || 0
      }));
  }

  // ==================== 群组管理 ====================

  createGroup(name, createdBy) {
    if (!name || !name.trim()) throw new Error('群组名称不能为空');
    const trimmed = name.trim();
    if (trimmed.length > 30) throw new Error('群组名称不能超过30个字符');

    // 生成6位邀请码
    const inviteCode = crypto.randomBytes(3).toString('hex').toUpperCase();

    const group = predictionGroups.insert({
      name: trimmed,
      invite_code: inviteCode,
      created_by: createdBy,
      member_count: 1,
      created_at: new Date().toISOString()
    });

    // 创建者自动加入
    groupMemberships.insert({
      group_id: group.id,
      user_id: createdBy,
      joined_at: new Date().toISOString(),
      role: 'admin'
    });

    return { ...group };
  }

  joinGroup(inviteCode, userId) {
    const group = predictionGroups.findOne(g => g.invite_code === inviteCode.toUpperCase());
    if (!group) throw new Error('群组不存在，请检查邀请码');

    // 检查是否已加入
    const existing = groupMemberships.findOne(m => m.group_id === group.id && m.user_id === userId);
    if (existing) throw new Error('你已在该群组中');

    groupMemberships.insert({
      group_id: group.id,
      user_id: userId,
      joined_at: new Date().toISOString(),
      role: 'member'
    });

    predictionGroups.update(group.id, { member_count: (group.member_count || 1) + 1 });
    return { group_id: group.id, group_name: group.name };
  }

  leaveGroup(groupId, userId) {
    const membership = groupMemberships.findOne(m => m.group_id === groupId && m.user_id === userId);
    if (!membership) throw new Error('你不在该群组中');
    if (membership.role === 'admin') throw new Error('群主不能退出，请先转让群主');

    groupMemberships.delete(membership.id);
    const group = predictionGroups.getById(groupId);
    if (group) {
      predictionGroups.update(groupId, { member_count: Math.max(0, (group.member_count || 1) - 1) });
    }
    return true;
  }

  getGroup(groupId) {
    const group = predictionGroups.getById(groupId);
    if (!group) return null;
    const members = groupMemberships.query(m => m.group_id === groupId);
    return { ...group, members: members.map(m => {
      const u = users.getById(m.user_id);
      return { user_id: m.user_id, nickname: u?.nickname || '未知', role: m.role, joined_at: m.joined_at };
    })};
  }

  getUserGroups(userId) {
    const memberships = groupMemberships.query(m => m.user_id === userId);
    return memberships.map(m => {
      const group = predictionGroups.getById(m.group_id);
      if (!group) return null;
      // 计算用户在群内排名
      const leaderboard = this.getGroupLeaderboard(m.group_id);
      const myRank = leaderboard.find(e => e.id === userId)?.rank || '-';
      return { ...group, my_rank: myRank, my_role: m.role };
    }).filter(Boolean);
  }

  // ==================== Bracket Challenge ====================

  submitBracket(userId, bracketData) {
    // 检查是否已有bracket
    const existing = bracketPredictions.findOne(b => b.user_id === userId);
    if (existing) {
      return bracketPredictions.update(existing.id, {
        bracket_data: bracketData,
        updated_at: new Date().toISOString()
      });
    }
    return bracketPredictions.insert({
      user_id: userId,
      bracket_data: bracketData,
      points_earned: 0,
      created_at: new Date().toISOString()
    });
  }

  getUserBracket(userId) {
    return bracketPredictions.findOne(b => b.user_id === userId) || null;
  }

  getBracketLeaderboard() {
    const allBrackets = bracketPredictions.getAll();
    const ranked = allBrackets
      .sort((a, b) => (b.points_earned || 0) - (a.points_earned || 0))
      .map((b, i) => {
        const user = users.getById(b.user_id);
        return {
          rank: i + 1,
          user_id: b.user_id,
          nickname: user?.nickname || '未知',
          points: b.points_earned || 0
        };
      });
    return ranked;
  }

  // 对Bracket进行评分（淘汰赛每轮结束后调用）
  scoreBracketStage(stage, matchResults) {
    // stage: 'round16' | 'quarter' | 'semi' | 'final'
    // matchResults: [{ match_id, winner_team_id }]
    const stagePoints = { round16: 10, quarter: 20, semi: 30, final: 50 };

    bracketPredictions.getAll().forEach(bracket => {
      const bracketData = bracket.bracket_data;
      if (!bracketData || !bracketData[stage]) return;

      let earned = 0;
      matchResults.forEach(mr => {
        const pick = bracketData[stage].find(p => p.match_id === mr.match_id);
        if (pick && pick.winner_team_id === mr.winner_team_id) {
          earned += stagePoints[stage] || 0;
        }
      });

      if (earned > 0) {
        bracketPredictions.update(bracket.id, {
          points_earned: (bracket.points_earned || 0) + earned
        });
        // 同步更新用户总分
        const user = users.getById(bracket.user_id);
        if (user) {
          users.update(bracket.user_id, {
            total_points: (user.total_points || 0) + earned
          });
        }
      }
    });
  }

  // ==================== 辅助 ====================

  _checkDeadline(match) {
    if (!match || !match.match_date) return false;
    const matchTime = new Date(match.match_date);
    const deadline = new Date(matchTime.getTime() - 15 * 60 * 1000); // 15分钟前
    return new Date() < deadline;
  }
}

module.exports = new PredictionGameService();
