// Capacitor 移动端本地数据服务，替代 HTTP API 请求
// 使用 Vite import.meta.glob 在构建时将 JSON 数据内联到 JS bundle
// 各API方法的返回数据结构与服务器端 service 保持一致

const dataModules = import.meta.glob('../data/*.json', { eager: true, import: 'default' });

const cache = {};
for (const [path, data] of Object.entries(dataModules)) {
  const name = path.replace('../data/', '').replace('.json', '');
  cache[name] = data;
}

// === 数据丰富辅助函数 ===

function getTeam(id) {
  const teams = cache.teams || [];
  return teams.find(t => t.id == id) || {};
}

function enrichMatch(m) {
  const ht = getTeam(m.home_team_id);
  const at = getTeam(m.away_team_id);
  return {
    ...m,
    home_team_name: ht.name || '', home_team_cn: ht.name_cn || '', home_flag: ht.flag_emoji || '', home_color: ht.color_primary || '',
    away_team_name: at.name || '', away_team_cn: at.name_cn || '', away_flag: at.flag_emoji || '', away_color: at.color_primary || ''
  };
}

function enrichEvent(e) {
  const t = getTeam(e.team_id);
  return { ...e, team_name: t.name || '', team_cn: t.name_cn || '' };
}

function calculateForm(teamId) {
  const matches = cache.matches || [];
  return matches
    .filter(m => (m.home_team_id === teamId || m.away_team_id === teamId) && m.status === 'completed')
    .sort((a, b) => new Date(b.match_date) - new Date(a.match_date))
    .slice(0, 5)
    .map(m => {
      const isHome = m.home_team_id === teamId;
      const gf = isHome ? m.home_score : m.away_score;
      const ga = isHome ? m.away_score : m.home_score;
      const oppId = isHome ? m.away_team_id : m.home_team_id;
      const opp = getTeam(oppId);
      return {
        result: gf > ga ? 'W' : gf === ga ? 'D' : 'L',
        match_id: m.id,
        opponent_name: opp.name_cn || opp.name || '',
        score: `${gf}-${ga}`
      };
    });
}

// 比赛搜索：使用 teams 表查找球队名（与服务器端一致）
function matchSearchFilter(matches, search) {
  const q = search.toLowerCase();
  return matches.filter(m => {
    const ht = getTeam(m.home_team_id);
    const at = getTeam(m.away_team_id);
    return (ht.name && ht.name.toLowerCase().includes(q)) ||
           (ht.name_cn && ht.name_cn.includes(q)) ||
           (at.name && at.name.toLowerCase().includes(q)) ||
           (at.name_cn && at.name_cn.includes(q)) ||
           (m.stadium && m.stadium.toLowerCase().includes(q)) ||
           (m.group_name && m.group_name.toLowerCase().includes(q));
  });
}

// === 比赛 API ===

export function localMatchAPI(action, params = {}, id = null) {
  const matches = cache.matches || [];
  const events = cache.match_events || [];
  const stats = cache.match_statistics || [];

  switch (action) {
    case 'getAll': {
      let result = [...matches];

      // 非搜索过滤（与服务器端 matchService.getAll 一致）
      if (params.tournament) result = result.filter(m => {
        const t = m.tournament || (m.match_date && m.match_date.startsWith('202') ? m.match_date.slice(0, 4) : 'unknown');
        return t === params.tournament;
      });
      if (params.group) result = result.filter(m => m.group_name === params.group);
      if (params.stage) result = result.filter(m => m.stage === params.stage);
      if (params.status) result = result.filter(m => m.status === params.status);
      if (params.search) result = matchSearchFilter(result, params.search);

      // 排序 + 分页
      result.sort((a, b) => new Date(b.match_date) - new Date(a.match_date));
      const offset = params.offset || 0;
      const limit = params.limit || 50;
      result = result.slice(offset, offset + limit);

      // 丰富球队信息
      return { success: true, data: result.map(enrichMatch) };
    }
    case 'getById': {
      const m = matches.find(x => x.id == id) || null;
      if (m) {
        const enriched = enrichMatch(m);
        enriched.events = events
          .filter(e => e.match_id == id)
          .sort((a, b) => (a.minute || 0) - (b.minute || 0))
          .map(enrichEvent);
        return { success: true, data: enriched };
      }
      return { success: true, data: null };
    }
    case 'getToday': {
      const today = new Date().toISOString().split('T')[0];
      const result = matches
        .filter(m => (m.match_date || '').startsWith(today))
        .sort((a, b) => new Date(a.match_date) - new Date(b.match_date));
      return { success: true, data: result.map(enrichMatch) };
    }
    case 'getDates': {
      const dates = [...new Set(matches.map(m => (m.match_date || '').split(' ')[0]).filter(Boolean))];
      return { success: true, data: dates.sort().map(d => ({ date: d })) };
    }
    case 'getByDate': {
      const result = matches
        .filter(m => (m.match_date || '').startsWith(params.date || id))
        .sort((a, b) => new Date(a.match_date) - new Date(b.match_date));
      return { success: true, data: result.map(enrichMatch) };
    }
    case 'getBracket': {
      const result = matches
        .filter(m => ['round16', 'quarter', 'semi', 'third', 'final'].includes(m.stage))
        .sort((a, b) => new Date(a.match_date) - new Date(b.match_date));
      return { success: true, data: result.map(enrichMatch) };
    }
    case 'getStatistics': {
      const s = stats.filter(x => x.match_id == id);
      return { success: true, data: s };
    }
    default:
      return { success: true, data: [] };
  }
}

