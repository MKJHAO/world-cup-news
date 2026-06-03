import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Zap } from 'lucide-react';

export default function LiveTicker() {
  const [matches, setMatches] = useState([]);

  useEffect(() => {
    fetch('/api/matches?status=scheduled&limit=20').then(r => r.json())
      .then(d => d.success && setMatches(d.data.filter(m => (m.match_date || '').startsWith('2026')).slice(0, 10)))
      .catch(() => {});
  }, []);

  if (matches.length === 0) return null;

  return (
    <div className="glass-card py-2.5 px-4 overflow-hidden relative">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 shrink-0 text-accent text-xs font-semibold pr-3 border-r border-white/[0.06]">
          <span className="w-1.5 h-1.5 rounded-full bg-accent animate-live-pulse" />
          即将开始
        </div>
        <div className="overflow-hidden flex-1 relative h-5">
          <div className="flex gap-8 animate-marquee whitespace-nowrap hover:[animation-play-state:paused]" style={{ animationDuration: `${matches.length * 3}s` }}>
            {[...matches, ...matches].map((m, i) => (
              <Link key={`${m.id}-${i}`} to={`/match/${m.id}`}
                className="text-xs text-white/50 hover:text-gold transition-colors inline-flex items-center gap-2 shrink-0">
                <span className="text-white/70">{m.home_team_cn}</span>
                <span className="text-white/15">VS</span>
                <span className="text-white/70">{m.away_team_cn}</span>
                <span className="text-white/20">{(m.match_date || '').split(' ')[1]?.slice(0, 5)}</span>
                <Zap className="w-2.5 h-2.5 text-white/10" />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
