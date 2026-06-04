import { useEffect, useState } from 'react';
import { Trophy, Loader2, Save } from 'lucide-react';
import { matchAPI, predictionGameAPI } from '../services/api';
import useUserStore from '../stores/userStore';

// 淘汰赛阶段定义
const STAGES = [
  { key: 'round32', label: '1/16决赛', slots: 16, next: 'round16' },
  { key: 'round16', label: '1/8决赛', slots: 8, next: 'quarter' },
  { key: 'quarter', label: '1/4决赛', slots: 4, next: 'semi' },
  { key: 'semi', label: '半决赛', slots: 2, next: 'final' },
  { key: 'final', label: '决赛', slots: 1, next: null },
  { key: 'champion', label: '冠军', slots: 1, next: null }
];

export default function BracketChallenge() {
  const { isLoggedIn, openRegister } = useUserStore();
  const [teams, setTeams] = useState([]);
  const [bracket, setBracket] = useState({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      matchAPI.getAll({ tournament: '2026', stage: 'round32' }).catch(() => ({ success: false })),
      isLoggedIn ? predictionGameAPI.getMyBracket().catch(() => ({})) : Promise.resolve({})
    ]).then(([matchRes, bracketRes]) => {
      // 从match中提取淘汰赛球队
      if (matchRes.success && matchRes.data) {
        const teamSet = new Map();
        matchRes.data.forEach(m => {
          if (m._homeTeam) teamSet.set(m._homeTeam.id, m._homeTeam);
          if (m._awayTeam) teamSet.set(m._awayTeam.id, m._awayTeam);
        });
        setTeams(Array.from(teamSet.values()));
      }

      // 加载已有bracket
      if (bracketRes.success && bracketRes.data && bracketRes.data.bracket_data) {
        setBracket(bracketRes.data.bracket_data);
      } else {
        // 初始化空bracket
        const init = {};
        STAGES.forEach(s => { init[s.key] = []; });
        setBracket(init);
      }
      setLoading(false);
    });
  }, [isLoggedIn]);

  const handlePick = (stageKey, slotIndex, teamId) => {
    if (!isLoggedIn) { openRegister(); return; }
    setBracket(prev => {
      const updated = { ...prev };
      if (!updated[stageKey]) updated[stageKey] = [];
      const stage = [...(updated[stageKey] || [])];
      stage[slotIndex] = { slot: slotIndex, team_id: teamId };
      updated[stageKey] = stage;
      return updated;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await predictionGameAPI.submitBracket(bracket);
      if (res.success) setSaved(true);
    } catch (e) {
      alert('保存失败');
    } finally {
      setSaving(false);
      setTimeout(() => setSaved(false), 2000);
    }
  };

  const getTeamName = (teamId) => {
    const t = teams.find(t => t.id === teamId);
    return t?.name_cn || t?.name || '?';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={32} className="animate-spin text-gold" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h2 className="section-title">🏆 Bracket Challenge</h2>
        <button
          onClick={handleSave}
          disabled={saving || !isLoggedIn}
          className="btn-primary text-sm flex items-center gap-1.5"
        >
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          {saved ? '已保存' : saving ? '保存中...' : '保存预测'}
        </button>
      </div>

      <p className="text-sm text-white/40 mb-6">
        选择你认为会晋级的球队，从1/16决赛开始一直填到冠军。提交后不可修改。
      </p>

      <div className="space-y-6">
        {STAGES.map(stage => (
          <div key={stage.key}>
            <h4 className="text-gold text-sm font-bold mb-3 flex items-center gap-2">
              {stage.key === 'champion' && <Trophy size={16} />}
              {stage.label}
              <span className="text-white/20 font-normal text-xs">({stage.slots}个名额)</span>
            </h4>
            <div className={`grid gap-2 ${
              stage.slots >= 8 ? 'grid-cols-4 md:grid-cols-8' :
              stage.slots === 4 ? 'grid-cols-4' :
              stage.slots === 2 ? 'grid-cols-2' :
              'grid-cols-1'
            }`}>
              {Array.from({ length: stage.slots }).map((_, i) => {
                const pick = bracket[stage.key]?.[i];
                const pickTeam = pick ? teams.find(t => t.id === pick.team_id) : null;
                return (
                  <div key={i} className="relative">
                    <select
                      value={pick?.team_id || ''}
                      onChange={e => handlePick(stage.key, i, parseInt(e.target.value))}
                      className={`w-full bg-white/5 border rounded-lg px-3 py-2 text-sm outline-none appearance-none cursor-pointer transition-all ${
                        pickTeam ? 'border-gold/30 text-gold' : 'border-white/10 text-white/30'
                      }`}
                    >
                      <option value="">选择球队...</option>
                      {teams.map(t => (
                        <option key={t.id} value={t.id}>
                          {t.name_cn || t.name} {t.group_name ? `(${t.group_name}组)` : ''}
                        </option>
                      ))}
                    </select>
                    {pickTeam && stage.key === 'champion' && (
                      <span className="text-2xl absolute right-2 top-1/2 -translate-y-1/2">👑</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
