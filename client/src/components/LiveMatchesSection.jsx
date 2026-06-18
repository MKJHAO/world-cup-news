import { useState, useEffect } from 'react';
import { Zap } from 'lucide-react';
import LiveMatchCard from './LiveMatchCard';
import { getSocket } from '../hooks/useSocket';
import { matchAPI } from '../services/api';

export default function LiveMatchesSection() {
  const [liveMatches, setLiveMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  // 初始加载
  useEffect(() => {
    matchAPI.getLive()
      .then(d => {
        if (d.success) setLiveMatches(d.data || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // WebSocket 实时更新
  useEffect(() => {
    const s = getSocket();

    const handleUpdate = (updatedMatch) => {
      const isLive = ['live', 'first_half', 'halftime', 'second_half'].includes(updatedMatch.status);
      setLiveMatches(prev => {
        if (isLive) {
          const idx = prev.findIndex(m => m.id === updatedMatch.id);
          if (idx >= 0) return prev.map(m => m.id === updatedMatch.id ? { ...m, ...updatedMatch } : m);
          return [...prev, updatedMatch];
        } else {
          // 比赛已结束，从列表中移除
          return prev.filter(m => m.id !== updatedMatch.id);
        }
      });
    };

    s.on('match_updated', handleUpdate);

    // 定期刷新兜底
    const refreshInterval = setInterval(() => {
      matchAPI.getLive()
        .then(d => d.success && setLiveMatches(d.data || []))
        .catch(() => {});
    }, 60000);

    return () => {
      s.off('match_updated', handleUpdate);
      clearInterval(refreshInterval);
    };
  }, []);

  // 加载中或无数据时不渲染
  if (loading) return null;
  if (liveMatches.length === 0) return null;

  return (
    <section className="mb-6">
      <div className="flex items-center gap-2 mb-3">
        <Zap className="w-4 h-4 text-red-400" />
        <h2 className="text-sm font-bold text-white uppercase tracking-wider">🔥 正在直播</h2>
        <span className="w-2 h-2 rounded-full bg-red-500 animate-live-pulse ml-1" />
        <span className="text-[10px] text-red-400/60 ml-auto">{liveMatches.length}场进行中</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 animate-stagger">
        {liveMatches.map(m => (
          <LiveMatchCard key={m.id} match={m} />
        ))}
      </div>
    </section>
  );
}
