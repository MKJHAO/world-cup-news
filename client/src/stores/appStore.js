import { create } from 'zustand';
import { matchAPI, standingAPI, newsAPI, teamAPI } from '../services/api';

const useAppStore = create((set, get) => ({
  // 比赛数据
  matches: [],
  todayMatches: [],
  matchDates: [],
  matchesLoading: false,

  // 球队数据
  teams: [],
  teamsLoading: false,

  // 积分榜
  standings: [],
  standingsLoading: false,

  // 新闻
  news: [],
  newsLoading: false,

  // 射手榜
  topScorers: [],

  // 当前选中的比赛
  currentMatch: null,
  matchEvents: [],

  // 实时连接状态
  connected: false,

  // === Actions ===
  fetchMatches: async (params = {}) => {
    set({ matchesLoading: true });
    try {
      const res = await matchAPI.getAll(params);
      set({ matches: res.data, matchesLoading: false });
    } catch (e) {
      set({ matchesLoading: false });
    }
  },

  fetchTodayMatches: async () => {
    try {
      const res = await matchAPI.getToday();
      set({ todayMatches: res.data });
    } catch (e) { /* ignore */ }
  },

  fetchMatchDates: async () => {
    try {
      const res = await matchAPI.getDates();
      set({ matchDates: res.data });
    } catch (e) { /* ignore */ }
  },

  fetchMatchById: async (id) => {
    try {
      const res = await matchAPI.getById(id);
      set({ currentMatch: res.data, matchEvents: res.data.events || [] });
      return res.data;
    } catch (e) { return null; }
  },

  fetchTeams: async (params = {}) => {
    set({ teamsLoading: true });
    try {
      const res = await teamAPI.getAll(params);
      set({ teams: res.data, teamsLoading: false });
    } catch (e) {
      set({ teamsLoading: false });
    }
  },

  fetchStandings: async (group, tournament) => {
    set({ standingsLoading: true });
    try {
      const res = await standingAPI.getAll(group, tournament);
      set({ standings: res.data, standingsLoading: false });
    } catch (e) {
      set({ standingsLoading: false });
    }
  },

  fetchTopScorers: async () => {
    try {
      const res = await standingAPI.getTopScorers(10);
      set({ topScorers: res.data });
    } catch (e) { /* ignore */ }
  },

  fetchNews: async (params = {}) => {
    set({ newsLoading: true });
    try {
      const res = await newsAPI.getAll(params);
      set({ news: res.data, newsLoading: false });
    } catch (e) {
      set({ newsLoading: false });
    }
  },

  setConnected: (connected) => set({ connected }),

  updateMatchInList: (updatedMatch) => {
    set(state => ({
      matches: state.matches.map(m => m.id === updatedMatch.id ? { ...m, ...updatedMatch } : m),
      todayMatches: state.todayMatches.map(m => m.id === updatedMatch.id ? { ...m, ...updatedMatch } : m),
      // 同步更新当前比赛（如果正在详情页查看）
      currentMatch: state.currentMatch?.id === updatedMatch.id
        ? { ...state.currentMatch, ...updatedMatch }
        : state.currentMatch
    }));
  },

  updateCurrentMatch: (match) => set(state => ({
    currentMatch: state.currentMatch?.id === match.id
      ? { ...state.currentMatch, ...match }
      : state.currentMatch
  })),

  addMatchEvent: (event) => set(state => ({
    matchEvents: state.matchEvents.some(e => e.id === event.id)
      ? state.matchEvents
      : [...state.matchEvents, event].sort((a, b) => a.minute - b.minute),
    currentMatch: state.currentMatch?.id === event.match_id
      ? {
          ...state.currentMatch,
          events: (state.currentMatch.events || []).some(e => e.id === event.id)
            ? state.currentMatch.events
            : [...(state.currentMatch.events || []), event].sort((a, b) => a.minute - b.minute)
        }
      : state.currentMatch
  }))
}));

export default useAppStore;
