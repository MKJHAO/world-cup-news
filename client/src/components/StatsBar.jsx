export function StatRow({ label, homeValue, awayValue, homeColor, awayColor, format = 'number', inverted = false }) {
  const total = Number(homeValue) + Number(awayValue);
  const homePct = total > 0 ? (homeValue / total) * 100 : 50;
  const awayPct = total > 0 ? (awayValue / total) * 100 : 50;

  const formatVal = (v) => {
    if (format === 'percent') return `${v}%`;
    if (format === 'xg') return Number(v).toFixed(1);
    return v;
  };

  return (
    <div className="py-2.5">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-sm font-semibold text-white/80 tabular-nums w-14 text-right">{formatVal(homeValue)}</span>
        <span className="text-[10px] text-white/30 uppercase tracking-wider px-2">{label}</span>
        <span className="text-sm font-semibold text-white/80 tabular-nums w-14 text-left">{formatVal(awayValue)}</span>
      </div>
      <div className="flex items-center gap-0.5">
        <div className="flex-1 flex justify-end">
          <div
            className="h-1.5 rounded-full transition-all duration-700"
            style={{
              width: `${Math.max(homePct, 3)}%`,
              backgroundColor: inverted ? (awayColor || '#4b5563') : (homeColor || '#c4922e'),
              opacity: homePct > awayPct ? 1 : 0.5
            }}
          />
        </div>
        <div className="w-px h-3 bg-white/10 shrink-0" />
        <div className="flex-1 flex justify-start">
          <div
            className="h-1.5 rounded-full transition-all duration-700"
            style={{
              width: `${Math.max(awayPct, 3)}%`,
              backgroundColor: inverted ? (homeColor || '#4b5563') : (awayColor || '#c4922e'),
              opacity: awayPct > homePct ? 1 : 0.5
            }}
          />
        </div>
      </div>
    </div>
  );
}

export default function StatsPanel({ homeStats, awayStats, homeColor, awayColor }) {
  if (!homeStats || !awayStats) return null;

  const rows = [
    { label: '控球率', home: homeStats.possession, away: awayStats.possession, format: 'percent' },
    { label: '射门', home: homeStats.shots_total, away: awayStats.shots_total },
    { label: '射正', home: homeStats.shots_on_target, away: awayStats.shots_on_target },
    { label: '角球', home: homeStats.corners, away: awayStats.corners },
    { label: '犯规', home: homeStats.fouls, away: awayStats.fouls, inverted: true },
    { label: '越位', home: homeStats.offsides, away: awayStats.offsides, inverted: true },
    { label: '传球', home: homeStats.passes, away: awayStats.passes },
    { label: '传球成功率', home: homeStats.pass_accuracy, away: awayStats.pass_accuracy, format: 'percent' },
    { label: 'xG', home: homeStats.xg, away: awayStats.xg, format: 'xg' },
  ];

  return (
    <div className="glass-card">
      <h3 className="section-title mb-3">比赛统计</h3>
      <div className="divide-y divide-white/[0.03]">
        {rows.map(row => (
          <StatRow key={row.label} {...row} homeColor={homeColor} awayColor={awayColor} />
        ))}
      </div>
    </div>
  );
}
