import { Link } from 'react-router-dom';

const colors = { W: 'bg-accent', D: 'bg-warning', L: 'bg-danger' };
const labels = { W: '胜', D: '平', L: '负' };

export default function FormIndicator({ form = [] }) {
  if (!form || form.length === 0) {
    return <span className="text-[10px] text-white/15">-</span>;
  }

  return (
    <div className="flex items-center gap-1" title={form.map(f => `${labels[f.result]} ${f.opponent_name} ${f.score}`).join(' · ')}>
      {form.map((f, i) => (
        <Link
          key={i}
          to={`/match/${f.match_id}`}
          className={`w-4 h-4 rounded-full ${colors[f.result] || 'bg-white/10'} hover:scale-125 transition-transform`}
          title={`${labels[f.result]} ${f.opponent_name} ${f.score}`}
        />
      ))}
    </div>
  );
}
