import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MessageCircle, TrendingUp, ChevronRight } from 'lucide-react';

export default function GossipPanel({ teamId, teamName }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/gossip/team/${teamId}`).then(r => r.json())
      .then(d => d.success && setStats(d.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [teamId]);

  if (loading) return null;
  if (!stats || stats.teamGossipCount === 0) return null;

  const levelDots = Array.from({ length: 5 }, (_, i) => i < stats.gossipLevel);

  return (
    <div className="glass-card">
      <h2 className="section-title">
        <MessageCircle className="w-4 h-4" />花边指数
      </h2>

      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1">
          {levelDots.map((active, i) => (
            <div key={i} className={`w-2 h-2 rounded-full ${active ? 'bg-pink-400' : 'bg-white/[0.08]'}`} />
          ))}
        </div>
        <span className="text-[10px] text-white/25">{stats.teamGossipCount}条花边 · 占比{stats.gossipRate}%</span>
      </div>

      {stats.recentGossip?.length > 0 && (
        <div className="space-y-1.5">
          {stats.recentGossip.slice(0, 4).map(g => (
            <Link key={g.id} to={`/news/${g.id}`}
              className="flex items-center gap-2 py-1.5 px-2 -mx-2 rounded-lg hover:bg-white/[0.04] transition-colors group">
              <span className="w-1 h-1 rounded-full bg-pink-400/60 shrink-0" />
              <span className="text-[12px] text-white/50 truncate group-hover:text-white/80 transition-colors">{g.title}</span>
            </Link>
          ))}
        </div>
      )}

      <Link to={`/news?category=gossip`}
        className="flex items-center justify-center gap-1 text-[10px] text-pink-400/60 hover:text-pink-400 mt-3 pt-3 border-t border-white/[0.04] transition-colors">
        查看全部花边 <ChevronRight className="w-3 h-3" />
      </Link>
    </div>
  );
}
