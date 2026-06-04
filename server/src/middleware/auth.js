const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin2026';
const SESSION_DURATION = 2 * 60 * 60 * 1000; // 2小时

const sessions = new Map();

// 清理过期session
setInterval(() => {
  const now = Date.now();
  for (const [token, expires] of sessions) {
    if (now > expires) sessions.delete(token);
  }
}, 30 * 60 * 1000);

function adminAuth(req, res, next) {
  const token = req.headers['x-admin-token'];
  if (!token || !sessions.has(token)) {
    return res.status(401).json({ success: false, message: '未授权访问，请先登录' });
  }
  if (Date.now() > sessions.get(token)) {
    sessions.delete(token);
    return res.status(401).json({ success: false, message: '登录已过期，请重新登录' });
  }
  next();
}

function login(req, res) {
  const { password } = req.body;
  if (password === ADMIN_PASSWORD) {
    const token = 'admin_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
    sessions.set(token, Date.now() + SESSION_DURATION);
    return res.json({ success: true, token });
  }
  res.status(403).json({ success: false, message: '密码错误' });
}

function logout(req, res) {
  const token = req.headers['x-admin-token'];
  if (token) sessions.delete(token);
  res.json({ success: true });
}

function checkAuth(req, res) {
  const token = req.headers['x-admin-token'];
  if (token && sessions.has(token) && Date.now() <= sessions.get(token)) {
    return res.json({ success: true });
  }
  res.json({ success: false });
}

module.exports = { adminAuth, login, logout, checkAuth };
