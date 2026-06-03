import { useEffect, useState } from 'react';
import { TrendingUp, CircleDollarSign } from 'lucide-react';

function StatRow({ label, homeValue, awayValue, homeColor = '#c4922e', awayColor = '#4b5563', format }) {
  const total = homeValue + awayValue;
  const homePct = total > 0 ? (homeValue / total) * 100 : 50;
  const homeDisplay = format ? format(homeValue) : `${homeValue}%`;
  const awayDisplay = format ? format(awayValue) : `${awayValue}%`;

  return (
    <div className="mb-2.5">
      <div className="flex justify-between text-[10px] text-white/35 mb-1 px-0.5">
        <span>{homeDisplay}</span>
        <span className="text-white/20">{label}</span>
        <span>{awayDisplay}</span>
      </div>
      <div className="flex h-1.5 rounded-full overflow-hidden bg-white/[0.04]">
        <div className="transition-all duration-500 rounded-l-full" style={{ width: `${homePct}%`, backgroundColor: homeColor }} />
        <div className="transition-all duration-500 rounded-r-full" style={{ width: `${100 - homePct}%`, backgroundColor: awayColor }} />
      </div>
    </div>
  );
}

export default function OddsPanel({ matchId, homeTeam, awayTeam }) {
  const [odds, setOdds] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/odds/match/${matchId}`).then(r => r.json())
      .then(d => d.success && setOdds(d.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [matchId]);

  if (loading || !odds || odds.length === 0) return null;

  const homeOdds = odds.find(o => o.team_id === o._homeTeamId) || odds[0];
  const homeProb = Math.round((homeOdds?.implied_win_prob || 0.33) * 100);
  const drawProb = Math.round((homeOdds?.implied_draw_prob || 0.28) * 100);
  const awayProb = Math.round((homeOdds?.implied_lose_prob || 0.33) * 100);

  return (
    <div className="glass-card">
      <h2 className="section-title">
        <TrendingUp className="w-4 h-4" />赔率分析
      </h2>
      <div className="space-y-1">
        <StatRow label="胜率" homeValue={homeProb} awayValue={awayProb} homeColor="#c4922e" awayColor="#4b5563" />
      </div>
      <div className="flex justify-between mt-3">
        <div className="text-center flex-1">
          <div className="text-xs font-bold text-white/70">{homeTeam}</div>
          <div className="text-lg font-bold text-gold mt-0.5">{homeProb}%</div>
        </div>
        <div className="text-center flex-1">
          <div className="text-xs text-white/30">平局</div>
          <div className="text-lg font-bold text-white/50 mt-0.5">{drawProb}%</div>
        </div>
        <div className="text-center flex-1">
          <div className="text-xs font-bold text-white/70">{awayTeam}</div>
          <div className="text-lg font-bold text-white/60 mt-0.5">{awayProb}%</div>
        </div>
      </div>
      {homeOdds?.bookmaker && (
        <div className="flex items-center justify-center gap-1.5 mt-3 pt-3 border-t border-white/[0.04]">
          <CircleDollarSign className="w-3 h-3 text-white/20" />
          <span className="text-[10px] text-white/25">数据参考：{homeOdds.bookmaker}</span>
        </div>
      )}
    </div>
  );
}
