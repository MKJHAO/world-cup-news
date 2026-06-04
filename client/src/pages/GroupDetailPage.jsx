import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Users, ArrowLeft, Copy, Check, Loader2, LogOut } from 'lucide-react';
import { predictionGameAPI } from '../services/api';
import useUserStore from '../stores/userStore';
import Leaderboard from '../components/Leaderboard';

export default function GroupDetailPage() {
  const { id } = useParams();
  const { user, isLoggedIn } = useUserStore();
  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    setLoading(true);
    predictionGameAPI.getGroup(parseInt(id))
      .then(r => { if (r.success) setGroup(r.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  const copyInviteCode = () => {
    if (!group) return;
    navigator.clipboard.writeText(group.invite_code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(null), 2000);
    });
  };

  const handleLeave = async () => {
    if (!confirm('确定要退出该群组吗？')) return;
    setLeaving(true);
    try {
      await predictionGameAPI.leaveGroup(parseInt(id));
      window.location.href = '/prediction-game';
    } catch (e) {
      alert(e.response?.data?.message || '退出失败');
    } finally {
      setLeaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 size={32} className="animate-spin text-gold" />
      </div>
    );
  }

  if (!group) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <Users size={48} className="mx-auto mb-3 text-white/20" />
        <p className="text-white/40 mb-4">群组不存在</p>
        <Link to="/prediction-game" className="btn-primary text-sm">返回竞猜</Link>
      </div>
    );
  }

  const isAdmin = group.members?.find(m => m.user_id === user?.id)?.role === 'admin';

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      {/* 返回 */}
      <Link to="/prediction-game" className="text-white/30 hover:text-white/60 text-sm flex items-center gap-1 mb-4">
        <ArrowLeft size={14} /> 返回竞猜
      </Link>

      {/* 群组信息 */}
      <div className="glass-card p-5 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gold/15 flex items-center justify-center">
              <Users size={22} className="text-gold" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">{group.name}</h1>
              <p className="text-sm text-white/30">{group.member_count || 0} 位成员</p>
            </div>
          </div>
          {isAdmin && <span className="text-xs text-gold bg-gold/10 px-2 py-0.5 rounded-full">群主</span>}
        </div>

        <div className="flex items-center gap-3">
          <div className="flex-1 bg-white/5 rounded-xl px-4 py-2.5 flex items-center justify-between">
            <span className="text-white/40 text-sm">邀请码</span>
            <span className="text-white font-mono font-bold tracking-widest">{group.invite_code}</span>
          </div>
          <button onClick={copyInviteCode} className="btn-outline text-sm flex items-center gap-1">
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? '已复制' : '复制'}
          </button>
        </div>

        {/* 退出按钮（非群主） */}
        {!isAdmin && isLoggedIn && (
          <button
            onClick={handleLeave}
            disabled={leaving}
            className="text-danger/50 hover:text-danger text-xs flex items-center gap-1 mt-3 transition-colors"
          >
            <LogOut size={12} /> {leaving ? '退出中...' : '退出群组'}
          </button>
        )}
      </div>

      {/* 群内排行榜 */}
      <div>
        <h3 className="section-title mb-3">🏆 群内排行榜</h3>
        <Leaderboard groupId={parseInt(id)} />
      </div>
    </div>
  );
}
