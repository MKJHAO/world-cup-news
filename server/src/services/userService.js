const crypto = require('crypto');
const { users } = require('../models/database');

class UserService {
  // 通过昵称注册，返回用户和token
  register(nickname) {
    if (!nickname || !nickname.trim()) {
      throw new Error('昵称不能为空');
    }
    const trimmed = nickname.trim();
    if (trimmed.length > 20) {
      throw new Error('昵称不能超过20个字符');
    }
    // 检查昵称是否已存在
    const existing = users.findOne(u => u.nickname === trimmed);
    if (existing) {
      throw new Error('该昵称已被使用，请换一个');
    }
    // 生成唯一token
    const token = 'usr_' + crypto.randomBytes(24).toString('hex');
    const user = users.insert({
      nickname: trimmed,
      token,
      total_points: 0,
      weekly_points: 0,
      predictions_count: 0,
      correct_count: 0,
      accuracy: 0
    });
    return { user: { id: user.id, nickname: user.nickname, total_points: user.total_points, accuracy: user.accuracy }, token };
  }

  // 通过token验证用户
  authenticate(token) {
    if (!token) return null;
    const user = users.findOne(u => u.token === token);
    if (!user) return null;
    return { id: user.id, nickname: user.nickname, total_points: user.total_points, weekly_points: user.weekly_points, predictions_count: user.predictions_count, accuracy: user.accuracy };
  }

  // 获取用户公开信息
  getById(id) {
    const user = users.getById(id);
    if (!user) return null;
    return { id: user.id, nickname: user.nickname, total_points: user.total_points, predictions_count: user.predictions_count, accuracy: user.accuracy, created_at: user.created_at };
  }

  // 更新用户统计数据
  updateStats(userId, pointsEarned, isCorrect) {
    const user = users.getById(userId);
    if (!user) return;
    const updates = {
      total_points: (user.total_points || 0) + pointsEarned,
      predictions_count: (user.predictions_count || 0) + 1
    };
    if (isCorrect) {
      updates.correct_count = (user.correct_count || 0) + 1;
    }
    updates.accuracy = updates.predictions_count > 0
      ? Math.round((updates.correct_count / updates.predictions_count) * 100)
      : 0;
    // 本周积分（简化：此处仅累加，每周一由外部重置）
    updates.weekly_points = (user.weekly_points || 0) + pointsEarned;
    return users.update(userId, updates);
  }

  // Express中间件：用户认证
  userAuth(req, res, next) {
    const token = req.headers['x-user-token'];
    if (!token) {
      return res.status(401).json({ success: false, message: '请先注册/登录' });
    }
    const user = users.findOne(u => u.token === token);
    if (!user) {
      return res.status(401).json({ success: false, message: '用户信息无效，请重新注册' });
    }
    req.user = { id: user.id, nickname: user.nickname };
    next();
  }
}

module.exports = new UserService();
