import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getSocket } from '../hooks/useSocket';

export default function LiveTicker() {
  const [matches, setMatches] = useState([]);
  const [mode, setMode] = useState('scheduled');

  useEffect(() => {
    // 优先加载进行中的比赛
    fetch('/api/matches/live').then(r => r.json())
      .then(d => {
        if (d.success && d.data.length > 0) {
          setMatches(d.data);
          setMode('live');
        } else {
          return fetch('/api/matches?status=scheduled&limit=20').then(r => r.json())
            .then(d2 => {
              if (d2.success) {
                const upcoming = (d2.data || []).filter(m => (m.match_date || '').startsWith('2026')).slice(0, 10);
                setMatches(upcoming);
                setMode('scheduled');
              }
            });
        }
      })
      .catch(() => {});
  }, []);

  // WebSocket 实时更新
  useEffect(() => {
    const s = getSocket();
    const handler = (updated) => {
      const isLive = ['live','first_half','halftime','second_half'].includes(updated.status);
      if (isLive) {
        setMode('live');
        setMatches(prev => {
          const idx = prev.findIndex(m => m.id === updated.id);
          return idx >= 0 ? prev.map(m => m.id === updated.id ? {...m,...updated} : m) : [updated, ...prev].slice(0, 10);
        });
      } else if (updated.status === 'completed') {
        setMatches(prev => prev.filter(m => m.id !== updated.id));
      }
    };
    s.on('match_updated', handler);
    return () => s.off('match_updated', handler);
  }, []);

  if (matches.length === 0) return null;

  return (
    <div className="glass-card py-2.5 px-4 overflow-hidden relative">
      <div className="flex items-center gap-3">
        <div className={`flex items-center gap-1.5 shrink-0 text-xs font-semibold pr-3 border-r border-white/[0.06] ${mode === 'live' ? 'text-red-400' : 'text-accent'}`}>
          <span className={`w-1.5 h-1.5 rounded-full animate-live-pulse ${mode === 'live' ? 'bg-red-500' : 'bg-accent'}`} />
          {mode === 'live' ? 'LIVE' : '即将开始'}
        </div>
        <div className="overflow-hidden flex-1 relative h-5">
          <div className="flex gap-8 animate-marquee whitespace-nowrap hover:[animation-play-state:paused]" style={{ animationDuration: `${Math.max(matches.length * 3, 15)}s` }}>
            {[...matches, ...matches].map((m, i) => (
              <Link key={`${m.id}-${i}`} to={`/match/${m.id}`} className="text-xs text-white/50 hover:text-gold transition-colors inline-flex items-center gap-2 shrink-0">
                <span className="text-white/70">{m.home_team_cn}</span>
                {mode === 'live' ? (
                  <span className="text-red-400 font-bold tabular-nums">{m.home_score||0}-{m.away_score||0}</span>
                ) : (
                  <span className="text-white/15">VS</span>
                )}
                <span className="text-white/70">{m.away_team_cn}</span>
                {mode === 'live' ? (
                  <span className="text-red-400/60 text-[10px] font-mono">{m.status==='halftime'?'HT':Math.floor(m.match_minute||0)+'\''}</span>
                ) : (
                  <span className="text-white/20">{(m.match_date||'').split(' ')[1]?.slice(0,5)}</span>
                )}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
