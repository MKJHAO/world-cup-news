import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock } from 'lucide-react';
import { newsAPI } from '../services/api';
import { ErrorState, LoadingSkeleton } from '../components/UIComponents';

const categoryLabels = { match_report: '战报', feature: '特写', award: '奖项', news: '新闻', player: '球员', interview: '采访', gossip: '花边', transfer: '转会', injury: '伤病', preview: '预告' };

export default function NewsDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    setError(false); setLoading(true);
    newsAPI.getById(parseInt(id))
      .then(r => { setArticle(r.data); document.title = r.data.title || '新闻详情'; })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="max-w-3xl mx-auto py-10"><LoadingSkeleton count={3} /></div>;
  if (error) return <ErrorState message="加载失败，请稍后重试" onRetry={() => window.location.reload()} />;
  if (!article) return <ErrorState title="新闻不存在" message="未找到该新闻" />;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <button onClick={() => window.history.length > 1 ? navigate(-1) : navigate('/news')} className="inline-flex items-center gap-1.5 text-white/35 hover:text-white/70 text-sm transition-colors">
        <ArrowLeft className="w-4 h-4" /> 返回
      </button>

      <article className="glass-card !p-6 md:!p-10">
        <div className="flex items-center gap-3 mb-5">
          <span className="text-[10px] px-2.5 py-0.5 rounded-md bg-gold/10 text-gold font-semibold uppercase tracking-wider">
            {categoryLabels[article.category] || article.category}
          </span>
          <span className="text-[11px] text-white/25 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />{article.published_at}
          </span>
          {article.source && <span className="text-[11px] text-white/20">来源：{article.source}</span>}
        </div>

        <h1 className="text-xl md:text-2xl font-bold leading-tight mb-5 tracking-tight">{article.title}</h1>

        {article.summary && (
          <div className="border-l-2 border-gold/40 pl-5 py-2 mb-6 text-white/50 text-sm leading-relaxed italic">
            {article.summary}
          </div>
        )}

        <div className="text-white/60 leading-relaxed whitespace-pre-line text-[15px]">
          {article.content}
        </div>
      </article>
    </div>
  );
}
