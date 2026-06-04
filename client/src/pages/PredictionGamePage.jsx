import { useEffect, useState } from 'react';
import { Swords, Trophy, Users, Loader2 } from 'lucide-react';
import { matchAPI, predictionGameAPI } from '../services/api';
import useAppStore from '../stores/appStore';
import useUserStore from '../stores/userStore';
import PredictionForm from '../components/PredictionForm';
import Leaderboard from '../components/Leaderboard';
import GroupManager from '../components/GroupManager';
import FlagImage from '../components/FlagImage';
import UserRegisterModal from '../components/UserRegisterModal';

export default function PredictionGamePage() {
  const [tab, setTab] = useState('predict');
  const [matches, setMatches] = useState([]);
  const [myPredictions, setMyPredictions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const { user, isLoggedIn } = useUserStore();

  useEffect(() => {
    setLoading(true);
    // 获取所有比赛和我的预测
    Promise.all([
      matchAPI.getAll({ tournament: '2026' }).catch(() => ({ success: false })),
      isLoggedIn ? predictionGameAPI.getMy().catch(() => ({ success: false })) : Promise.resolve({ success: true, data: [] })
    ]).then(([matchRes, predRes]) => {
      if (matchRes.success) {
        // 按日期排序，优先显示未来比赛
        const list = (matchRes.data || []).sort((a, b) => new Date(a.match_date) - new Date(b.match_date));
        setMatches(list);
      }
      if (predRes.success) {
        setMyPredictions(predRes.data || []);
      }
      setLoading(false);
    });
  }, [isLoggedIn]);

  const tabs = [
    { value: 'predict', label: '预测', icon: Swords },
    { value: 'leaderboard', label: '排行榜', icon: Trophy },
    { value: 'groups', label: '群组', icon: Users }
  ];

  // 创建预测映射表：match_id -> prediction
  const predMap = {};
  myPredictions.forEach(p => { predMap[p.match_id] = p; });

  const getMatchStatus = (match) => {
    if (match.status === 'completed') return 'completed';
    if (match.status === 'live') return 'live';
    const matchTime = new Date(match.match_date);
    const deadline = new Date(matchTime.getTime() - 15 * 60 * 1000);
    return Date.now() > deadline ? 'locked' : 'open';
  };

  const statusLabels = {
    open: { text: '可预测', cls: 'text-accent bg-accent/10' },
    locked: { text: '已截止', cls: 'text-warning bg-warning/10' },
    live: { text: '进行中', cls: 'text-danger bg-danger/10' },
    completed: { text: '已结束', cls: 'text-white/30 bg-white/5' }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <UserRegisterModal />

      {/* 用户信息 */}
      {isLoggedIn && user && (
        <div className="glass-card p-4 mb-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gold/15 flex items-center justify-center">
              <span className="text-gold font-bold text-lg">{(user.nickname || '?')[0]}</span>
            </div>
            <div>
              <p className="text-white font-semibold">{user.nickname}</p>
              <p className="text-xs text-white/40">
                {user.predictions_count || 0} 次预测 · 准确率 {user.accuracy || 0}%
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-gold text-2xl font-bold">{user.total_points || 0}</p>
            <p className="text-xs text-white/30">总积分</p>
          </div>
        </div>
      )}

      {/* Tab切换 */}
      <div className="flex gap-1 mb-5 p-1 bg-white/5 rounded-xl">
        {tabs.map(t => {
          const Icon = t.icon;
          return (
            <button
              key={t.value}
              onClick={() => setTab(t.value)}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-all ${
                tab === t.value ? 'bg-gold text-dark shadow-lg' : 'text-white/40 hover:text-white/70'
              }`}
            >
              <Icon size={16} /> {t.label}
            </button>
          );
        })}
      </div>

      {/* 预测Tab */}
      {tab === 'predict' && (
        loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={32} className="animate-spin text-gold" />
          </div>
        ) : matches.length === 0 ? (
          <div className="text-center py-20 text-white/30">
            <Swords size={48} className="mx-auto mb-3 opacity-30" />
            <p>暂无比赛数据</p>
          </div>
        ) : (
          <div className="space-y-2">
            {matches.map(match => {
              const status = getMatchStatus(match);
              const pred = predMap[match.id];
              const st = statusLabels[status];
              return (
                <div
                  key={match.id}
                  className={`glass-card p-4 transition-all ${
                    status === 'open' ? 'cursor-pointer hover:border-gold/20' : 'opacity-50'
                  }`}
                  onClick={() => status === 'open' && setSelectedMatch(match)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="text-center min-w-[60px]">
                        <FlagImage teamName={match._homeTeam?.name} size="sm" />
                        <p className="text-white text-xs mt-0.5 truncate max-w-[60px]">{match._homeTeam?.name_cn || match._homeTeam?.name}</p>
                      </div>
                      <div className="text-center">
                        {status === 'completed' ? (
                          <span className="text-white font-bold text-lg font-mono">{match.home_score}-{match.away_score}</span>
                        ) : (
                          <span className="text-white/30 text-lg">vs</span>
                        )}
                        <p className="text-[10px] text-white/20">{match.group_name ? `${match.group_name}组` : ''} {match.stage === 'group' ? '' : match.stage}</p>
                      </div>
                      <div className="text-center min-w-[60px]">
                        <FlagImage teamName={match._awayTeam?.name} size="sm" />
                        <p className="text-white text-xs mt-0.5 truncate max-w-[60px]">{match._awayTeam?.name_cn || match._awayTeam?.name}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {pred && (
                        <div className="text-right">
                          <p className="text-gold text-sm font-bold font-mono">{pred.predicted_home_score}-{pred.predicted_away_score}</p>
                          <p className="text-[10px] text-white/30">
                            {pred.predicted_result === 'home' ? '主胜' : pred.predicted_result === 'draw' ? '平局' : '客胜'}
                          </p>
                        </div>
                      )}
                      <span className={`text-[10px] px-2 py-0.5 rounded-full ${st.cls}`}>{st.text}</span>
                    </div>
                  </div>

                  {/* 预测得分展示 */}
                  {pred && pred.points_earned > 0 && (
                    <div className="mt-2 pt-2 border-t border-white/5 text-right">
                      <span className="text-xs text-accent">+{pred.points_earned}分</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )
      )}

      {/* 排行榜Tab */}
      {tab === 'leaderboard' && <Leaderboard />}

      {/* 群组Tab */}
      {tab === 'groups' && <GroupManager />}

      {/* 预测弹窗 */}
      {selectedMatch && (
        <PredictionForm
          match={selectedMatch}
          onClose={() => setSelectedMatch(null)}
          onSuccess={(pred) => {
            setMyPredictions(prev => {
              const idx = prev.findIndex(p => p.match_id === pred.match_id);
              if (idx >= 0) {
                const updated = [...prev];
                updated[idx] = pred;
                return updated;
              }
              return [...prev, pred];
            });
          }}
        />
      )}
    </div>
  );
}
