import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, Filter, MapPin, ChevronRight } from 'lucide-react';
import useAppStore from '../stores/appStore';
import FlagImage from '../components/FlagImage';

const stageLabels = { group: '小组赛', round16: '1/8决赛', quarter: '1/4决赛', semi: '半决赛', third: '季军赛', final: '决赛', round32: '1/16决赛' };
const statusLabels = { scheduled: '未开始', live: '● LIVE', first_half: '上半场', second_half: '下半场', halftime: '中场', completed: '已结束' };
const allGroups = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];

export default function MatchesPage() {
  const { matches, matchesLoading, matchDates, fetchMatches, fetchMatchDates } = useAppStore();
  const [filter, setFilter] = useState({ group: '', stage: '' });
  const [tournament, setTournament] = useState('2026');

  useEffect(() => { fetchMatches({ tournament, limit: 100 }); fetchMatchDates(); }, [tournament]);

  const groups = tournament === '2026' ? allGroups : allGroups.slice(0, 8);

  const filtered = useMemo(() => {
    let result = [...matches];
    if (filter.group) result = result.filter(m => m.group_name === filter.group);
    if (filter.stage) result = result.filter(m => m.stage === filter.stage);
    return result;
  }, [matches, filter]);

  const groupedByDate = useMemo(() => {
    const map = {};
    filtered.forEach(m => {
      const date = (m.match_date || '').split(' ')[0];
      if (!map[date]) map[date] = [];
      map[date].push(m);
    });
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b));
  }, [filtered]);

  const knockoutStages = ['round16', 'quarter', 'semi', 'third', 'final'];
  const bracketMatches = matches.filter(m => knockoutStages.includes(m.stage));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-3">
          <CalendarDays className="w-6 h-6 text-gold" />
          赛程与结果
        </h1>
        {/* Tournament switcher */}
        <div className="flex gap-1">
          {['2026', '2022'].map(y => (
            <button key={y} onClick={() => setTournament(y)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                tournament === y ? 'bg-gold text-dark shadow-lg shadow-gold/20' : 'glass-card !py-2 text-white/40 hover:text-white/80'
              }`}>{y === '2026' ? '2026 世界杯' : '2022 卡塔尔'}</button>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="glass-card flex flex-wrap gap-3 items-center">
        <Filter className="w-4 h-4 text-white/40" />
        <select className="bg-white/[0.04] text-white/80 border border-white/[0.08] rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:border-gold/50"
          value={filter.stage} onChange={e => setFilter(f => ({ ...f, stage: e.target.value }))}>
          <option value="" className="bg-dark">全部阶段</option>
          {Object.entries(stageLabels).map(([k, v]) => <option key={k} value={k} className="bg-dark">{v}</option>)}
        </select>
        <select className="bg-white/[0.04] text-white/80 border border-white/[0.08] rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:border-gold/50"
          value={filter.group} onChange={e => setFilter(f => ({ ...f, group: e.target.value }))}>
          <option value="" className="bg-dark">全部小组</option>
          {groups.map(g => <option key={g} value={g} className="bg-dark">{g} 组</option>)}
        </select>
        {(filter.group || filter.stage) && (
          <button className="text-xs text-white/40 hover:text-white transition-colors"
            onClick={() => setFilter({ group: '', stage: '' })}>清除</button>
        )}
      </div>

      {matchesLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => <div key={i} className="glass-card h-20 shimmer rounded-2xl" />)}
        </div>
      ) : (
        <div className="space-y-8">
          {groupedByDate.map(([date, dateMatches]) => (
            <section key={date}>
              <h2 className="sticky top-14 bg-dark/95 backdrop-blur-sm py-2 z-10 text-sm font-bold text-gold/80 tracking-wider">
                📅 {date}
              </h2>
              <div className="space-y-2 mt-2">
                {dateMatches.map(m => <MatchCard key={m.id} match={m} />)}
              </div>
            </section>
          ))}

          {bracketMatches.length > 0 && (filter.stage === '' || knockoutStages.includes(filter.stage)) && (
            <section>
              <h2 className="text-sm font-bold text-gold/80 tracking-wider mb-3">🏆 淘汰赛</h2>
              <div className="space-y-2">
                {bracketMatches.map(m => <MatchCard key={m.id} match={m} />)}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}

function MatchCard({ match: m }) {
  const getScore = () => {
    if (m.status === 'scheduled') return null;
    let score = `${m.home_score} - ${m.away_score}`;
    if (m.home_penalty > 0 || m.away_penalty > 0) score += ` (点 ${m.home_penalty}-${m.away_penalty})`;
    return score;
  };

  const score = getScore();
  const isLive = ['live', 'first_half', 'second_half'].includes(m.status);

  return (
    <Link to={`/match/${m.id}`} className="glass-card block match-card-hover">
      <div className="flex items-center">
        {/* Home */}
        <div className="flex items-center gap-3 flex-1 justify-end min-w-0">
          <div className="text-right min-w-0">
            <div className="font-bold text-sm truncate">{m.home_team_cn}</div>
            <div className="text-[10px] text-white/30 truncate">{m.home_team_name}</div>
          </div>
          <FlagImage teamName={m.home_team_name} size="md" />
        </div>

        {/* Score */}
        <div className="mx-5 text-center min-w-[90px]">
          {score ? (
            <>
              <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-medium ${
                isLive ? 'bg-red-600/20 text-red-400 animate-live-pulse' :
                m.status === 'completed' ? 'bg-white/[0.06] text-white/40' :
                'bg-accent/15 text-accent'
              }`}>{statusLabels[m.status]}</span>
              <div className={`text-xl font-bold score-number mt-1.5 tracking-tight ${isLive ? 'text-red-400' : ''}`}>
                <span className={m.home_score > m.away_score ? 'text-white' : 'text-white/60'}>{m.home_score}</span>
                <span className="text-white/25 mx-1.5">-</span>
                <span className={m.away_score > m.home_score ? 'text-white' : 'text-white/60'}>{m.away_score}</span>
              </div>
              {(m.home_penalty > 0 || m.away_penalty > 0) && (
                <div className="text-[10px] text-white/30 mt-0.5">点 {m.home_penalty}-{m.away_penalty}</div>
              )}
            </>
          ) : (
            <>
              <span className="badge-upcoming">未开始</span>
              <div className="text-base font-bold text-white/25 mt-1.5">VS</div>
            </>
          )}
          <div className="text-[10px] text-white/25 mt-1">
            {m.group_name ? `${m.group_name}组` : stageLabels[m.stage]}
            <span className="mx-1">·</span>
            {(m.match_date || '').split(' ')[1]?.slice(0, 5)}
          </div>
        </div>

        {/* Away */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <FlagImage teamName={m.away_team_name} size="md" />
          <div className="min-w-0">
            <div className="font-bold text-sm truncate">{m.away_team_cn}</div>
            <div className="text-[10px] text-white/30 truncate">{m.away_team_name}</div>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-center gap-2 mt-2.5 text-[10px] text-white/20">
        <MapPin className="w-3 h-3" />{m.stadium}
        {m.attendance > 0 && <span>· {m.attendance.toLocaleString()} 人</span>}
      </div>
    </Link>
  );
}