// === 球队 API ===

export function localTeamAPI(action, params = {}, id = null) {
  const teams = cache.teams || [];
  const matches = cache.matches || [];
  const players = cache.players || [];

  switch (action) {
    case 'getAll': {
      let result = [...teams];
      if (params.group) result = result.filter(t => t.group_name === params.group);
      if (params.search) {
        const q = params.search.toLowerCase();
        result = result.filter(t =>
          (t.name && t.name.toLowerCase().includes(q)) ||
          (t.name_cn && t.name_cn.includes(q))
        );
      }
      result.sort((a, b) => (a.group_name || '').localeCompare(b.group_name || '') || (a.fifa_rank || 999) - (b.fifa_rank || 999));
      if (params.limit) result = result.slice(0, parseInt(params.limit));
      return { success: true, data: result };
    }
    case 'getById': {
      const t = teams.find(x => x.id == id) || null;
      if (!t) return { success: true, data: null };

      // 包含球员列表（与服务器端一致）
      t.players = players
        .filter(p => p.team_id == id)
        .sort((a, b) => (a.number || 99) - (b.number || 99));

      // 近期比赛（与服务器端一致：最近10场已完成的比赛）
      t.recent_matches = matches
        .filter(m =>
          (m.home_team_id == id || m.away_team_id == id) && m.status === 'completed')
        .sort((a, b) => new Date(b.match_date) - new Date(a.match_date))
        .slice(0, 10)
        .map(m => {
          const isHome = m.home_team_id == id;
          const oppId = isHome ? m.away_team_id : m.home_team_id;
          const opp = getTeam(oppId);
          return {
            ...m,
            venue: isHome ? 'home' : 'away',
            opponent_name: opp.name || '',
            opponent_cn: opp.name_cn || '',
            opponent_flag: opp.flag_emoji || ''
          };
        });

      return { success: true, data: t };
    }
    case 'getH2H': {
      const oppId = params.opponent;
      const h2hMatches = matches
        .filter(m =>
          ((m.home_team_id == id && m.away_team_id == oppId) ||
           (m.home_team_id == oppId && m.away_team_id == id)) &&
          m.status === 'completed')
        .sort((a, b) => new Date(b.match_date) - new Date(a.match_date));

      let wins = 0, draws = 0, losses = 0, goalsFor = 0, goalsAgainst = 0;
      h2hMatches.forEach(m => {
        const isHome = m.home_team_id == id;
        const gf = isHome ? m.home_score : m.away_score;
        const ga = isHome ? m.away_score : m.home_score;
        goalsFor += gf; goalsAgainst += ga;
        if (gf > ga) wins++;
        else if (gf === ga) draws++;
        else losses++;
      });

      const teamA = getTeam(id);
      const teamB = getTeam(oppId);

      return {
        success: true,
        data: {
          summary: {
            total: h2hMatches.length,
            teamA: { id: parseInt(id), name: teamA.name_cn || teamA.name || '', wins, draws, losses, goalsFor, goalsAgainst },
            teamB: { id: parseInt(oppId), name: teamB.name_cn || teamB.name || '', wins: losses, draws, losses: wins, goalsFor: goalsAgainst, goalsAgainst: goalsFor }
          },
          recent: h2hMatches.slice(0, 5).map(m => ({
            id: m.id, match_date: m.match_date, stage: m.stage,
            home_team_id: m.home_team_id, away_team_id: m.away_team_id,
            home_score: m.home_score, away_score: m.away_score,
            home_name: (getTeam(m.home_team_id).name_cn || ''),
            away_name: (getTeam(m.away_team_id).name_cn || '')
          }))
        }
      };
    }
    default:
      return { success: true, data: [] };
  }
}

