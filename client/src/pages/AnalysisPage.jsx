import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, BarChart3, Swords, Target, ArrowLeft } from 'lucide-react';
import { teamAPI } from '../services/api';
import FlagImage from '../components/FlagImage';

const tabs = [
  { key: 'team', label: '按球队', icon: Target },
  { key: 'type', label: '按比赛类型', icon: BarChart3 },
  { key: 'stage', label: '按赛事阶段', icon: TrendingUp },
  { key: 'compare', label: '球队对比', icon: Swords }
];

export default function AnalysisPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('team');
  const [teams, setTeams] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState('');
  const [teamAnalysis, setTeamAnalysis] = useState(null);

  const [typeData, setTypeData] = useState(null);
  const [stageData, setStageData] = useState(null);

  const [compareA, setCompareA] = useState('');
  const [compareB, setCompareB] = useState('');
  const [compareData, setCompareData] = useState(null);

  const [ranking, setRanking] = useState([]);
  const [gossipStats, setGossipStats] = useState([]);

  useEffect(() => {
    teamAPI.getAll({ limit: 100 }).then(r => r.success && setTeams(r.data));
    fetch('/api/odds/analysis').then(r => r.json()).then(d => d.success && setRanking(d.data));
    fetch('/api/gossip/all').then(r => r.json()).then(d => d.success && setGossipStats(d.data));
  }, []);

  useEffect(() => {
    if (activeTab === 'type') {
      fetch('/api/odds/match-types').then(r => r.json()).then(d => d.success && setTypeData(d.data));
    } else if (activeTab === 'stage') {
      fetch('/api/odds/stages').then(r => r.json()).then(d => d.success && setStageData(d.data));
    }
  }, [activeTab]);

  const handleTeamSelect = (id) => {
    setSelectedTeam(id);
    if (!id) { setTeamAnalysis(null); return; }
    fetch(`/api/odds/team/${id}`).then(r => r.json())
      .then(d => d.success && setTeamAnalysis(d.data))
      .catch(() => {});
  };

  const handleCompare = () => {
    if (!compareA || !compareB) return;
    fetch(`/api/odds/comparison?a=${compareA}&b=${compareB}`).then(r => r.json())
      .then(d => d.success && setCompareData(d.data))
      .catch(() => {});
  };

  const teamGossip = (teamId) => {
    const gs = gossipStats.find(g => g.team?.id === teamId);
    return gs?.gossipLevel || 0;
  };

  return (
    <div className="space-y-6">
      <button onClick={() => window.history.length > 1 ? navigate(-1) : navigate('/')} className="inline-flex items-center gap-1.5 text-white/35 hover:text-white/70 text-sm transition-colors">
        <ArrowLeft className="w-4 h-4" /> 返回
      </button>
      <h1 className="text-2xl font-bold tracking-tight flex items-center gap-3">
        <TrendingUp className="w-6 h-6 text-gold" /> 外围胜率分析
      </h1>

      {/* Tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setActiveTab(key)}
            className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm whitespace-nowrap font-medium transition-all ${
              activeTab === key ? 'bg-gold text-dark shadow-lg shadow-gold/20' : 'glass-card !py-2.5 text-white/40 hover:text-white/80'
            }`}>
            <Icon className="w-4 h-4" /> {label}
          </button>
        ))}
      </div>

      {/* Team Analysis */}
      {activeTab === 'team' && (
        <div className="space-y-4">
          <div className="glass-card">
            <select className="bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-white/80 focus:outline-none focus:border-gold/50 w-full max-w-xs"
              value={selectedTeam} onChange={e => handleTeamSelect(e.target.value)}>
              <option value="" className="bg-dark">选择球队分析...</option>
              {teams.map(t => <option key={t.id} value={t.id} className="bg-dark">{t.name_cn} ({t.name})</option>)}
            </select>
          </div>

          {teamAnalysis && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="glass-card">
                <h3 className="text-sm font-bold mb-3">{teamAnalysis.team?.name_cn} 胜率概览</h3>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div>
                    <div className="text-2xl font-bold text-gold">{teamAnalysis.avgWinProb}%</div>
                    <div className="text-[10px] text-white/30 mt-1">平均隐含胜率</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-accent">{teamAnalysis.actualWinRate}%</div>
                    <div className="text-[10px] text-white/30 mt-1">实际胜率</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-white/60">{teamAnalysis.totalMatches}</div>
                    <div className="text-[10px] text-white/30 mt-1">比赛场次</div>
                  </div>
                </div>
              </div>
              <div className="glass-card">
                <h3 className="text-sm font-bold mb-3">比赛类型分布</h3>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-[11px] text-white/40 mb-1">
                      <span>小组赛 ({teamAnalysis.groupStage?.count || 0}场)</span>
                      <span>{teamAnalysis.groupStage?.avgProb || 0}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-white/[0.04] overflow-hidden">
                      <div className="h-full rounded-full bg-gold" style={{ width: `${Math.min(teamAnalysis.groupStage?.avgProb || 0, 100)}%` }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-[11px] text-white/40 mb-1">
                      <span>淘汰赛 ({teamAnalysis.knockout?.count || 0}场)</span>
                      <span>{teamAnalysis.knockout?.avgProb || 0}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-white/[0.04] overflow-hidden">
                      <div className="h-full rounded-full bg-blue-400" style={{ width: `${Math.min(teamAnalysis.knockout?.avgProb || 0, 100)}%` }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Match Type Analysis */}
      {activeTab === 'type' && typeData && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[typeData.group, typeData.knockout].map((d, i) => (
            <div key={i} className="glass-card">
              <h3 className="text-sm font-bold mb-3">{i === 0 ? '小组赛' : '淘汰赛'} 赔率分析</h3>
              <div className="grid grid-cols-3 gap-3 text-center mb-4">
                <div>
                  <div className="text-xl font-bold text-gold">{d.totalRecords}</div>
                  <div className="text-[10px] text-white/30 mt-1">数据条数</div>
                </div>
                <div>
                  <div className="text-xl font-bold text-accent">{d.avgWinProb}%</div>
                  <div className="text-[10px] text-white/30 mt-1">平均胜率</div>
                </div>
                <div>
                  <div className="text-xl font-bold text-white/60">{d.avgDrawProb}%</div>
                  <div className="text-[10px] text-white/30 mt-1">平均平率</div>
                </div>
              </div>
              <div className="text-[10px] text-white/20 mb-2">胜率分布</div>
              <div className="space-y-1">
                {Object.entries(d.distribution || {}).map(([range, count]) => (
                  <div key={range} className="flex items-center gap-2">
                    <span className="text-[10px] text-white/30 w-16">{range}</span>
                    <div className="flex-1 h-1.5 rounded-full bg-white/[0.04] overflow-hidden">
                      <div className="h-full rounded-full bg-gold" style={{ width: `${Math.min((count / Math.max(d.totalRecords, 1)) * 100, 100)}%` }} />
                    </div>
                    <span className="text-[10px] text-white/40">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Stage Analysis */}
      {activeTab === 'stage' && stageData && (
        <div className="glass-card !p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[10px] text-white/30 uppercase tracking-wider border-b border-white/[0.04]">
                <th className="py-3 pl-4 text-left">阶段</th>
                <th className="py-3 text-center">比赛数</th>
                <th className="py-3 text-center">赔率数</th>
                <th className="py-3 text-center">热门胜率</th>
                <th className="py-3 pr-4 text-center">热门赢率</th>
              </tr>
            </thead>
            <tbody>
              {stageData.map(s => (
                <tr key={s.stage} className="border-b border-white/[0.02] hover:bg-white/[0.02]">
                  <td className="py-2.5 pl-4 text-[13px] font-medium">
                    {{ group: '小组赛', round16: '1/8决赛', quarter: '1/4决赛', semi: '半决赛', third: '季军赛', final: '决赛' }[s.stage] || s.stage}
                  </td>
                  <td className="py-2.5 text-center text-white/40">{s.matchCount}</td>
                  <td className="py-2.5 text-center text-white/40">{s.oddsCount}</td>
                  <td className="py-2.5 text-center text-gold font-bold">{s.avgFavoriteProb}%</td>
                  <td className="py-2.5 pr-4 text-center text-white/60">{s.favoriteWinRate}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Team Compare */}
      {activeTab === 'compare' && (
        <div className="space-y-4">
          <div className="glass-card flex flex-wrap items-center gap-3">
            <select className="bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-white/80 focus:outline-none focus:border-gold/50"
              value={compareA} onChange={e => setCompareA(e.target.value)}>
              <option value="" className="bg-dark">球队A</option>
              {teams.map(t => <option key={t.id} value={t.id} className="bg-dark">{t.name_cn}</option>)}
            </select>
            <span className="text-white/20 text-sm">VS</span>
            <select className="bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-white/80 focus:outline-none focus:border-gold/50"
              value={compareB} onChange={e => setCompareB(e.target.value)}>
              <option value="" className="bg-dark">球队B</option>
              {teams.map(t => <option key={t.id} value={t.id} className="bg-dark">{t.name_cn}</option>)}
            </select>
            <button onClick={handleCompare} disabled={!compareA || !compareB}
              className="btn-primary text-sm px-4 py-2 disabled:opacity-30 disabled:pointer-events-none">对比</button>
          </div>

          {compareData && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[compareData.teamA, compareData.teamB].map((team, i) => team && (
                <div key={i} className="glass-card">
                  <div className="flex items-center gap-2 mb-3">
                    <FlagImage teamName={team.team?.name} size="md" />
                    <span className="text-sm font-bold">{team.team?.name_cn}</span>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between"><span className="text-white/40">平均隐含胜率</span>
                      <span className="text-gold font-bold">{team.avgWinProb}%</span></div>
                    <div className="flex justify-between"><span className="text-white/40">实际胜率</span>
                      <span className="text-accent font-bold">{team.actualWinRate}%</span></div>
                    <div className="flex justify-between"><span className="text-white/40">比赛数</span>
                      <span className="text-white/60">{team.totalMatches}场</span></div>
                    <div className="flex justify-between"><span className="text-white/40">花边指数</span>
                      <span className="text-pink-400">{'🔥'.repeat(Math.min(teamGossip(team.team?.id), 5)) || '-'}</span></div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Global Ranking */}
      <div className="glass-card">
        <h2 className="section-title"><TrendingUp className="w-4 h-4" />球队胜率排名 TOP 10</h2>
        <div className="space-y-1">
          {ranking.slice(0, 10).map((r, i) => (
            <div key={r.team_id} className="flex items-center gap-3 py-2 px-2 -mx-2 rounded-xl hover:bg-white/[0.04] transition-colors">
              <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-[11px] font-bold shrink-0 ${
                i === 0 ? 'bg-gold text-dark' : i < 3 ? 'bg-white/15 text-white' : 'bg-white/[0.04] text-white/30'
              }`}>{i + 1}</span>
              <FlagImage teamName={r.name} size="sm" />
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-semibold truncate">{r.name_cn}</div>
                <div className="text-[10px] text-white/25">{r.group_name}组 · {r.totalMatches}场</div>
              </div>
              <div className="flex items-center gap-2 text-right shrink-0">
                <span className="text-lg font-bold text-gold">{r.avgWinProb}%</span>
                {gossipStats.find(g => g.team?.id === r.team_id)?.gossipLevel > 0 && (
                  <span className="text-[10px] text-pink-400">🔥</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
