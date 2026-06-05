import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Trophy, TrendingUp, ChevronRight, Clock, Target, Zap, Star, CalendarDays, Globe } from 'lucide-react';
import useAppStore from '../stores/appStore';
import FlagImage from '../components/FlagImage';
import useUserStore from '../stores/userStore';
import HeroCarousel from '../components/HeroCarousel';
import LiveTicker from '../components/LiveTicker';
import { fetchStats, matchAPI } from '../services/api';

const stageLabels = { group: '小组赛', round16: '1/8决赛', quarter: '1/4决赛', semi: '半决赛', third: '季军赛', final: '决赛', round32: '1/16决赛' };

const WORLD_CUP_2026_START = new Date('2026-06-11T13:00:00-06:00');

function CountdownTimer() {
  const calcTime = useCallback(() => {
    const now = new Date();
    const diff = WORLD_CUP_2026_START - now;
    if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, started: true };
    return {
      days: Math.floor(diff / (1000 * 60 * 60 * 24)),
      hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((diff / (1000 * 60)) % 60),
      seconds: Math.floor((diff / 1000) % 60),
      started: false
    };
  }, []);
  const [timeLeft, setTimeLeft] = useState(calcTime);

  useEffect(() => {
    const timer = setInterval(() => setTimeLeft(calcTime()), 1000);
    return () => clearInterval(timer);
  }, []);

  if (timeLeft.started) {
    return <div className="flex items-center gap-2 text-accent text-sm"><span className="w-2 h-2 rounded-full bg-accent animate-live-pulse" />赛事进行中</div>;
  }

  return (
    <div className="flex items-center gap-3 md:gap-4 landscape:gap-1.5">
      {[
        { v: timeLeft.days, l: '天' },
        { v: timeLeft.hours, l: '时' },
        { v: timeLeft.minutes, l: '分' },
        { v: timeLeft.seconds, l: '秒' }
      ].map((item, i) => (
        <div key={i} className="text-center">
          <div className="bg-gold/15 border border-gold/30 rounded-xl landscape:rounded-lg px-3 py-2 landscape:px-2 landscape:py-1 min-w-[48px] landscape:min-w-[32px]">
            <span className="text-xl md:text-2xl landscape:text-sm font-bold text-gold score-number">{String(item.v).padStart(2, '0')}</span>
          </div>
          <div className="text-[10px] landscape:text-[7px] text-white/30 mt-1 landscape:mt-0.5 uppercase">{item.l}</div>
        </div>
      ))}
    </div>
  );
}

