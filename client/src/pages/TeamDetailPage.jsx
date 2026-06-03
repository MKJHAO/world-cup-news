import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, ChevronRight, Shield, Shirt, Target, Swords, TrendingUp } from 'lucide-react';
import { teamAPI } from '../services/api';
import FlagImage from '../components/FlagImage';
import GossipPanel from '../components/GossipPanel';
import { ErrorState, LoadingSkeleton } from '../components/UIComponents';

const positionLabels = { GK: '门将', DF: '后卫', MF: '中场', FW: '前锋' };
const stageLabels = { group: '小组赛', round16: '1/8决赛', quarter: '1/4决赛', semi: '半决赛', third: '季军赛', final: '决赛' };

export default function TeamDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [team, setTeam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const [h2h, setH2h] = useState(null);
  const [opponents, setOpponents] = useState([]);
  const [selectedOpp, setSelectedOpp] = useState('');

  useEffect(() => {
    setError(false); setLoading(true); setH2h(null); setSelectedOpp('');
    teamAPI.getById(parseInt(id))
      .then(r => {
        setTeam(r.data);
        document.title = `${r.data.name_cn || r.data.name} - 球队详情`;
        return teamAPI.getAll({ limit: 100 });
      })
      .then(allTeams => {
        if (allTeams && allTeams.success) {
          setOpponents(allTeams.data.filter(t => t.id !== parseInt(id)));
        }
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [id]);

  const handleOpponentChange = async (oppId) => {
    setSelectedOpp(oppId);
    if (!oppId) { setH2h(null); return; }
    try {
      const res = await teamAPI.getH2H(parseInt(id), parseInt(oppId));
      setH2h(res.success ? res.data : null);
    } catch (e) { setH2h(null); }
  };

  if (loading) return <div className="max-w-4xl mx-auto py-10"><LoadingSkeleton count={4} /></div>;
  if (error) return <ErrorState message="加载失败，请稍后重试" onRetry={() => window.location.reload()} />;
  if (!team) return <ErrorState title="球队不存在" message="未找到该球队信息" />;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <button onClick={() => window.history.length > 1 ? navigate(-1) : navigate('/teams')} className="inline-flex items-center gap-1.5 text-white/35 hover:text-white/70 text-sm transition-colors">
        <ArrowLeft className="w-4 h-4" /> 返回
      </button>

      {/* Team Header */}
      <div className="glass-card text-center py-10 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1"
          style={{ background: `linear-gradient(90deg, ${team.color_primary}, ${team.color_secondary || team.color_primary})` }} />
        <div className="absolute inset-0 opacity-[0.02] pointer-events-none"
          style={{ backgroundImage: 'radial-gradient(circle at 30% 50%, white 1px, transparent 1px)', backgroundSize: '30px 30px' }} />

        <FlagImage teamName={team.name} size="lg" />
        <h1 className="text-3xl font-bold mt-4 tracking-tight">{team.name_cn}</h1>
        <p className="text-white/35 text-base mt-1">{team.name}</p>
        <div className="flex justify-center gap-2.5 mt-4 flex-wrap">
          <span className="text-[11px] px-3 py-1 rounded-full bg-gold/10 text-gold/80 font-semibold tracking-wide">{team.group_name} 组</span>
          <span className="text-[11px] px-3 py-1 rounded-full bg-white/[0.04] text-white/35">FIFA #{team.fifa_rank}</span>
          <span className="text-[11px] px-3 py-1 rounded-full bg-white/[0.04] text-white/35">👔 {team.coach}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Players */}
        <div className="md:col-span-2">
          <div className="glass-card">
            <h2 className="section-title"><Shirt className="w-4 h-4" />球员阵容</h2>
            {team.players?.length > 0 ? (
              <div className="space-y-0.5">
                {team.players.map(p => (
                  <div key={p.id} className="flex items-center gap-3.5 py-2.5 px-3 rounded-xl hover:bg-white/[0.03] transition-colors">
                    <span className="w-8 text-center font-bold text-gold text-sm">{p.number}</span>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-[13px]">{p.name_cn || p.name}</div>
                      {p.name !== p.name_cn && <div className="text-[11px] text-white/25">{p.name}</div>}
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-white/[0.05] text-white/35 font-medium">{positionLabels[p.position] || p.position}</span>
                    <span className="text-[11px] text-white/25 w-8 text-right">{p.age}岁</span>
                  </div>
                ))}
              </div>
            ) : <div className="text-center py-10 text-white/25">暂无球员数据</div>}
          </div>
        </div>

        {/* Odds link */}
        <div className="glass-card">
          <h2 className="section-title"><TrendingUp className="w-4 h-4" />赔率分析</h2>
          <Link to={`/analysis?team=${team.id}`}
            className="flex items-center justify-center gap-1.5 text-sm text-gold/60 hover:text-gold transition-colors py-2">
            查看{team.name_cn}完整赔率分析 <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Recent matches */}
        <div className="glass-card">
          <h2 className="section-title"><Target className="w-4 h-4" />近期战绩</h2>
          {team.recent_matches?.length > 0 ? (
            <div className="space-y-1.5">
              {team.recent_matches.map(m => (
                <Link key={m.id} to={`/match/${m.id}`} className="flex items-center justify-between py-2.5 px-3 rounded-xl hover:bg-white/[0.03] transition-colors">
                  <div className="flex items-center gap-2 min-w-0">
                    <FlagImage teamName={m.opponent_name} size="sm" />
                    <span className="text-[13px] text-white/60 truncate">{m.opponent_cn}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-bold score-number">
                      {m.venue === 'home' ? (
                        <><span className={m.home_score > m.away_score ? 'text-accent' : m.home_score < m.away_score ? 'text-danger/70' : 'text-white/50'}>{m.home_score}</span><span className="text-white/20 mx-0.5">-</span><span className="text-white/40">{m.away_score}</span></>
                      ) : (
                        <><span className="text-white/40">{m.away_score}</span><span className="text-white/20 mx-0.5">-</span><span className={m.away_score > m.home_score ? 'text-accent' : m.away_score < m.home_score ? 'text-danger/70' : 'text-white/50'}>{m.home_score}</span></>
                      )}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          ) : <div className="text-center py-10 text-white/25">暂无比赛数据</div>}
        </div>
      </div>

      {/* Gossip + H2H */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <GossipPanel teamId={parseInt(id)} teamName={team.name_cn} />
        <div className="glass-card">
          <h2 className="section-title"><Swords className="w-4 h-4" />历史交锋</h2>
        <div className="flex items-center gap-3 mb-4">
          <select
            className="bg-white/[0.04] text-white/80 border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-gold/50 flex-1 max-w-xs"
            value={selectedOpp}
            onChange={e => handleOpponentChange(e.target.value)}
          >
            <option value="" className="bg-dark">选择对手球队...</option>
            {opponents.map(t => (
              <option key={t.id} value={t.id} className="bg-dark">{t.name_cn} ({t.name})</option>
            ))}
          </select>
        </div>

        {h2h ? (
          <div>
            <div className="grid grid-cols-3 gap-4 mb-4 text-center">
              <div>
                <div className="text-sm font-bold text-white/80">{h2h.summary.teamA.name}</div>
                <div className="text-2xl font-bold text-gold mt-1">{h2h.summary.teamA.wins}</div>
                <div className="text-[10px] text-white/25">胜</div>
              </div>
              <div>
                <div className="text-[10px] text-white/20 mt-3">交手 {h2h.summary.total} 次</div>
                <div className="text-lg font-bold text-white/30 mt-1">{h2h.summary.teamA.wins + h2h.summary.teamA.draws + h2h.summary.teamA.losses}</div>
              </div>
              <div>
                <div className="text-sm font-bold text-white/80">{h2h.summary.teamB.name}</div>
                <div className="text-2xl font-bold text-white/60 mt-1">{h2h.summary.teamB.wins}</div>
                <div className="text-[10px] text-white/25">胜</div>
              </div>
            </div>
            {/* Win/Loss bar */}
            <div className="flex h-2 rounded-full overflow-hidden mb-4">
              {h2h.summary.teamA.wins > 0 && (
                <div className="bg-gold" style={{ width: `${(h2h.summary.teamA.wins / h2h.summary.total) * 100}%` }} />
              )}
              {h2h.summary.teamA.draws > 0 && (
                <div className="bg-white/20" style={{ width: `${(h2h.summary.teamA.draws / h2h.summary.total) * 100}%` }} />
              )}
              {h2h.summary.teamA.losses > 0 && (
                <div className="bg-white/10" style={{ width: `${(h2h.summary.teamA.losses / h2h.summary.total) * 100}%` }} />
              )}
            </div>
            {h2h.recent.length > 0 && (
              <div>
                <div className="text-[10px] text-white/25 uppercase tracking-wider mb-2">近期交锋</div>
                <div className="space-y-1">
                  {h2h.recent.map(m => (
                    <Link key={m.id} to={`/match/${m.id}`}
                      className="flex items-center gap-3 py-2 px-3 rounded-xl hover:bg-white/[0.03] transition-colors text-sm">
                      <span className="text-white/60">{m.home_name}</span>
                      <span className="font-bold text-white/80">{m.home_score} - {m.away_score}</span>
                      <span className="text-white/60">{m.away_name}</span>
                      <span className="text-[10px] text-white/20 ml-auto">{m.match_date}</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : selectedOpp ? (
          <div className="text-center py-6 text-sm text-white/25">暂无交锋记录</div>
        ) : (
          <div className="text-center py-6 text-sm text-white/20">选择一支球队查看历史交锋记录</div>
        )}
        </div>
      </div>
    </div>
  );
}
