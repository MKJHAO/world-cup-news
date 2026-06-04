import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, Plus, LogIn, Copy, Check, Loader2, X } from 'lucide-react';
import { predictionGameAPI } from '../services/api';
import useUserStore from '../stores/userStore';

export default function GroupManager() {
  const { isLoggedIn, openRegister } = useUserStore();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(null);

  const fetchGroups = () => {
    if (!isLoggedIn) { setLoading(false); return; }
    setLoading(true);
    predictionGameAPI.getMyGroups()
      .then(r => { if (r.success) setGroups(r.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchGroups(); }, [isLoggedIn]);

  const handleCreate = async () => {
    if (!isLoggedIn) { openRegister(); return; }
    if (!groupName.trim()) { setError('请输入群组名称'); return; }
    setActionLoading(true); setError('');
    try {
      const res = await predictionGameAPI.createGroup(groupName.trim());
      if (res.success) {
        setShowCreate(false);
        setGroupName('');
        fetchGroups();
      }
    } catch (e) {
      setError(e.response?.data?.message || '创建失败');
    } finally { setActionLoading(false); }
  };

  const handleJoin = async () => {
    if (!isLoggedIn) { openRegister(); return; }
    if (!inviteCode.trim()) { setError('请输入邀请码'); return; }
    setActionLoading(true); setError('');
    try {
      const res = await predictionGameAPI.joinGroup(inviteCode.trim());
      if (res.success) {
        setShowJoin(false);
        setInviteCode('');
        fetchGroups();
      }
    } catch (e) {
      setError(e.response?.data?.message || '加入失败');
    } finally { setActionLoading(false); }
  };

  const copyInviteCode = (code) => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(code);
      setTimeout(() => setCopied(null), 2000);
    });
  };

  if (!isLoggedIn) {
    return (
      <div className="text-center py-12 text-white/30">
        <Users size={48} className="mx-auto mb-3 opacity-30" />
        <p className="text-sm mb-3">登录后即可创建或加入群组</p>
        <button onClick={openRegister} className="btn-primary text-sm mx-auto">注册/登录</button>
      </div>
    );
  }

  return (
    <div>
      {/* 操作按钮 */}
      <div className="flex gap-2 mb-5">
        <button onClick={() => setShowCreate(true)} className="btn-primary text-sm flex items-center gap-1.5 flex-1 justify-center">
          <Plus size={16} /> 创建群组
        </button>
        <button onClick={() => setShowJoin(true)} className="btn-outline text-sm flex items-center gap-1.5 flex-1 justify-center">
          <LogIn size={16} /> 加入群组
        </button>
      </div>

      {/* 我的群组列表 */}
      {loading ? (
        <div className="space-y-2">
          {[1, 2].map(i => <div key={i} className="h-20 shimmer rounded-xl" />)}
        </div>
      ) : groups.length === 0 ? (
        <div className="text-center py-8 text-white/30">
          <Users size={36} className="mx-auto mb-2 opacity-30" />
          <p className="text-sm">还没有加入任何群组</p>
          <p className="text-xs mt-1">创建一个群组或输入邀请码加入</p>
        </div>
      ) : (
        <div className="space-y-2">
          {groups.map(group => (
            <Link
              key={group.id}
              to={`/group/${group.id}`}
              className="glass-card p-4 flex items-center justify-between hover:border-gold/20 transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gold/10 flex items-center justify-center">
                  <Users size={18} className="text-gold" />
                </div>
                <div>
                  <p className="text-white font-medium text-sm group-hover:text-gold transition-colors">{group.name}</p>
                  <p className="text-xs text-white/30">
                    {group.member_count || 0} 位成员
                    {group.my_role === 'admin' ? ' · 群主' : ''}
                    {group.my_rank ? ` · 排名 #${group.my_rank}` : ''}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => { e.preventDefault(); copyInviteCode(group.invite_code); }}
                  className="text-xs text-white/20 hover:text-gold transition-colors flex items-center gap-1"
                >
                  {copied === group.invite_code ? <Check size={14} className="text-accent" /> : <Copy size={14} />}
                  {copied === group.invite_code ? '已复制' : group.invite_code}
                </button>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* 创建群组弹窗 */}
      {showCreate && (
        <Modal title="创建群组" onClose={() => { setShowCreate(false); setError(''); }}>
          <input
            type="text" value={groupName} onChange={e => { setGroupName(e.target.value); setError(''); }}
            placeholder="输入群组名称..." maxLength={30} autoFocus
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 focus:border-gold/40 outline-none"
          />
          {error && <p className="text-danger text-xs mt-2">{error}</p>}
          <button onClick={handleCreate} disabled={actionLoading}
            className="btn-primary w-full mt-3 flex items-center justify-center gap-2">
            {actionLoading ? <Loader2 size={16} className="animate-spin" /> : null}
            {actionLoading ? '创建中...' : '创建'}
          </button>
        </Modal>
      )}

      {/* 加入群组弹窗 */}
      {showJoin && (
        <Modal title="加入群组" onClose={() => { setShowJoin(false); setError(''); }}>
          <input
            type="text" value={inviteCode} onChange={e => { setInviteCode(e.target.value.toUpperCase()); setError(''); }}
            placeholder="输入6位邀请码..." maxLength={6} autoFocus
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 focus:border-gold/40 outline-none uppercase tracking-widest text-center"
          />
          {error && <p className="text-danger text-xs mt-2">{error}</p>}
          <button onClick={handleJoin} disabled={actionLoading}
            className="btn-primary w-full mt-3 flex items-center justify-center gap-2">
            {actionLoading ? <Loader2 size={16} className="animate-spin" /> : null}
            {actionLoading ? '加入中...' : '加入'}
          </button>
        </Modal>
      )}
    </div>
  );
}

function Modal({ title, children, onClose }) {
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative glass-card p-5 w-full max-w-sm animate-fadeIn">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-white font-bold">{title}</h4>
          <button onClick={onClose} className="text-white/30 hover:text-white/60"><X size={18} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}
