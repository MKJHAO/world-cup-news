import { useEffect, useState } from 'react';
import { Trophy, Medal, User } from 'lucide-react';
import { predictionGameAPI } from '../services/api';
import useUserStore from '../stores/userStore';

export default function Leaderboard({ groupId }) {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [type, setType] = useState('all_time');
  const { user } = useUserStore();

  useEffect(() => {
    setLoading(true);
    const fetchData = groupId
      ? predictionGameAPI.getGroup(groupId).then(r => r.success ? (r.data?.members ? r.data : { ...r.data, leaderboard: [] }) : { leaderboard: [] })
      : predictionGameAPI.getLeaderboard(type);

    fetchData.then(data => {
      const list = groupId ? data.leaderboard || [] : (data.success !== false ? (data.data || []) : []);
      setLeaderboard(list);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [type, groupId]);

  const rankIcons = {
    1: <Trophy size={18} className="text-yellow-400" />,
    2: <Medal size={18} className="text-gray-300" />,
    3: <Medal size={18} className="text-amber-600" />
  };

  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-12 shimmer rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div>
      {/* 类型切换（全局榜） */}
      {!groupId && (
        <div className="flex gap-1 mb-4 p-1 bg-white/5 rounded-lg">
          {[
            { value: 'all_time', label: '总榜' },
            { value: 'weekly', label: '周榜' }
          ].map(t => (
            <button
              key={t.value}
              onClick={() => setType(t.value)}
              className={`flex-1 py-1.5 rounded-md text-sm font-medium transition-all ${
                type === t.value ? 'bg-gold text-dark' : 'text-white/40 hover:text-white/70'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      )}

      {/* 排行榜列表 */}
      {leaderboard.length === 0 ? (
        <div className="text-center py-10 text-white/30">
          <Trophy size={40} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">暂无排行数据</p>
          <p className="text-xs mt-1">提交预测后即可上榜</p>
        </div>
      ) : (
        <div className="space-y-1">
          {/* 表头 */}
          <div className="flex items-center px-3 py-2 text-xs text-white/30 font-medium">
            <span className="w-10">#</span>
            <span className="flex-1">昵称</span>
            <span className="w-16 text-right">积分</span>
            <span className="w-12 text-right">准确率</span>
          </div>

          {leaderboard.map((entry, i) => {
            const isMe = user && entry.id === user.id;
            const rank = entry.rank || i + 1;
            return (
              <div
                key={entry.id}
                className={`flex items-center px-3 py-2.5 rounded-xl transition-all ${
                  isMe ? 'bg-gold/10 border border-gold/20' : 'hover:bg-white/[0.02]'
                } ${rank <= 3 ? 'bg-white/[0.03]' : ''}`}
              >
                <span className="w-10 flex items-center gap-1.5">
                  {rankIcons[rank] || <span className="text-white/40 text-sm font-mono ml-1">{rank}</span>}
                </span>
                <span className="flex-1 flex items-center gap-2">
                  <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                    rank === 1 ? 'bg-yellow-400/20 text-yellow-400' :
                    rank === 2 ? 'bg-gray-300/20 text-gray-300' :
                    rank === 3 ? 'bg-amber-600/20 text-amber-600' :
                    'bg-white/10 text-white/50'
                  }`}>
                    {(entry.nickname || '?')[0]}
                  </span>
                  <span className={`text-sm ${isMe ? 'text-gold font-semibold' : 'text-white/80'}`}>
                    {entry.nickname}
                    {isMe && <span className="text-[10px] text-gold/60 ml-1">(你)</span>}
                  </span>
                </span>
                <span className="w-16 text-right text-sm font-bold text-gold font-mono">
                  {entry.points || 0}
                </span>
                <span className="w-12 text-right text-xs text-white/40">
                  {entry.accuracy || 0}%
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
