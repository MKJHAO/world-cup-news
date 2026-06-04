import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Target, Zap, Shield, AlertTriangle, ArrowLeft, BarChart3, Loader2, X } from 'lucide-react';
import { predictionAPI } from '../services/api';
import FlagImage from '../components/FlagImage';

export default function PredictionPage() {
  const navigate = useNavigate();
  const [sandbox, setSandbox] = useState(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [teamPred, setTeamPred] = useState(null);
  const [teamRadar, setTeamRadar] = useState(null);
  const [detailError, setDetailError] = useState(null);
  const [view, setView] = useState('sandbox');

  useEffect(() => {
    predictionAPI.getSandbox()
      .then(r => { console.log('Sandbox API response:', r); setSandbox(r.success ? r.data : null); })
      .catch(err => console.error('Sandbox API error:', err))
      .finally(() => setLoading(false));
  }, []);

  const handleTeamClick = async (teamId) => {
    if (selectedTeam === teamId) {
      setSelectedTeam(null);
      setTeamPred(null);
      setTeamRadar(null);
      setDetailError(null);
      return;
    }
    setSelectedTeam(teamId);
    setTeamPred(null);
    setTeamRadar(null);
    setDetailError(null);
    setDetailLoading(true);

    console.log('handleTeamClick:', teamId);
    try {
      const [predRes, radarRes] = await Promise.all([
        predictionAPI.getTeam(teamId),
        predictionAPI.getRadar(teamId)
      ]);
      console.log('getTeam response:', predRes);
      console.log('getRadar response:', radarRes);

      const predData = predRes?.success !== false ? (predRes?.data || predRes) : null;
      const radarData = radarRes?.success !== false ? (radarRes?.data || radarRes) : null;

      console.log('predData:', predData);
      console.log('radarData:', radarData);

      setTeamPred(predData);
      setTeamRadar(radarData);
      if (!predData) setDetailError('未能获取预测数据');
    } catch (err) {
      console.error('加载球队详情失败:', err);
      setDetailError(err.message || '网络请求失败');
    } finally {
      setDetailLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-3">
          <Target className="w-6 h-6 text-gold" /> 2026胜率沙盘
        </h1>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[...Array(12)].map((_, i) => (
            <div key={i} className="glass-card h-40 shimmer rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  const selectedTeamInfo = selectedTeam
    ? sandbox?.groups?.flatMap(g => g.teams).find(t => t.id === selectedTeam)
    : null;

  return (
    <div className="space-y-6 landscape:space-y-2">
      <button onClick={() => window.history.length > 1 ? navigate(-1) : navigate('/')} className="inline-flex items-center gap-1.5 text-white/35 hover:text-white/70 text-sm landscape:text-[11px] transition-colors landscape:hidden">
        <ArrowLeft className="w-4 h-4" /> 返回
      </button>

      <div className="flex items-center justify-between flex-wrap gap-3 landscape:gap-1.5">
        <h1 className="text-2xl landscape:text-lg font-bold tracking-tight flex items-center gap-3 landscape:gap-1.5">
          <Target className="w-6 h-6 landscape:w-4 landscape:h-4 text-gold" /> 2026胜率沙盘
        </h1>
        <div className="flex gap-1">
          {[
            { key: 'sandbox', label: '小组沙盘', icon: Shield },
            { key: 'rankings', label: '实力排名', icon: BarChart3 }
          ].map(({ key, label, icon: Icon }) => (
            <button key={key} onClick={() => setView(key)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                view === key ? 'bg-gold text-dark shadow-lg shadow-gold/20' : 'glass-card !py-2 text-white/40 hover:text-white/80'
              }`}>
              <Icon className="w-4 h-4" /> {label}
            </button>
          ))}
        </div>
      </div>

      {/* 预测摘要横幅 */}
      {sandbox?.prediction && (
        <div className="glass-card landscape:!p-3 border-glow" style={{ background: 'linear-gradient(135deg, rgba(196,146,46,0.08), rgba(196,146,46,0.02))' }}>
          <div className="flex flex-wrap items-center justify-center gap-6 md:gap-12 landscape:gap-4 text-center">
            <div>
              <div className="text-[10px] uppercase tracking-[0.2em] text-white/30 mb-2">预测冠军</div>
              <div className="flex items-center gap-2 justify-center">
                <FlagImage teamName={sandbox.prediction.champion?.name} size="md" />
                <div>
                  <div className="text-lg font-bold text-gold">{sandbox.prediction.champion?.name_cn}</div>
                  <div className="text-[10px] text-white/40">实力指数 {sandbox.prediction.champion?.strength}</div>
                </div>
              </div>
            </div>
            <div className="w-px h-10 bg-white/[0.08] hidden md:block" />
            <div>
              <div className="text-[10px] uppercase tracking-[0.2em] text-white/30 mb-2">黑马球队</div>
              <div className="flex items-center gap-2 justify-center">
                <FlagImage teamName={sandbox.prediction.darkHorse?.name} size="md" />
                <div>
                  <div className="text-lg font-bold text-accent">{sandbox.prediction.darkHorse?.name_cn}</div>
                  <div className="text-[10px] text-white/40">实力指数 {sandbox.prediction.darkHorse?.strength}</div>
                </div>
              </div>
            </div>
            <div className="w-px h-10 bg-white/[0.08] hidden md:block" />
            <div>
              <div className="text-[10px] uppercase tracking-[0.2em] text-white/30 mb-2">四强</div>
              <div className="text-sm font-bold text-white/70">
                {sandbox.prediction.top4?.map(t => t.name_cn).join(' · ')}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 小组沙盘视图 */}
      {view === 'sandbox' && sandbox?.groups && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 landscape:grid-cols-3 gap-4 landscape:gap-2">
          {sandbox.groups.map(group => (
            <div key={group.group_name} className="glass-card landscape:!p-3">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-gold">{group.group_name} 组</h3>
                <span className="text-[10px] text-white/25">{group.teams.length}支球队</span>
              </div>
              <div className="space-y-1.5">
                {group.teams.map((t, i) => (
                  <button
                    key={t.id}
                    onClick={() => handleTeamClick(t.id)}
                    className={`w-full flex items-center gap-2.5 py-2 px-2.5 rounded-xl transition-all text-left ${
                      selectedTeam === t.id ? 'bg-gold/10 border border-gold/30' : 'hover:bg-white/[0.04]'
                    }`}
                  >
                    <span className="w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold shrink-0 bg-white/[0.04] text-white/30">{i + 1}</span>
                    <FlagImage teamName={t.name} size="sm" />
                    <div className="flex-1 min-w-0">
                      <div className="text-[12px] font-semibold truncate">{t.name_cn}</div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <div className="h-1 flex-1 rounded-full bg-white/[0.06] overflow-hidden max-w-[60px]">
                          <div className="h-full rounded-full bg-gold transition-all" style={{ width: `${t.strength}%` }} />
                        </div>
                        <span className="text-[10px] text-white/25">{t.strength}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {i < 2 && <span className="text-[9px] px-1.5 py-0.5 rounded bg-accent/10 text-accent">{t.advanceProb}%</span>}
                      {t.gossipLevel > 0 && <span className="text-[10px]">{'🔥'.repeat(Math.min(t.gossipLevel, 3))}</span>}
                    </div>
                  </button>
                ))}
              </div>
              {group.fixtures && group.fixtures.length > 0 && (
                <div className="mt-3 pt-3 border-t border-white/[0.04]">
                  <div className="text-[10px] text-white/25 mb-2">关键对阵胜率</div>
                  {group.fixtures.filter(f => f.win_prob > 60 || f.draw_prob > 30).slice(0, 3).map((f, i) => (
                    <div key={i} className="flex items-center gap-1.5 text-[10px] py-0.5">
                      <span className="text-white/50 w-12 text-right truncate">{f.home.name_cn}</span>
                      <span className={`font-bold ${f.win_prob > 60 ? 'text-gold' : 'text-white/40'}`}>{f.win_prob}%</span>
                      <span className="text-white/15">-</span>
                      <span className="text-white/30">{f.draw_prob}%</span>
                      <span className="text-white/15">-</span>
                      <span className="text-white/30">{f.lose_prob}%</span>
                      <span className="text-white/50 w-12 truncate">{f.away.name_cn}</span>
                    </div>
                  ))}
                </div>
              )}
              {group.summary?.darkHorse && (
                <div className="mt-2 text-[10px] text-accent/60 flex items-center gap-1">
                  <Zap className="w-3 h-3" /> 黑马候选：{group.summary.darkHorse}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 实力排名视图 */}
      {view === 'rankings' && sandbox?.powerRanking && (
        <div className="glass-card !p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[10px] text-white/30 uppercase tracking-wider border-b border-white/[0.04]">
                <th className="py-3 pl-4 text-left w-10">#</th>
                <th className="py-3 text-left">球队</th>
                <th className="py-3 text-center hidden sm:table-cell">小组</th>
                <th className="py-3 text-center">实力指数</th>
                <th className="py-3 text-center hidden sm:table-cell">FIFA排名</th>
                <th className="py-3 pr-4 text-center">评估</th>
              </tr>
            </thead>
            <tbody>
              {sandbox.powerRanking.map((r, i) => (
                <tr
                  key={r.id}
                  onClick={() => handleTeamClick(r.id)}
                  className={`border-b border-white/[0.02] hover:bg-white/[0.02] transition-colors cursor-pointer ${
                    selectedTeam === r.id ? 'bg-gold/[0.06]' : ''
                  }`}
                >
                  <td className="py-2.5 pl-4">
                    <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-[11px] font-bold ${
                      i === 0 ? 'bg-gold text-dark' : i < 3 ? 'bg-white/15 text-white' : 'bg-white/[0.04] text-white/30'
                    }`}>{i + 1}</span>
                  </td>
                  <td className="py-2.5">
                    <div className="flex items-center gap-2">
                      <FlagImage teamName={r.name} size="sm" />
                      <span className="font-semibold text-[13px]">{r.name_cn}</span>
                    </div>
                  </td>
                  <td className="py-2.5 text-center text-white/40 hidden sm:table-cell">{r.group_name}组</td>
                  <td className="py-2.5 text-center">
                    <div className="flex items-center gap-2 justify-center">
                      <div className="h-1.5 w-20 rounded-full bg-white/[0.06] overflow-hidden hidden md:block">
                        <div className="h-full rounded-full bg-gold" style={{ width: `${r.strength}%` }} />
                      </div>
                      <span className="text-gold font-bold text-[13px]">{r.strength}</span>
                    </div>
                  </td>
                  <td className="py-2.5 text-center text-white/40 text-[12px] hidden sm:table-cell">#{r.fifa_rank}</td>
                  <td className="py-2.5 pr-4 text-center">
                    {r.strength >= 90 ? <span className="text-[10px] px-2 py-0.5 rounded-md bg-gold/10 text-gold">🏆 夺冠热门</span> :
                     r.strength >= 80 ? <span className="text-[10px] px-2 py-0.5 rounded-md bg-accent/10 text-accent">⭐ 冲冠梯队</span> :
                     r.strength >= 65 ? <span className="text-[10px] px-2 py-0.5 rounded-md bg-white/[0.04] text-white/50">晋级淘汰赛</span> :
                     <span className="text-[10px] px-2 py-0.5 rounded-md bg-white/[0.02] text-white/25">力争出线</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ====== 球队详情 - 全屏覆盖层 (手机) / 内嵌面板 (桌面) ====== */}
      {/* 桌面端：内嵌面板 */}
      {selectedTeam && (
        <div className="hidden md:block glass-card border border-gold/20">
          <TeamDetailContent
            teamPred={teamPred}
            teamRadar={teamRadar}
            detailLoading={detailLoading}
            detailError={detailError}
            selectedTeamInfo={selectedTeamInfo}
            onClose={() => { setSelectedTeam(null); setTeamPred(null); setTeamRadar(null); setDetailError(null); }}
          />
        </div>
      )}

      {/* 手机端：底部弹出层 */}
      {selectedTeam && (
        <div className="md:hidden fixed inset-0 z-[70] flex items-end" onClick={() => { setSelectedTeam(null); setTeamPred(null); setTeamRadar(null); setDetailError(null); }}>
          {/* 半透明遮罩 */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          {/* 底部面板 */}
          <div
            className="relative w-full max-h-[85vh] overflow-y-auto rounded-t-2xl border-t border-white/[0.08]"
            style={{ background: 'linear-gradient(180deg, #1a2a3a 0%, #0f1923 100%)' }}
            onClick={e => e.stopPropagation()}
          >
            {/* 拖拽指示条 */}
            <div className="sticky top-0 z-10 flex justify-center pt-3 pb-1" style={{ background: 'linear-gradient(180deg, #1a2a3a 0%, #1a2a3a 80%, transparent 100%)' }}>
              <div className="w-10 h-1 rounded-full bg-white/15" />
            </div>
            <div className="px-4 pb-6">
              <TeamDetailContent
                teamPred={teamPred}
                teamRadar={teamRadar}
                detailLoading={detailLoading}
                detailError={detailError}
                selectedTeamInfo={selectedTeamInfo}
                onClose={() => { setSelectedTeam(null); setTeamPred(null); setTeamRadar(null); setDetailError(null); }}
              />
            </div>
          </div>
        </div>
      )}

      {/* 方法论说明 */}
      <div className="glass-card">
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle className="w-4 h-4 text-white/30" />
          <h3 className="text-sm font-bold text-white/60">沙盘分析说明</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-white/35">
          <div>
            <div className="text-gold/70 font-semibold mb-1">实力指数</div>
            <p>基于FIFA世界排名 (权重40%)、历史比赛胜率 (权重30%)、博彩赔率隐含概率 (权重30%) 加权计算，范围5-95。</p>
          </div>
          <div>
            <div className="text-gold/70 font-semibold mb-1">对阵概率</div>
            <p>采用Elo评分差异模型，结合实力差换算胜/平/负概率。平局概率在实力相近时更高。</p>
          </div>
          <div>
            <div className="text-gold/70 font-semibold mb-1">晋级预测</div>
            <p>基于小组内实力排名推算。前两名直接晋级32强，8个成绩最好的小组第三名附加晋级。</p>
          </div>
        </div>
        <div className="mt-3 pt-3 border-t border-white/[0.04] text-[10px] text-white/20 flex items-center gap-1.5">
          <Zap className="w-3 h-3" />
          本沙盘仅供娱乐参考，实际比赛结果受球员状态、战术安排、临场发挥等多种因素影响。
        </div>
      </div>
    </div>
  );
}

// 详情内容组件（桌面和手机共用）
function TeamDetailContent({ teamPred, teamRadar, detailLoading, detailError, selectedTeamInfo, onClose }) {
  // 加载中
  if (detailLoading) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-12">
        <Loader2 className="w-8 h-8 text-gold animate-spin" />
        <div className="text-sm text-white/50">
          正在分析 {selectedTeamInfo?.name_cn || '球队'} 数据...
        </div>
        <div className="text-[10px] text-white/25">获取预测数据、实力雷达、对阵概率</div>
      </div>
    );
  }

  // 错误
  if (detailError) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-12">
        <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center">
          <AlertTriangle className="w-6 h-6 text-red-400" />
        </div>
        <div className="text-sm text-red-400">加载失败</div>
        <div className="text-[11px] text-white/30">{detailError}</div>
        <button onClick={onClose} className="text-xs text-white/40 hover:text-white/70 mt-2">关闭</button>
      </div>
    );
  }

  // 无数据
  if (!teamPred) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-12">
        <div className="w-12 h-12 rounded-full bg-white/[0.04] flex items-center justify-center">
          <Shield className="w-6 h-6 text-white/20" />
        </div>
        <div className="text-sm text-white/40">暂无预测数据</div>
        <button onClick={onClose} className="text-xs text-white/40 hover:text-white/70 mt-2">关闭</button>
      </div>
    );
  }

  // 正常数据
  return (
    <div>
      {/* 头部 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <FlagImage teamName={teamPred.team?.name} size="lg" />
          <div>
            <h2 className="text-lg font-bold">{teamPred.team?.name_cn}</h2>
            <div className="text-[12px] text-white/40">{teamPred.team?.group_name}组 · 综合排名 #{teamPred.rank}/{teamPred.totalTeams}</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link to={`/team/${teamPred.team?.id}`} className="text-xs text-gold/60 hover:text-gold transition-colors">
            球队详情 →
          </Link>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/[0.06] text-white/30 hover:text-white/60 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 雷达图 */}
        {teamRadar && (
          <div className="bg-white/[0.02] rounded-xl p-4">
            <h3 className="text-[11px] text-white/30 uppercase tracking-wider mb-3">实力雷达</h3>
            <div className="space-y-3">
              {[
                { key: 'attack', label: '进攻', color: '#ef4444' },
                { key: 'defense', label: '防守', color: '#3b82f6' },
                { key: 'experience', label: '经验', color: '#f59e0b' },
                { key: 'form', label: '状态', color: '#10b981' }
              ].map(({ key, label, color }) => (
                <div key={key} className="flex items-center gap-3">
                  <span className="text-[11px] text-white/50 w-8 shrink-0">{label}</span>
                  <div className="flex-1 h-2 rounded-full bg-white/[0.04] overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-700 ease-out" style={{ width: `${teamRadar[key] || 0}%`, background: color }} />
                  </div>
                  <span className="text-[11px] text-white/70 w-8 text-right font-bold">{teamRadar[key] || 0}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-3 border-t border-white/[0.04] flex items-center justify-between">
              <span className="text-[11px] text-white/40">综合实力</span>
              <div className="flex items-center gap-2">
                <div className="h-2 w-32 rounded-full bg-white/[0.04] overflow-hidden">
                  <div className="h-full rounded-full bg-gradient-to-r from-gold to-yellow-500" style={{ width: `${teamPred.strength || 0}%` }} />
                </div>
                <span className="text-gold font-bold">{teamPred.strength}</span>
              </div>
            </div>
          </div>
        )}

        {/* 评估依据 */}
        <div className="space-y-3">
          <h3 className="text-[11px] text-white/30 uppercase tracking-wider">评估依据</h3>

          <div className="grid grid-cols-2 gap-2">
            {[
              { label: '实力指数', value: teamPred.strength, desc: '基于FIFA排名+历史战绩+赔率', color: 'text-gold' },
              { label: '全球排名', value: `#${teamPred.rank}`, desc: `超越${teamPred.percentRank}%的球队`, color: 'text-accent' },
              { label: '小组晋级概率', value: `${teamPred.groupAdvanceProb}%`, desc: teamPred.groupAdvanceProb >= 65 ? '大概率出线' : teamPred.groupAdvanceProb >= 40 ? '有望竞争' : '需要突破', color: teamPred.groupAdvanceProb >= 65 ? 'text-accent' : 'text-white/60' },
              { label: '花边热度', value: '🔥'.repeat(Math.min(teamPred.gossipLevel || 0, 5)) || '无', desc: teamPred.gossipLevel ? '媒体关注度高' : '低调备战', color: 'text-pink-400' }
            ].map((item, i) => (
              <div key={i} className="bg-white/[0.02] rounded-xl p-3">
                <div className={`text-lg font-bold ${item.color}`}>{item.value}</div>
                <div className="text-[11px] text-white/50 mt-0.5">{item.label}</div>
                <div className="text-[9px] text-white/20 mt-0.5">{item.desc}</div>
              </div>
            ))}
          </div>

          {/* 对阵概率表 */}
          {teamPred.matchups && teamPred.matchups.length > 0 && (
            <div className="mt-3">
              <div className="text-[11px] text-white/30 mb-2">同组对手对阵预测</div>
              <div className="space-y-1">
                {teamPred.matchups.map((m, i) => (
                  <div key={i} className="flex items-center gap-2 text-[11px] py-1.5 px-2 rounded-lg bg-white/[0.02]">
                    <FlagImage teamName={m.opponent_name} size="sm" />
                    <span className="text-white/60 w-16 truncate">{m.opponent_cn}</span>
                    <div className="flex items-center gap-1 ml-auto">
                      <span className="text-[10px] w-10 text-right">
                        <span className="text-accent">{m.win_prob}%</span>
                      </span>
                      <span className="text-white/20">/</span>
                      <span className="text-[10px] w-8 text-center text-white/30">{m.draw_prob}%</span>
                      <span className="text-white/20">/</span>
                      <span className="text-[10px] w-8 text-white/20">{m.lose_prob}%</span>
                    </div>
                    <span className="text-[9px] text-white/20 w-16 text-right">胜/平/负</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
