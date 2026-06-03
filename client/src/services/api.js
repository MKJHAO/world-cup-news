import axios from 'axios';

const BASE = import.meta.env.VITE_API_BASE_URL || '';
const api = axios.create({
  baseURL: `${BASE}/api`,
  timeout: 10000
});

export const matchAPI = {
  getAll: (params) => api.get('/matches', { params }).then(r => r.data),
  getById: (id) => api.get(`/matches/${id}`).then(r => r.data),
  getToday: () => api.get('/matches/today').then(r => r.data),
  getDates: () => api.get('/matches/dates').then(r => r.data),
  getByDate: (date) => api.get(`/matches/date/${date}`).then(r => r.data),
  getBracket: () => api.get('/matches/bracket').then(r => r.data),
  getStatistics: (id) => api.get(`/matches/${id}/statistics`).then(r => r.data)
};

export const teamAPI = {
  getAll: (params) => api.get('/teams', { params }).then(r => r.data),
  getById: (id) => api.get(`/teams/${id}`).then(r => r.data),
  getH2H: (teamId, opponentId) => api.get(`/teams/${teamId}/h2h`, { params: { opponent: opponentId } }).then(r => r.data)
};

export const standingAPI = {
  getAll: (group, tournament) => api.get('/standings', { params: { ...(group ? { group } : {}), ...(tournament ? { tournament } : {}) } }).then(r => r.data),
  getGroups: () => api.get('/standings/groups').then(r => r.data),
  getTopScorers: (limit) => api.get('/standings/scorers', { params: { limit } }).then(r => r.data)
};

export const newsAPI = {
  getAll: (params) => api.get('/news', { params }).then(r => r.data),
  getById: (id) => api.get(`/news/${id}`).then(r => r.data),
  getCategories: () => api.get('/news/categories').then(r => r.data)
};

export const adminAPI = {
  getStats: () => api.get('/admin/stats').then(r => r.data),
  getMatches: () => api.get('/admin/matches').then(r => r.data),
  updateMatch: (id, data) => api.put(`/admin/matches/${id}`, data).then(r => r.data),
  addEvent: (matchId, data) => api.post(`/admin/matches/${matchId}/events`, data).then(r => r.data),
  getNews: () => api.get('/admin/news').then(r => r.data),
  createNews: (data) => api.post('/admin/news', data).then(r => r.data),
  deleteNews: (id) => api.delete(`/admin/news/${id}`).then(r => r.data)
};

export const oddsAPI = {
  getByMatch: (matchId) => api.get(`/odds/match/${matchId}`).then(r => r.data),
  getTeamAnalysis: (teamId) => api.get(`/odds/team/${teamId}`).then(r => r.data),
  getAnalysis: (params) => api.get('/odds/analysis', { params }).then(r => r.data),
  getStages: () => api.get('/odds/stages').then(r => r.data),
  getMatchTypes: () => api.get('/odds/match-types').then(r => r.data),
  compare: (a, b) => api.get('/odds/comparison', { params: { a, b } }).then(r => r.data)
};

export const gossipAPI = {
  getTeamGossip: (teamId) => api.get(`/gossip/team/${teamId}`).then(r => r.data),
  getAllStats: () => api.get('/gossip/all').then(r => r.data),
  getTrend: (teamId) => api.get(`/gossip/trend/${teamId}`).then(r => r.data)
};

export const predictionAPI = {
  getSandbox: () => api.get('/prediction/sandbox').then(r => r.data),
  getRankings: () => api.get('/prediction/rankings').then(r => r.data),
  getTeam: (id) => api.get(`/prediction/team/${id}`).then(r => r.data),
  getGroup: (name) => api.get(`/prediction/group/${name}`).then(r => r.data),
  getRadar: (id) => api.get(`/prediction/radar/${id}`).then(r => r.data)
};

export default api;
