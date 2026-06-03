import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Trophy, TrendingUp, ChevronRight, Clock, Target, Zap, Star, CalendarDays, Globe } from 'lucide-react';
import useAppStore from '../stores/appStore';
import FlagImage from '../components/FlagImage';
import HeroCarousel from '../components/HeroCarousel';
import LiveTicker from '../components/LiveTicker';

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
    <div className="flex items-center gap-3 md:gap-4">
      {[
        { v: timeLeft.days, l: '天' },
        { v: timeLeft.hours, l: '时' },
        { v: timeLeft.minutes, l: '分' },
        { v: timeLeft.seconds, l: '秒' }
      ].map((item, i) => (
        <div key={i} className="text-center">
          <div className="bg-gold/15 border border-gold/30 rounded-xl px-3 py-2 min-w-[48px]">
            <span className="text-xl md:text-2xl font-bold text-gold score-number">{String(item.v).padStart(2, '0')}</span>
          </div>
          <div className="text-[10px] text-white/30 mt-1 uppercase">{item.l}</div>
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
    fetch('/api/admin/stats').then(r => r.json()).then(d => d.success && setStats(d.data)).catch(() => {});
    fetch('/api/matches?stage=group&status=scheduled&limit=20').then(r => r.json())
      .then(d => {
        if (d.success) {
          const matches2026 = d.data.filter(m => (m.match_date || '').startsWith('2026'));
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
      <div className="relative overflow-hidden rounded-3xl p-6 md:p-10 min-h-[380px] md:min-h-[420px] flex items-center">
        <HeroCarousel />

        <div className="relative z-10 w-full">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/10 border border-accent/20 mb-5">
            <span className="w-1.5 h-1.5 rounded-full bg-accent animate-live-pulse" />
            <span className="text-xs font-semibold text-accent tracking-wider uppercase">FIFA World Cup 2026</span>
          </div>

          <div className="flex flex-col lg:flex-row items-start lg:items-center gap-6 lg:gap-12">
            <div className="flex-1">
              <h1 className="text-2xl md:text-4xl lg:text-5xl font-bold leading-tight tracking-tight mb-3">
                <span className="text-white">2026美加墨</span>
                <br className="md:hidden" />
                <span className="text-gold-gradient"> 世界杯倒计时</span>
              </h1>
              <p className="text-sm md:text-base text-white/50 max-w-xl mb-2 leading-relaxed">
                48支球队 · 16个主办城市 · 104场比赛 · 横跨北美三国
              </p>
              <div className="flex items-center gap-2 text-xs text-white/35 mb-5">
                <Globe className="w-3.5 h-3.5" />
                <span>美国 · 加拿大 · 墨西哥 | 2026.6.11 - 7.19</span>
              </div>

              <CountdownTimer />

              <div className="flex gap-3 mt-5 flex-wrap">
                <Link to="/matches" className="btn-primary inline-flex items-center gap-2 text-sm">
                  <CalendarDays className="w-4 h-4" /> 查看赛程 <ChevronRight className="w-4 h-4" />
                </Link>
                <Link to="/standings" className="btn-outline inline-flex items-center gap-2 text-sm">
                  <Target className="w-4 h-4" /> 积分榜
                </Link>
                <Link to="/news" className="btn-outline inline-flex items-center gap-2 text-sm">
                  <Globe className="w-4 h-4" /> 最新资讯
                </Link>
              </div>
            </div>

            {/* Opening Match */}
            {openingMatch ? (
              <div className="w-full lg:w-auto lg:min-w-[320px] space-y-2">
                <div className="text-[10px] uppercase tracking-[0.2em] text-white/30 text-center">揭幕战 · Opening Match</div>
                <Link to={`/match/${openingMatch.id}`} className="glass-card border-glow text-center py-4 px-6 block match-card-hover">
                  <div className="flex items-center justify-center gap-5">
                    <div className="text-center">
                      <FlagImage teamName={openingMatch.home_team_name} size="lg" />
                      <div className="text-sm font-bold mt-2">{openingMatch.home_team_cn}</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-white/20">VS</div>
                      <div className="text-[10px] text-white/30 mt-1">{openingMatch.match_date?.split(' ')[0]}</div>
                    </div>
                    <div className="text-center">
                      <FlagImage teamName={openingMatch.away_team_name} size="lg" />
                      <div className="text-sm font-bold mt-2">{openingMatch.away_team_cn}</div>
                    </div>
                  </div>
                  <div className="text-[10px] text-white/25 mt-2">{openingMatch.stadium}</div>
                </Link>
              </div>
            ) : (
              <div className="w-full lg:w-auto lg:min-w-[320px]">
                <div className="glass-card text-center py-8">
                  <div className="text-sm text-white/30">等待赛程公布</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ===== Stats ===== */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 animate-stagger">
          {[
            { value: stats.totalTeams || 54, label: '参赛球队', icon: Globe, color: 'text-accent' },
            { value: stats.totalMatches || 136, label: '数据库比赛', icon: CalendarDays, color: 'text-gold' },
            { value: stats.upcoming2026Matches ?? 72, label: '2026即将开赛', icon: Zap, color: 'text-blue-400' },
            { value: stats.totalGoals || 172, label: '2022总进球', icon: Target, color: 'text-warning' },
            { value: stats.totalNews || 17, label: '新闻资讯', icon: Star, color: 'text-purple-400' }
          ].map((item, i) => (
            <div key={i} className="glass-card text-center group">
              <item.icon className={`w-5 h-5 ${item.color} mx-auto mb-2 opacity-60 group-hover:opacity-100 transition-opacity`} />
              <div className={`text-2xl md:text-3xl font-bold ${item.color}`}>{item.value}</div>
              <div className="text-[11px] text-white/40 mt-1 tracking-wide">{item.label}</div>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ===== Main Content ===== */}
        <div className="lg:col-span-2 space-y-6">

          {/* 2026 Upcoming */}
          {upcoming2026.length > 0 && (
            <section>
              <h2 className="section-title"><CalendarDays className="w-4 h-4" />2026世界杯 · 近期赛程</h2>
              <div className="space-y-2 animate-stagger">
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
            <h2 className="section-title"><Trophy className="w-4 h-4" />2022卡塔尔 · 经典回顾</h2>
            <div className="space-y-3 animate-stagger">
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
        <div className="space-y-5">
          {/* Top Scorers */}
          <section className="glass-card">
            <h2 className="section-title"><TrendingUp className="w-4 h-4" />2022射手榜</h2>
            <div className="space-y-1">
              {topScorers.slice(0, 6).map((s, i) => (
                <Link key={s.id} to={`/team/${s.team_id}`}
                  className="flex items-center gap-3 py-2 px-2 -mx-2 rounded-xl hover:bg-white/[0.04] transition-colors group">
                  <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-[11px] font-bold shrink-0 ${
                    i === 0 ? 'bg-gold text-dark shadow-lg shadow-gold/30' :
                    i === 1 ? 'bg-white/20 text-white' : 'bg-white/[0.04] text-white/30'
                  }`}>{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-semibold truncate group-hover:text-gold transition-colors">{s.player_name}</div>
                    <div className="text-[11px] text-white/35 flex items-center gap-1.5 mt-0.5">
                      <FlagImage teamName={s.team_name} size="sm" />{s.team_cn}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-lg font-bold text-gold">{s.goals}</div>
                    <div className="text-[9px] text-white/25">{s.assists}助攻</div>
                  </div>
                </Link>
              ))}
            </div>
          </section>

          {/* Latest News */}
          <section className="glass-card">
            <h2 className="section-title"><Globe className="w-4 h-4" />最新资讯</h2>
            <div className="space-y-3">
              {latestNews.slice(0, 6).map(n => (
                <Link key={n.id} to={`/news/${n.id}`} className="block group">
                  <h3 className="text-[13px] font-medium leading-snug group-hover:text-gold transition-colors line-clamp-2">{n.title}</h3>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-gold/10 text-gold/70 font-medium">
                      {n.category === 'match_report' ? '战报' : n.category === 'feature' ? '特写' : n.category === 'award' ? '奖项' : n.category === 'gossip' ? '花边' : n.category === 'transfer' ? '转会' : n.category === 'preview' ? '预告' : '新闻'}
                    </span>
                    <span className="text-[9px] text-white/20">{(n.published_at || '').split(' ')[0]}</span>
                  </div>
                </Link>
              ))}
            </div>
            <Link to="/news" className="block text-center text-xs text-gold/50 hover:text-gold mt-4 pt-3 border-t border-white/[0.04]">
              查看全部 →
            </Link>
          </section>

          {/* 2026 参赛队预览 */}
          <section className="glass-card">
            <h2 className="section-title"><Globe className="w-4 h-4" />2026参赛队</h2>
            <div className="grid grid-cols-4 gap-2">
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