// === 积分榜 API ===

export function localStandingAPI(action, params = {}) {
  const standings = cache.standings || [];
  const scorers = cache.goal_scorers || [];

  switch (action) {
    case 'getAll': {
      let result = [...standings];

      if (params.tournament) {
        result = result.filter(s => {
          const t = s.tournament || '2022';
          return t === params.tournament;
        });
      }
      if (params.group) result = result.filter(s => s.group_name === params.group);

      // 丰富球队信息 + 近5场战绩（与服务器端 standingService 一致）
      const enriched = result.map(s => {
        const t = getTeam(s.team_id);
        return {
          ...s,
          name: t.name || '', name_cn: t.name_cn || '', flag_emoji: t.flag_emoji || '',
          form: calculateForm(s.team_id)
        };
      });

      enriched.sort((a, b) => {
        if (params.group) {
          return b.points - a.points || b.goal_diff - a.goal_diff || b.goals_for - a.goals_for;
        }
        return (a.group_name || '').localeCompare(b.group_name || '') || b.points - a.points || b.goal_diff - a.goal_diff || b.goals_for - a.goals_for;
      });

      return { success: true, data: enriched };
    }
    case 'getGroups': {
      const groups = [...new Set(standings.map(s => s.group_name).filter(Boolean))];
      return { success: true, data: groups.sort().map(g => ({ group_name: g })) };
    }
    case 'getTopScorers': {
      const enriched = scorers.map(s => {
        const team = getTeam(s.team_id);
        return { ...s, team_name: team.name || '', team_cn: team.name_cn || '', flag_emoji: team.flag_emoji || '' };
      });
      enriched.sort((a, b) => (b.goals || 0) - (a.goals || 0) || (b.assists || 0) - (a.assists || 0));
      return { success: true, data: enriched.slice(0, params.limit || 10) };
    }
    default:
      return { success: true, data: [] };
  }
}

// === 新闻 API ===

export function localNewsAPI(action, params = {}, id = null) {
  const news = cache.news || [];

  switch (action) {
    case 'getAll': {
      let result = [...news];
      if (params.category) result = result.filter(n => n.category === params.category);
      if (params.search) {
        const q = params.search.toLowerCase();
        result = result.filter(n =>
          (n.title && n.title.toLowerCase().includes(q)) ||
          (n.summary && n.summary.toLowerCase().includes(q)) ||
          (n.content && n.content.toLowerCase().includes(q))
        );
      }
      result.sort((a, b) => new Date(b.published_at || b.created_at) - new Date(a.published_at || a.created_at));
      const offset = params.offset || 0;
      const limit = params.limit || 20;
      result = result.slice(offset, offset + limit);
      return { success: true, data: result };
    }
    case 'getById': {
      const n = news.find(x => x.id == id) || null;
      return { success: true, data: n };
    }
    case 'getCategories': {
      const cats = [...new Set(news.map(n => n.category).filter(Boolean))];
      return { success: true, data: cats.sort().map(c => ({ category: c })) };
    }
    default:
      return { success: true, data: [] };
  }
}

// === 统计数据 ===

export function localStatsAPI() {
  const matches = cache.matches || [];
  const teams = cache.teams || [];
  const players = cache.players || [];
  const news = cache.news || [];

  const completed = matches.filter(m => m.status === 'completed');
  const totalGoals = completed.reduce((s, m) => s + (m.home_score || 0) + (m.away_score || 0), 0);
  const now = new Date();
  const upcoming2026 = matches.filter(m => new Date(m.match_date) > now && (m.match_date || '').startsWith('2026')).length;

  return {
    success: true,
    data: {
      totalMatches: matches.length,
      totalGoals,
      avgGoals: completed.length > 0 ? (totalGoals / completed.length).toFixed(1) : '0',
      totalTeams: teams.length,
      totalPlayers: players.length,
      totalNews: news.length,
      upcoming2026Matches: upcoming2026
    }
  };
}

export function isCapacitor() {
  try {
    return !!(window.Capacitor || navigator.userAgent.includes('Capacitor'));
  } catch { return false; }
}
