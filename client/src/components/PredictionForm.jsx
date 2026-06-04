import { useState, useEffect } from 'react';
import { X, Loader2, Clock, AlertTriangle } from 'lucide-react';
import { predictionGameAPI } from '../services/api';
import useUserStore from '../stores/userStore';
import FlagImage from './FlagImage';

export default function PredictionForm({ match, onClose, onSuccess }) {
  const { isLoggedIn, openRegister } = useUserStore();
  const [predictedResult, setPredictedResult] = useState(null);
  const [homeScore, setHomeScore] = useState(0);
  const [awayScore, setAwayScore] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [deadlinePassed, setDeadlinePassed] = useState(false);

  useEffect(() => {
    if (match?.match_date) {
      const deadline = new Date(match.match_date).getTime() - 15 * 60 * 1000;
      setDeadlinePassed(Date.now() > deadline);
    }
  }, [match]);

  if (!match) return null;

  const handleSubmit = async () => {
    if (!isLoggedIn) {
      openRegister();
      return;
    }
    if (!predictedResult) {
      setError('请选择比赛结果');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      const res = await predictionGameAPI.submit({
        match_id: match.id,
        predicted_result: predictedResult,
        predicted_home_score: parseInt(homeScore) || 0,
        predicted_away_score: parseInt(awayScore) || 0
      });
      if (res.success) {
        onSuccess?.(res.data);
        onClose?.();
      } else {
        setError(res.message || '提交失败');
      }
    } catch (e) {
      setError(e.response?.data?.message || '网络错误');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative glass-card p-6 w-full max-w-md animate-fadeIn">
        <button onClick={onClose} className="absolute top-3 right-3 text-white/30 hover:text-white/60">
          <X size={18} />
        </button>

        <h3 className="text-lg font-bold text-white mb-1">比赛预测</h3>

        {/* 对阵双方 */}
        <div className="flex items-center justify-center gap-4 my-5">
          <div className="text-center">
            <FlagImage teamName={match._homeTeam?.name} size="md" />
            <p className="text-white font-semibold text-sm mt-1">{match._homeTeam?.name_cn || match._homeTeam?.name}</p>
          </div>
          <div className="text-white/30 text-xl font-bold">VS</div>
          <div className="text-center">
            <FlagImage teamName={match._awayTeam?.name} size="md" />
            <p className="text-white font-semibold text-sm mt-1">{match._awayTeam?.name_cn || match._awayTeam?.name}</p>
          </div>
        </div>

        <p className="text-xs text-white/30 text-center mb-4">
          {match.match_date && new Date(match.match_date).toLocaleString('zh-CN')}
          {match.stadium ? ` · ${match.stadium}` : ''}
        </p>

        {deadlinePassed ? (
          <div className="flex items-center justify-center gap-2 text-warning text-sm py-4">
            <AlertTriangle size={16} />
            <span>预测已截止（比赛开始前15分钟锁定）</span>
          </div>
        ) : (
          <>
            {/* 胜负平选择 */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              {[
                { value: 'home', label: '主胜', sub: match._homeTeam?.name_cn },
                { value: 'draw', label: '平局', sub: '双方打平' },
                { value: 'away', label: '客胜', sub: match._awayTeam?.name_cn }
              ].map(opt => (
                <button
                  key={opt.value}
                  onClick={() => { setPredictedResult(opt.value); setError(''); }}
                  className={`p-3 rounded-xl border transition-all text-center ${
                    predictedResult === opt.value
                      ? 'border-gold bg-gold/15 text-gold'
                      : 'border-white/10 text-white/50 hover:border-white/20'
                  }`}
                >
                  <div className="font-bold text-sm">{opt.label}</div>
                  <div className="text-[10px] opacity-50">{opt.sub}</div>
                </button>
              ))}
            </div>

            {/* 比分输入 */}
            <div className="flex items-center justify-center gap-3 mb-4">
              <input
                type="number"
                min={0}
                max={15}
                value={homeScore}
                onChange={e => setHomeScore(e.target.value)}
                className="w-16 h-12 bg-white/5 border border-white/10 rounded-xl text-center text-xl font-bold text-white focus:border-gold/40 outline-none"
              />
              <span className="text-white/20 text-lg">:</span>
              <input
                type="number"
                min={0}
                max={15}
                value={awayScore}
                onChange={e => setAwayScore(e.target.value)}
                className="w-16 h-12 bg-white/5 border border-white/10 rounded-xl text-center text-xl font-bold text-white focus:border-gold/40 outline-none"
              />
            </div>

            {error && <p className="text-danger text-xs mb-3 text-center">{error}</p>}

            <button
              onClick={handleSubmit}
              disabled={submitting || !predictedResult}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {submitting ? <Loader2 size={18} className="animate-spin" /> : null}
              {submitting ? '提交中...' : isLoggedIn ? '提交预测' : '注册并预测'}
            </button>

            <div className="flex items-center justify-center gap-1 mt-3 text-[11px] text-white/20">
              <Clock size={12} />
              <span>比赛开始前15分钟截止，可随时修改</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
