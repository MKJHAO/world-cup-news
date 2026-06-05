const crypto = require('crypto');
const { users } = require('../models/database');

function toUserData(user) {
  return {
    id: user.id,
    nickname: user.nickname,
    total_points: user.total_points || 0,
    weekly_points: user.weekly_points || 0,
    predictions_count: user.predictions_count || 0,
    accuracy: user.accuracy || 0,
    favorite_teams: user.favorite_teams || [],
    created_at: user.created_at
  };
}

class UserService {
  register(nickname) {
    if (!nickname || !nickname.trim()) throw new Error('昵称不能为空');
    const trimmed = nickname.trim();
    if (trimmed.length > 20) throw new Error('昵称不能超过20个字符');
    const existing = users.findOne(u => u.nickname === trimmed);
    if (existing) throw new Error('该昵称已被使用，请换一个');

    const token = 'usr_' + crypto.randomBytes(24).toString('hex');
    const user = users.insert({
      nickname: trimmed, token,
      total_points: 0, weekly_points: 0, predictions_count: 0, correct_count: 0, accuracy: 0,
      favorite_teams: []
    });
    return { user: toUserData(user), token };
  }

  authenticate(token) {
    if (!token) return null;
    const user = users.findOne(u => u.token === token);
    return user ? toUserData(user) : null;
  }

  getById(id) {
    const user = users.getById(id);
    return user ? toUserData(user) : null;
  }

  updateProfile(userId, updates) {
    const user = users.getById(userId);
    if (!user) throw new Error('用户不存在');
    const allowed = {};
    if (updates.favorite_teams !== undefined) allowed.favorite_teams = updates.favorite_teams;
    users.update(userId, allowed);
    return toUserData(users.getById(userId));
  }

  updateStats(userId, pointsEarned, isCorrect) {
    const user = users.getById(userId);
    if (!user) return;
    const updates = {
      total_points: (user.total_points || 0) + pointsEarned,
      predictions_count: (user.predictions_count || 0) + 1
    };
    if (isCorrect) updates.correct_count = (user.correct_count || 0) + 1;
    updates.accuracy = updates.predictions_count > 0
      ? Math.round((updates.correct_count / updates.predictions_count) * 100) : 0;
    updates.weekly_points = (user.weekly_points || 0) + pointsEarned;
    return users.update(userId, updates);
  }

  userAuth(req, res, next) {
    const token = req.headers['x-user-token'];
    if (!token) return res.status(401).json({ success: false, message: '请先注册/登录' });
    const user = users.findOne(u => u.token === token);
    if (!user) return res.status(401).json({ success: false, message: '用户信息无效，请重新注册' });
    req.user = { id: user.id, nickname: user.nickname };
    next();
  }
}

module.exports = new UserService();
