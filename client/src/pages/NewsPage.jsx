import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Newspaper, Clock, Sparkles } from 'lucide-react';
import useAppStore from '../stores/appStore';

const categoryLabels = { match_report: '战报', feature: '特写', award: '奖项', news: '新闻', player: '球员', interview: '采访', gossip: '花边', transfer: '转会', injury: '伤病', preview: '预告' };
const categoryColors = { match_report: 'bg-red-500/10 text-red-400', feature: 'bg-purple-500/10 text-purple-400', award: 'bg-gold/10 text-gold', news: 'bg-blue-500/10 text-blue-400', player: 'bg-accent/10 text-accent', gossip: 'bg-pink-500/10 text-pink-400', transfer: 'bg-orange-500/10 text-orange-400', injury: 'bg-red-600/10 text-red-300', preview: 'bg-cyan-500/10 text-cyan-400' };

export default function NewsPage() {
  const { news, newsLoading, fetchNews } = useAppStore();
  const [category, setCategory] = useState('');

  useEffect(() => { fetchNews(category ? { category } : {}); }, [category]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight flex items-center gap-3">
        <Newspaper className="w-6 h-6 text-gold" /> 新闻资讯
      </h1>

      <div className="flex gap-1.5 overflow-x-auto pb-1">
        <button onClick={() => setCategory('')}
          className={`px-4 py-2 rounded-xl text-sm whitespace-nowrap font-medium transition-all ${
            !category ? 'bg-gold text-dark shadow-lg shadow-gold/20' : 'glass-card !py-2 text-white/40 hover:text-white/80'
          }`}>全部</button>
        {Object.entries(categoryLabels).map(([k, v]) => (
          <button key={k} onClick={() => setCategory(k)}
            className={`px-4 py-2 rounded-xl text-sm whitespace-nowrap font-medium transition-all ${
              category === k ? 'bg-gold text-dark shadow-lg shadow-gold/20' : 'glass-card !py-2 text-white/40 hover:text-white/80'
            }`}>{v}</button>
        ))}
      </div>

      {newsLoading ? (
        <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="glass-card h-28 shimmer rounded-2xl" />)}</div>
      ) : (
        <div className="space-y-3 animate-stagger">
          {news.map(n => (
            <Link key={n.id} to={`/news/${n.id}`} className="glass-card block group match-card-hover">
              <div className="flex items-start gap-2 mb-2">
                <span className={`text-[9px] px-2 py-0.5 rounded-md font-semibold uppercase tracking-wider shrink-0 ${categoryColors[n.category] || 'bg-white/[0.06] text-white/35'}`}>
                  {categoryLabels[n.category] || n.category}
                </span>
                <span className="text-[10px] text-white/20 flex items-center gap-1 shrink-0">
                  <Clock className="w-3 h-3" />{n.published_at?.split(' ')[0]}
                </span>
              </div>
              <h2 className="text-[15px] font-bold leading-snug group-hover:text-gold transition-colors line-clamp-2">{n.title}</h2>
              <p className="text-[12px] text-white/35 mt-2 line-clamp-2 leading-relaxed">{n.summary}</p>
              {n.source && <div className="text-[10px] text-white/15 mt-2.5">来源：{n.source}</div>}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
