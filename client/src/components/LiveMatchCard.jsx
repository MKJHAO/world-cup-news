import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import FlagImage from './FlagImage';

const stageLabels = {
  group: '小组赛', round32: '1/16决赛', round16: '1/8决赛',
  quarter: '1/4决赛', semi: '半决赛', third: '季军赛', final: '决赛'
};

const statusLabels = {
  live: '开球', first_half: '', halftime: 'HT', second_half: ''
};

function MatchMinute({ match }) {
  const s = match.status;
  if (s === 'halftime') return <span className="text-xs text-warning font-bold">HT</span>;
  if (s === 'live' && (match.match_minute || 0) < 1) {
    return <span className="text-xs text-red-400 font-semibold animate-live-pulse">● 开球</span>;
  }
  const min = Math.floor(match.match_minute || 0);
  return <span className="text-xs text-red-400 font-semibold tabular-nums">{min}'</span>;
}

export default function LiveMatchCard({ match }) {
  const [flashHome, setFlashHome] = useState(false);
  const [flashAway, setFlashAway] = useState(false);
  const prevScore = useRef({ home: match.home_score || 0, away: match.away_score || 0 });

  useEffect(() => {
    const h = match.home_score || 0;
    const a = match.away_score || 0;
    if (h > prevScore.current.home) setFlashHome(true);
    if (a > prevScore.current.away) setFlashAway(true);
    prevScore.current = { home: h, away: a };
    const t = setTimeout(() => { setFlashHome(false); setFlashAway(false); }, 900);
    return () => clearTimeout(t);
  }, [match.home_score, match.away_score]);

  return (
    <Link
      to={`/match/${match.id}`}
      className="glass-card border-l-2 border-l-red-500 block match-card-hover group"
    >
      {/* 状态栏 */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-live-pulse" />
          <span className="text-[11px] text-red-400 font-semibold uppercase tracking-wider">
            ● LIVE
          </span>
          <MatchMinute match={match} />
        </div>
        <span className="text-[9px] text-white/20">
          {match.group_name ? `${match.group_name}组` : stageLabels[match.stage] || ''}
        </span>
      </div>

      {/* 比分 */}
      <div className="flex items-center justify-between">
        {/* 主队 */}
        <div className="flex items-center gap-3 flex-1 justify-end min-w-0">
          <div className="text-right min-w-0">
            <div className="font-bold text-sm md:text-base truncate">{match.home_team_cn}</div>
            <div className="text-[10px] text-white/25 truncate">{match.home_team_name}</div>
          </div>
          <FlagImage teamName={match.home_team_name} size="md" />
        </div>

        {/* 比分 */}
        <div className="mx-4 md:mx-6 text-center min-w-[80px]">
          <div className="flex items-center justify-center gap-2">
            <span className={`text-2xl md:text-3xl font-bold score-number transition-all duration-300 ${
              flashHome ? 'score-pop text-gold' :
              (match.home_score || 0) > (match.away_score || 0) ? 'text-white' : 'text-white/80'
            }`}>
              {match.home_score || 0}
            </span>
            <span className="text-white/15 text-lg">:</span>
            <span className={`text-2xl md:text-3xl font-bold score-number transition-all duration-300 ${
              flashAway ? 'score-pop text-gold' :
              (match.away_score || 0) > (match.home_score || 0) ? 'text-white' : 'text-white/80'
            }`}>
              {match.away_score || 0}
            </span>
          </div>
          {match.home_penalty > 0 && (
            <div className="text-[10px] text-white/25 mt-1">
              点球 {match.home_penalty}-{match.away_penalty}
            </div>
          )}
        </div>

        {/* 客队 */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <FlagImage teamName={match.away_team_name} size="md" />
          <div className="min-w-0">
            <div className="font-bold text-sm md:text-base truncate">{match.away_team_cn}</div>
            <div className="text-[10px] text-white/25 truncate">{match.away_team_name}</div>
          </div>
        </div>
      </div>

      {/* 底部信息 */}
      <div className="flex items-center justify-center gap-2 mt-3 text-[10px] text-white/20">
        <span>{match.stadium}</span>
        <span>·</span>
        <span>{match.match_date?.split(' ')[0]}</span>
      </div>
    </Link>
  );
}
