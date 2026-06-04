import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';
const api = axios.create({
  baseURL: API_BASE ? `${API_BASE}/api` : '/api',
  timeout: 10000
});

api.interceptors.response.use(
  response => response,
  error => {
    if (!error.response) {
      console.warn('API 网络错误：无法连接服务器');
    }
    return Promise.reject(error);
  }
);

// === 比赛 API ===
export const matchAPI = {
  getAll: (p) => api.get('/matches', { params: p }).then(r => r.data),
  getById: (id) => api.get(`/matches/${id}`).then(r => r.data),
  getToday: () => api.get('/matches/today').then(r => r.data),
  getDates: () => api.get('/matches/dates').then(r => r.data),
  getByDate: (d) => api.get(`/matches/date/${d}`).then(r => r.data),
  getBracket: () => api.get('/matches/bracket').then(r => r.data),
  getStatistics: (id) => api.get(`/matches/${id}/statistics`).then(r => r.data)
};

// === 球队 API ===
export const teamAPI = {
  getAll: (p) => api.get('/teams', { params: p }).then(r => r.data),
  getById: (id) => api.get(`/teams/${id}`).then(r => r.data),
  getH2H: (tid, oid) => api.get(`/teams/${tid}/h2h`, { params: { opponent: oid } }).then(r => r.data)
};

// === 积分榜 API ===
export const standingAPI = {
  getAll: (g, t) => api.get('/standings', { params: { ...(g ? { group: g } : {}), ...(t ? { tournament: t } : {}) } }).then(r => r.data),
  getGroups: () => api.get('/standings/groups').then(r => r.data),
  getTopScorers: (l) => api.get('/standings/scorers', { params: { limit: l } }).then(r => r.data)
};

// === 新闻 API ===
export const newsAPI = {
  getAll: (p) => api.get('/news', { params: p }).then(r => r.data),
  getById: (id) => api.get(`/news/${id}`).then(r => r.data),
  getCategories: () => api.get('/news/categories').then(r => r.data)
};

// === 赔率 API ===
export const oddsAPI = {
  getByMatch: (id) => api.get(`/odds/match/${id}`).then(r => r.data),
  getTeamAnalysis: (id) => api.get(`/odds/team/${id}`).then(r => r.data),
  getAnalysis: (p) => api.get('/odds/analysis', { params: p }).then(r => r.data),
  getStages: () => api.get('/odds/stages').then(r => r.data),
  getMatchTypes: () => api.get('/odds/match-types').then(r => r.data),
  compare: (a, b) => api.get('/odds/comparison', { params: { a, b } }).then(r => r.data)
};

// === 花边 API ===
export const gossipAPI = {
  getTeamGossip: (id) => api.get(`/gossip/team/${id}`).then(r => r.data),
  getAllStats: () => api.get('/gossip/all').then(r => r.data),
  getTrend: (id) => api.get(`/gossip/trend/${id}`).then(r => r.data)
};

// === 预测 API ===
export const predictionAPI = {
  getSandbox: () => api.get('/prediction/sandbox').then(r => r.data),
  getRankings: () => api.get('/prediction/rankings').then(r => r.data),
  getTeam: (id) => api.get(`/prediction/team/${id}`).then(r => r.data),
  getGroup: (n) => api.get(`/prediction/group/${n}`).then(r => r.data),
  getRadar: (id) => api.get(`/prediction/radar/${id}`).then(r => r.data)
};

// === 公开统计 ===
export function fetchStats() {
  return api.get('/stats').then(r => r.data);
}

function getAdminHeaders() {
  const token = sessionStorage.getItem('admin_token');
  return token ? { 'X-Admin-Token': token } : {};
}

export const adminAPI = {
  getStats: () => api.get('/admin/stats', { headers: getAdminHeaders() }).then(r => r.data),
  getMatches: () => api.get('/admin/matches', { headers: getAdminHeaders() }).then(r => r.data),
  updateMatch: (id, d) => api.put(`/admin/matches/${id}`, d, { headers: getAdminHeaders() }).then(r => r.data),
  addEvent: (mid, d) => api.post(`/admin/matches/${mid}/events`, d, { headers: getAdminHeaders() }).then(r => r.data),
  getNews: () => api.get('/admin/news', { headers: getAdminHeaders() }).then(r => r.data),
  createNews: (d) => api.post('/admin/news', d, { headers: getAdminHeaders() }).then(r => r.data),
  deleteNews: (id) => api.delete(`/admin/news/${id}`, { headers: getAdminHeaders() }).then(r => r.data)
};

export const authAPI = {
  login: (pw) => api.post('/auth/login', { password: pw }).then(r => r.data),
  logout: () => api.post('/auth/logout', null, { headers: getAdminHeaders() }).then(r => r.data),
  check: () => api.get('/auth/check', { headers: getAdminHeaders() }).then(r => r.data)
};

// === 用户辅助函数 ===
function getUserHeaders() {
  const token = localStorage.getItem('user_token');
  return token ? { 'x-user-token': token } : {};
}

// === 用户 API ===
export const userAPI = {
  register: (nickname) => api.post('/users/register', { nickname }).then(r => r.data),
  getMe: () => api.get('/users/me', { headers: getUserHeaders() }).then(r => r.data),
  getById: (id) => api.get(`/users/${id}`).then(r => r.data)
};

// === 预测竞猜 API ===
export const predictionGameAPI = {
  // 预测
  submit: (data) => api.post('/predictions/submit', data, { headers: getUserHeaders() }).then(r => r.data),
  getMy: () => api.get('/predictions/my', { headers: getUserHeaders() }).then(r => r.data),
  getPending: () => api.get('/predictions/pending', { headers: getUserHeaders() }).then(r => r.data),
  getByMatch: (matchId) => api.get(`/predictions/match/${matchId}`).then(r => r.data),
  // 排行榜
  getLeaderboard: (type = 'all_time') => api.get('/leaderboard', { params: { type } }).then(r => r.data),
  // 群组
  createGroup: (name) => api.post('/groups', { name }, { headers: getUserHeaders() }).then(r => r.data),
  joinGroup: (inviteCode) => api.post('/groups/join', { invite_code: inviteCode }, { headers: getUserHeaders() }).then(r => r.data),
  getGroup: (id) => api.get(`/groups/${id}`).then(r => r.data),
  getMyGroups: () => api.get('/groups/my', { headers: getUserHeaders() }).then(r => r.data),
  leaveGroup: (id) => api.post(`/groups/${id}/leave`, null, { headers: getUserHeaders() }).then(r => r.data),
  // Bracket
  submitBracket: (bracketData) => api.post('/bracket/submit', bracketData, { headers: getUserHeaders() }).then(r => r.data),
  getMyBracket: () => api.get('/bracket/my', { headers: getUserHeaders() }).then(r => r.data),
  getBracketLeaderboard: () => api.get('/bracket/leaderboard').then(r => r.data)
};

// === AI 助手 API ===
export const aiAPI = {
  chat: (message, history = [], style = 'professional') =>
    api.post('/ai/chat', { message, history, style }).then(r => r.data),
  getPreMatchReport: (matchId) =>
    api.get(`/ai/report/pre/${matchId}`).then(r => r.data),
  getPostMatchSummary: (matchId) =>
    api.get(`/ai/report/post/${matchId}`).then(r => r.data),
  getCommentaryStyles: () =>
    api.get('/ai/commentary/styles').then(r => r.data)
};

export default api;
