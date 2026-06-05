import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Legend } from 'recharts';

// 维度中文映射
const DIM_LABELS = {
  attack: '进攻', defense: '防守', experience: '经验', form: '状态', strength: '综合'
};

const DIM_COLORS = {
  attack: '#ef4444', defense: '#3b82f6', experience: '#f59e0b', form: '#10b981', strength: '#c4922e'
};

/**
 * 将 { attack: 85, defense: 78, ... } 转为 recharts 需要的格式
 * [{ dimension: '进攻', value: 85, fullMark: 100 }, ...]
 */
function toChartData(data) {
  return Object.entries(DIM_LABELS).map(([key, label]) => ({
    dimension: label,
    value: data?.[key] ?? 0,
    fullMark: 100
  }));
}

export default function TeamRadar({ data, compareData, className = '' }) {
  const chartData = toChartData(data);

  return (
    <div className={`bg-white/[0.02] rounded-xl p-4 ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-[11px] text-white/30 uppercase tracking-wider">
          实力雷达 {compareData ? '— 对比模式' : ''}
        </h3>
        {compareData && (
          <span className="text-[10px] text-gold/60">两队数据叠加</span>
        )}
      </div>

      <div className="w-full" style={{ height: 280 }}>
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={chartData} cx="50%" cy="50%" outerRadius="70%">
            <PolarGrid stroke="rgba(255,255,255,0.08)" />
            <PolarAngleAxis
              dataKey="dimension"
              tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }}
            />
            <PolarRadiusAxis
              angle={90}
              domain={[0, 100]}
              tick={{ fill: 'rgba(255,255,255,0.2)', fontSize: 9 }}
              axisLine={false}
              tickCount={5}
            />

            {/* 主数据 */}
            <Radar
              name={data?.team?.name_cn || '当前球队'}
              dataKey="value"
              stroke="#c4922e"
              fill="#c4922e"
              fillOpacity={0.2}
              strokeWidth={2}
              animationDuration={800}
              animationEasing="ease-out"
            />

            {/* 对比数据 */}
            {compareData && (
              <Radar
                name={compareData?.team?.name_cn || '对比球队'}
                dataKey="value"
                stroke="#3b82f6"
                fill="#3b82f6"
                fillOpacity={0.15}
                strokeWidth={2}
                animationDuration={800}
                animationEasing="ease-out"
              />
            )}

            <Legend
              wrapperStyle={{ fontSize: 11, color: 'rgba(255,255,255,0.6)' }}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* 数值表 */}
      <div className="grid grid-cols-5 gap-1 mt-3">
        {Object.entries(DIM_LABELS).map(([key, label]) => {
          const val = data?.[key] ?? 0;
          const cmpVal = compareData?.[key];
          const diff = cmpVal != null ? val - cmpVal : null;
          return (
            <div key={key} className="text-center">
              <div className="text-[10px] text-white/30">{label}</div>
              <div className="text-sm font-bold" style={{ color: DIM_COLORS[key] }}>
                {val}
              </div>
              {diff != null && (
                <div className={`text-[10px] font-medium ${diff >= 0 ? 'text-accent' : 'text-danger'}`}>
                  {diff > 0 ? '+' : ''}{diff}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * 对比模式：将两个data合并在一起
 * recharts 用同一个 data 数组，所以对比时需要把 compareData 合并到 chartData 中
 */
export function toCompareChartData(data, compareData) {
  return Object.entries(DIM_LABELS).map(([key, label]) => ({
    dimension: label,
    value: data?.[key] ?? 0,
    compare: compareData?.[key] ?? 0,
    fullMark: 100
  }));
}

export function TeamRadarCompare({ data, compareData, className = '' }) {
  const chartData = toCompareChartData(data, compareData);

  return (
    <div className={`bg-white/[0.02] rounded-xl p-4 ${className}`}>
      <h3 className="text-[11px] text-white/30 uppercase tracking-wider mb-2">
        实力雷达 — {data?.team?.name_cn || '?'} vs {compareData?.team?.name_cn || '?'}
      </h3>

      <div className="w-full" style={{ height: 280 }}>
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={chartData} cx="50%" cy="50%" outerRadius="70%">
            <PolarGrid stroke="rgba(255,255,255,0.08)" />
            <PolarAngleAxis
              dataKey="dimension"
              tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }}
            />
            <PolarRadiusAxis
              angle={90}
              domain={[0, 100]}
              tick={{ fill: 'rgba(255,255,255,0.2)', fontSize: 9 }}
              axisLine={false}
            />
            <Radar
              name={data?.team?.name_cn || '球队A'}
              dataKey="value"
              stroke="#c4922e"
              fill="#c4922e"
              fillOpacity={0.25}
              strokeWidth={2}
            />
            <Radar
              name={compareData?.team?.name_cn || '球队B'}
              dataKey="compare"
              stroke="#3b82f6"
              fill="#3b82f6"
              fillOpacity={0.2}
              strokeWidth={2}
            />
            <Legend wrapperStyle={{ fontSize: 11 }} />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
