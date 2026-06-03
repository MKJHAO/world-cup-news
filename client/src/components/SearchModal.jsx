import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Search, X, Hash, Shield, CalendarDays } from 'lucide-react';
import FlagImage from './FlagImage';

export default function SearchModal({ open, onClose }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState({ teams: [], matches: [] });
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (open) {
      setQuery('');
      setResults({ teams: [], matches: [] });
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  useEffect(() => {
    if (query.length < 2) { setResults({ teams: [], matches: [] }); return; }
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const [teamsRes, matchesRes] = await Promise.all([
          fetch(`/api/teams?search=${encodeURIComponent(query)}&limit=5`).then(r => r.json()),
          fetch(`/api/matches?search=${encodeURIComponent(query)}&limit=5`).then(r => r.json())
        ]);
        setResults({
          teams: teamsRes.success ? teamsRes.data.slice(0, 5) : [],
          matches: matchesRes.success ? matchesRes.data.slice(0, 5) : []
        });
      } catch (e) { /* ignore */ }
      setLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  if (!open) return null;

  const hasResults = results.teams.length > 0 || results.matches.length > 0;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh]" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="relative w-full max-w-lg mx-4 bg-card border border-white/[0.08] rounded-2xl shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-3 px-4 py-3 border-b border-white/[0.04]">
          <Search className="w-4 h-4 text-white/30" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="搜索球队、比赛..."
            className="flex-1 bg-transparent text-sm text-white placeholder-white/25 outline-none"
          />
          <button onClick={onClose} className="text-white/30 hover:text-white/60 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="max-h-[50vh] overflow-y-auto">
          {loading && (
            <div className="py-8 text-center text-sm text-white/25">搜索中...</div>
          )}
          {!loading && query.length >= 2 && !hasResults && (
            <div className="py-8 text-center text-sm text-white/25">没有找到相关内容</div>
          )}
          {!loading && query.length < 2 && (
            <div className="py-8 text-center text-sm text-white/20">输入至少2个字符开始搜索</div>
          )}

          {results.teams.length > 0 && (
            <div className="p-2">
              <div className="text-[10px] uppercase tracking-wider text-white/20 px-2 py-1.5">球队</div>
              {results.teams.map(t => (
                <Link key={t.id} to={`/team/${t.id}`} onClick={onClose}
                  className="flex items-center gap-3 px-2 py-2.5 rounded-xl hover:bg-white/[0.04] transition-colors">
                  <FlagImage teamName={t.name} size="sm" />
                  <span className="text-sm font-medium text-white/80">{t.name_cn}</span>
                  <span className="text-xs text-white/25 ml-auto">{t.group_name ? `${t.group_name}组` : ''}</span>
                </Link>
              ))}
            </div>
          )}

          {results.matches.length > 0 && (
            <div className="p-2 border-t border-white/[0.04]">
              <div className="text-[10px] uppercase tracking-wider text-white/20 px-2 py-1.5">比赛</div>
              {results.matches.map(m => (
                <Link key={m.id} to={`/match/${m.id}`} onClick={onClose}
                  className="flex items-center gap-3 px-2 py-2.5 rounded-xl hover:bg-white/[0.04] transition-colors">
                  <span className="text-sm font-medium text-white/80">{m.home_team_cn}</span>
                  <span className="text-xs text-white/20">vs</span>
                  <span className="text-sm font-medium text-white/80">{m.away_team_cn}</span>
                  <span className="text-[10px] text-white/25 ml-auto">{m.match_date}</span>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="px-4 py-2 border-t border-white/[0.04] text-center">
          <kbd className="text-[9px] text-white/15">ESC 关闭</kbd>
        </div>
      </div>
    </div>
  );
}