export default function HomePage() {
  const { matches, news, topScorers, fetchMatches, fetchNews, fetchTopScorers } = useAppStore();
  const [stats, setStats] = useState(null);
  const [upcoming2026, setUpcoming2026] = useState([]);
  const [openingMatch, setOpeningMatch] = useState(null);

  useEffect(() => {
    document.title = '世界杯足球资讯 - FIFA World Cup 2026';
    fetchMatches({ limit: 100 });
    fetchNews({ limit: 10 });
    fetchTopScorers();
    fetchStats().then(d => d.success && setStats(d.data)).catch(() => {});
    matchAPI.getAll({ stage: 'group', status: 'scheduled', limit: 20 })
      .then(d => {
        if (d.success) {
          const data = d.data || d;
          const matches2026 = (Array.isArray(data) ? data : []).filter(m => (m.match_date || '').startsWith('2026'));
          setUpcoming2026(matches2026.slice(0, 6));
          setOpeningMatch(matches2026[0] || null);
        }
      })
      .catch(() => {});
  }, []);

  const knockoutMatches = matches.filter(m => ['final', 'semi', 'third'].includes(m.stage) && (m.match_date || '').startsWith('2022')).slice(0, 3);
  const latestNews = news.slice(0, 6);

  return (
    <div className="space-y-6">
      {/* ===== Live Ticker ===== */}
      <LiveTicker />

      {/* ===== Hero Banner with Photos ===== */}
      <div className="relative overflow-hidden rounded-3xl landscape:rounded-xl p-6 md:p-10 landscape:p-3 min-h-[380px] md:min-h-[420px] landscape:min-h-0 landscape:h-auto flex items-center">
        <HeroCarousel />

        <div className="relative z-10 w-full">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/10 border border-accent/20 mb-5 landscape:mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-accent animate-live-pulse" />
            <span className="text-xs landscape:text-[10px] font-semibold text-accent tracking-wider uppercase">FIFA World Cup 2026</span>
          </div>

          <div className="flex flex-col lg:flex-row landscape:flex-row items-start lg:items-center landscape:items-center gap-6 lg:gap-12 landscape:gap-4">
            <div className="flex-1">
              <h1 className="text-2xl md:text-4xl lg:text-5xl landscape:text-lg font-bold leading-tight tracking-tight mb-3 landscape:mb-1">
                <span className="text-white">2026美加墨</span>
                <br className="md:hidden landscape:hidden" />
                <span className="text-gold-gradient"> 世界杯倒计时</span>
              </h1>
              <p className="text-sm md:text-base landscape:text-[10px] text-white/50 max-w-xl mb-2 landscape:mb-1 leading-relaxed">
                48支球队 · 16个主办城市 · 104场比赛 · 横跨北美三国
              </p>
              <div className="flex items-center gap-2 text-xs landscape:text-[9px] text-white/35 mb-5 landscape:mb-2">
                <Globe className="w-3.5 h-3.5 landscape:w-3 landscape:h-3" />
                <span>美国 · 加拿大 · 墨西哥 | 2026.6.11 - 7.19</span>
              </div>

              <CountdownTimer />

              <div className="flex gap-3 landscape:gap-1.5 mt-5 landscape:mt-2 flex-wrap">
                <Link to="/matches" className="btn-primary inline-flex items-center gap-2 landscape:gap-1 text-sm landscape:text-[10px] landscape:py-1.5 landscape:px-3">
                  <CalendarDays className="w-4 h-4 landscape:w-3 landscape:h-3" /> 查看赛程 <ChevronRight className="w-4 h-4 landscape:w-3 landscape:h-3" />
                </Link>
                <Link to="/standings" className="btn-outline inline-flex items-center gap-2 landscape:gap-1 text-sm landscape:text-[10px] landscape:py-1.5 landscape:px-3">
                  <Target className="w-4 h-4 landscape:w-3 landscape:h-3" /> 积分榜
                </Link>
                <Link to="/news" className="btn-outline inline-flex items-center gap-2 landscape:gap-1 text-sm landscape:text-[10px] landscape:py-1.5 landscape:px-3">
                  <Globe className="w-4 h-4 landscape:w-3 landscape:h-3" /> 最新资讯
                </Link>
              </div>
            </div>

            {/* Opening Match */}
            {openingMatch ? (
              <div className="w-full lg:w-auto lg:min-w-[320px] landscape:min-w-0 landscape:max-w-[200px] space-y-2 landscape:space-y-0.5">
                <div className="text-[10px] landscape:text-[8px] uppercase tracking-[0.2em] text-white/30 text-center">揭幕战 · Opening Match</div>
                <Link to={`/match/${openingMatch.id}`} className="glass-card border-glow text-center py-4 px-6 landscape:py-2 landscape:px-3 block match-card-hover">
                  <div className="flex items-center justify-center gap-5 landscape:gap-3">
                    <div className="text-center">
                      <FlagImage teamName={openingMatch.home_team_name} size="lg" />
                      <div className="text-sm landscape:text-[11px] font-bold mt-2 landscape:mt-1">{openingMatch.home_team_cn}</div>
                    </div>
                    <div>
                      <div className="text-2xl landscape:text-lg font-bold text-white/20">VS</div>
                      <div className="text-[10px] landscape:text-[8px] text-white/30 mt-1">{openingMatch.match_date?.split(' ')[0]}</div>
                    </div>
                    <div className="text-center">
                      <FlagImage teamName={openingMatch.away_team_name} size="lg" />
                      <div className="text-sm landscape:text-[11px] font-bold mt-2 landscape:mt-1">{openingMatch.away_team_cn}</div>
                    </div>
                  </div>
                  <div className="text-[10px] landscape:text-[8px] text-white/25 mt-2 landscape:mt-1">{openingMatch.stadium}</div>
                </Link>
              </div>
            ) : (
              <div className="w-full lg:w-auto lg:min-w-[320px] landscape:min-w-0 landscape:max-w-[200px]">
                <div className="glass-card text-center py-8 landscape:py-4">
                  <div className="text-sm landscape:text-[11px] text-white/30">等待赛程公布</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ===== 个性化看板（登录用户可见）===== */}
      <PersonalDashboard />

      {/* ===== Stats ===== */}
      {stats && (
        <div className="grid grid-cols-2 landscape:grid-cols-5 md:grid-cols-5 gap-3 landscape:gap-1.5 animate-stagger">
          {[
            { value: stats.totalTeams || 54, label: '参赛球队', icon: Globe, color: 'text-accent' },
            { value: stats.totalMatches || 136, label: '数据库比赛', icon: CalendarDays, color: 'text-gold' },
            { value: stats.upcoming2026Matches ?? 72, label: '2026即将开赛', icon: Zap, color: 'text-blue-400' },
            { value: stats.totalGoals || 172, label: '2022总进球', icon: Target, color: 'text-warning' },
            { value: stats.totalNews || 17, label: '新闻资讯', icon: Star, color: 'text-purple-400' }
          ].map((item, i) => (
            <div key={i} className="glass-card landscape:!p-2 text-center group">
              <item.icon className={`w-5 h-5 landscape:w-3.5 landscape:h-3.5 ${item.color} mx-auto mb-2 landscape:mb-1 opacity-60 group-hover:opacity-100 transition-opacity`} />
              <div className={`text-2xl md:text-3xl landscape:text-base font-bold ${item.color}`}>{item.value}</div>
              <div className="text-[11px] landscape:text-[8px] text-white/40 mt-1 landscape:mt-0.5 tracking-wide">{item.label}</div>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 landscape:grid-cols-3 gap-6 landscape:gap-3">
        {/* ===== Main Content ===== */}
        <div className="lg:col-span-2 landscape:col-span-2 space-y-6 landscape:space-y-2">

          {/* 2026 Upcoming */}
          {upcoming2026.length > 0 && (
            <section>
              <h2 className="section-title landscape:text-[11px] landscape:mb-2"><CalendarDays className="w-4 h-4 landscape:w-3 landscape:h-3" />2026世界杯 · 近期赛程</h2>
              <div className="space-y-2 landscape:space-y-1 animate-stagger">
                {upcoming2026.slice(0, 4).map(m => (
                  <Link key={m.id} to={`/match/${m.id}`} className="glass-card block match-card-hover">
                    <div className="flex items-center">
                      <div className="flex items-center gap-3 flex-1 justify-end min-w-0">
                        <div className="text-right min-w-0">
                          <div className="font-bold text-sm truncate">{m.home_team_cn}</div>
                        </div>
                        <FlagImage teamName={m.home_team_name} size="sm" />
                      </div>
                      <div className="mx-5 text-center min-w-[80px]">
                        <span className="badge-upcoming">即将开始</span>
                        <div className="text-base font-bold text-white/20 mt-1">VS</div>
                        <div className="text-[10px] text-white/25 mt-0.5">
                          {m.group_name ? `${m.group_name}组` : stageLabels[m.stage]} · {(m.match_date || '').split(' ')[1]?.slice(0, 5)}
                        </div>
                      </div>
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <FlagImage teamName={m.away_team_name} size="sm" />
                        <div className="min-w-0"><div className="font-bold text-sm truncate">{m.away_team_cn}</div></div>
                      </div>
                    </div>
                    <div className="flex items-center justify-center gap-2 mt-2 text-[10px] text-white/20">
                      <Clock className="w-3 h-3" />{m.match_date} · {m.stadium}
                    </div>
                  </Link>
                ))}
              </div>
              <Link to="/matches" className="inline-flex items-center gap-1 text-xs text-gold/50 hover:text-gold mt-3 transition-colors">
                查看全部104场赛程 <ChevronRight className="w-3 h-3" />
              </Link>
            </section>
          )}

          {/* 2022 经典回顾 */}
          <section>
            <h2 className="section-title landscape:text-[11px] landscape:mb-2"><Trophy className="w-4 h-4 landscape:w-3 landscape:h-3" />2022卡塔尔 · 经典回顾</h2>
            <div className="space-y-3 landscape:space-y-1 animate-stagger">
              {knockoutMatches.map(m => (
                <Link key={m.id} to={`/match/${m.id}`} className="glass-card block match-card-hover">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1 justify-end">
                      <div className="text-right">
                        <div className="font-bold text-sm">{m.home_team_cn}</div>
                        <div className="text-[11px] text-white/40">{m.home_team_name}</div>
                      </div>
                      <FlagImage teamName={m.home_team_name} size="md" />
                    </div>
                    <div className="mx-6 text-center">
                      <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-semibold ${
                        m.stage === 'final' ? 'bg-gold/20 text-gold' : 'bg-white/[0.06] text-white/40'
                      }`}>{stageLabels[m.stage]}</span>
                      <div className="text-2xl font-bold score-number mt-1.5">
                        <span className={m.home_score > m.away_score ? 'text-gold' : 'text-white'}>{m.home_score}</span>
                        <span className="text-white/30 mx-1.5">-</span>
                        <span className={m.away_score > m.home_score ? 'text-gold' : 'text-white/80'}>{m.away_score}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 flex-1">
                      <FlagImage teamName={m.away_team_name} size="md" />
                      <div><div className="font-bold text-sm">{m.away_team_cn}</div><div className="text-[11px] text-white/40">{m.away_team_name}</div></div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        </div>

        {/* ===== Sidebar ===== */}
        <div className="space-y-5 landscape:space-y-2">
          {/* Top Scorers */}
          <section className="glass-card landscape:!p-2.5">
            <h2 className="section-title landscape:text-[11px] landscape:mb-1.5"><TrendingUp className="w-4 h-4 landscape:w-3 landscape:h-3" />2022射手榜</h2>
            <div className="space-y-1 landscape:space-y-0">
              {topScorers.slice(0, 6).map((s, i) => (
                <Link key={s.id} to={`/team/${s.team_id}`}
                  className="flex items-center gap-3 landscape:gap-1.5 py-2 landscape:py-1 px-2 -mx-2 rounded-xl hover:bg-white/[0.04] transition-colors group">
                  <span className={`w-6 h-6 landscape:w-5 landscape:h-5 rounded-lg flex items-center justify-center text-[11px] landscape:text-[9px] font-bold shrink-0 ${
                    i === 0 ? 'bg-gold text-dark shadow-lg shadow-gold/30' :
                    i === 1 ? 'bg-white/20 text-white' : 'bg-white/[0.04] text-white/30'
                  }`}>{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] landscape:text-[10px] font-semibold truncate group-hover:text-gold transition-colors">{s.player_name}</div>
                    <div className="text-[11px] landscape:text-[8px] text-white/35 flex items-center gap-1.5 mt-0.5 landscape:mt-0">
                      <FlagImage teamName={s.team_name} size="sm" />{s.team_cn}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-lg landscape:text-sm font-bold text-gold">{s.goals}</div>
                    <div className="text-[9px] landscape:text-[7px] text-white/25">{s.assists}助攻</div>
                  </div>
                </Link>
              ))}
            </div>
          </section>

          {/* Latest News */}
          <section className="glass-card landscape:!p-2.5">
            <h2 className="section-title landscape:text-[11px] landscape:mb-1.5"><Globe className="w-4 h-4 landscape:w-3 landscape:h-3" />最新资讯</h2>
            <div className="space-y-3 landscape:space-y-1.5">
              {latestNews.slice(0, 6).map(n => (
                <Link key={n.id} to={`/news/${n.id}`} className="block group">
                  <h3 className="text-[13px] landscape:text-[10px] font-medium leading-snug group-hover:text-gold transition-colors line-clamp-2">{n.title}</h3>
                  <div className="flex items-center gap-2 mt-1.5 landscape:mt-0.5">
                    <span className="text-[9px] landscape:text-[7px] px-1.5 py-0.5 rounded-md bg-gold/10 text-gold/70 font-medium">
                      {n.category === 'match_report' ? '战报' : n.category === 'feature' ? '特写' : n.category === 'award' ? '奖项' : n.category === 'gossip' ? '花边' : n.category === 'transfer' ? '转会' : n.category === 'preview' ? '预告' : '新闻'}
                    </span>
                    <span className="text-[9px] landscape:text-[7px] text-white/20">{(n.published_at || '').split(' ')[0]}</span>
                  </div>
                </Link>
              ))}
            </div>
            <Link to="/news" className="block text-center text-xs landscape:text-[10px] text-gold/50 hover:text-gold mt-4 landscape:mt-1.5 pt-3 landscape:pt-1.5 border-t border-white/[0.04]">
              查看全部 →
            </Link>
          </section>

          {/* 2026 参赛队预览 */}
          <section className="glass-card landscape:!p-2.5">
            <h2 className="section-title landscape:text-[11px] landscape:mb-1.5"><Globe className="w-4 h-4 landscape:w-3 landscape:h-3" />2026参赛队</h2>
            <div className="grid grid-cols-4 landscape:grid-cols-6 gap-2 landscape:gap-1">
              {[
                ['Mexico', '墨西哥'], ['Canada', '加拿大'], ['USA', '美国'],
                ['Brazil', '巴西'], ['Argentina', '阿根廷'], ['France', '法国'],
                ['England', '英格兰'], ['Spain', '西班牙'], ['Germany', '德国'],
                ['Portugal', '葡萄牙'], ['Japan', '日本'], ['South Korea', '韩国']
              ].map(([name, cn]) => (
                <div key={name} className="text-center py-2 px-1 rounded-xl hover:bg-white/[0.04] transition-colors">
                  <FlagImage teamName={name} size="sm" />
                  <div className="text-[9px] text-white/50 mt-1 truncate">{cn}</div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

// ===== 个性化看板组件 =====
function PersonalDashboard() {
  const { isLoggedIn, user, toggleFavoriteTeam } = useUserStore();
  const [teams, setTeams] = useState([]);
  const [favNews, setFavNews] = useState([]);
  const [matches, setMatches] = useState([]);

  // 获取全部球队列表
  useEffect(() => {
    if (!isLoggedIn) return;
    fetch('/api/teams?limit=100').then(r => r.json()).then(d => {
      if (d.success) setTeams(d.data);
    }).catch(() => {});
  }, [isLoggedIn]);

  // 获取关注球队的比赛
  useEffect(() => {
    if (!isLoggedIn || !user?.favorite_teams?.length) return;
    fetch('/api/matches?tournament=2026&limit=50').then(r => r.json()).then(d => {
      if (d.success) {
        const favIds = user.favorite_teams || [];
        const filtered = (d.data || []).filter(m =>
          favIds.includes(m.home_team_id) || favIds.includes(m.away_team_id)
        ).slice(0, 5);
        setMatches(filtered);
      }
    }).catch(() => {});
  }, [isLoggedIn, user?.favorite_teams]);

  // 获取关注球队的新闻
  useEffect(() => {
    if (!isLoggedIn || !user?.favorite_teams?.length) return;
    fetch('/api/news?limit=20').then(r => r.json()).then(d => {
      if (d.success) {
        const favIds = user.favorite_teams || [];
        const filtered = (d.data || []).filter(n => {
          const txt = (n.title + n.summary).toLowerCase();
          return favIds.some(id => {
            const t = teams.find(t => t.id === id);
            return t && (txt.includes(t.name?.toLowerCase()) || txt.includes(t.name_cn));
          });
        }).slice(0, 3);
        setFavNews(filtered);
      }
    }).catch(() => {});
  }, [isLoggedIn, user?.favorite_teams, teams]);

  if (!isLoggedIn) return null;

  return (
    <div className="glass-card mb-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="section-title mb-0 flex items-center gap-1">
          <Star size={16} className="text-gold" /> 我的关注
        </h2>
        <span className="text-[10px] text-white/20">
          {user?.favorite_teams?.length || 0}/5 支球队
        </span>
      </div>

      {/* 球队关注选择器 */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        {teams.slice(0, 32).map(t => {
          const isFav = (user?.favorite_teams || []).includes(t.id);
          return (
            <button
              key={t.id}
              onClick={() => toggleFavoriteTeam(t.id)}
              className={`text-[11px] px-2.5 py-1 rounded-full border transition-all ${
                isFav
                  ? 'bg-gold/15 border-gold/30 text-gold'
                  : 'bg-white/[0.02] border-white/[0.06] text-white/30 hover:border-white/[0.15]'
              }`}
            >
              {isFav ? '★' : '☆'} {t.name_cn || t.name}
            </button>
          );
        })}
      </div>

      {/* 关注内容 */}
      {(user?.favorite_teams || []).length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* 关注球队的比赛 */}
          <div>
            <h4 className="text-xs text-white/40 mb-2">📅 近期比赛</h4>
            {matches.length === 0 ? (
              <p className="text-xs text-white/15">暂无关注球队的比赛</p>
            ) : (
              <div className="space-y-1.5">
                {matches.map(m => (
                  <Link key={m.id} to={`/match/${m.id}`}
                    className="flex items-center gap-2 p-2 rounded-lg bg-white/[0.02] hover:bg-white/[0.05] transition-colors text-xs">
                    <span className="text-white/60 w-16 truncate">{m._homeTeam?.name_cn}</span>
                    {m.status === 'completed'
                      ? <span className="text-white font-bold">{m.home_score}-{m.away_score}</span>
                      : <span className="text-white/20">vs</span>}
                    <span className="text-white/60 w-16 truncate">{m._awayTeam?.name_cn}</span>
                    <span className="text-white/20 ml-auto">{m.match_date?.split(' ')[0]}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* 相关新闻 */}
          <div>
            <h4 className="text-xs text-white/40 mb-2">📰 相关新闻</h4>
            {favNews.length === 0 ? (
              <p className="text-xs text-white/15">暂无相关新闻</p>
            ) : (
              <div className="space-y-1.5">
                {favNews.map(n => (
                  <Link key={n.id} to={`/news/${n.id}`}
                    className="block p-2 rounded-lg bg-white/[0.02] hover:bg-white/[0.05] transition-colors">
                    <p className="text-xs text-white/70 truncate">{n.title}</p>
                    <p className="text-[10px] text-white/20 mt-0.5">{n.category}</p>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <p className="text-xs text-white/20 text-center py-4">
          点击上方球队名称关注，获取个性化比赛和新闻推荐
        </p>
      )}
    </div>
  );
}
