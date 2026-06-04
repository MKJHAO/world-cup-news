import { useState } from 'react';
import { User, X, Loader2 } from 'lucide-react';
import useUserStore from '../stores/userStore';

export default function UserRegisterModal() {
  const { showRegisterModal, closeRegister, register, loading } = useUserStore();
  const [nickname, setNickname] = useState('');
  const [error, setError] = useState('');

  if (!showRegisterModal) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!nickname.trim()) {
      setError('请输入昵称');
      return;
    }
    try {
      await register(nickname.trim());
    } catch (err) {
      setError(err.message || '注册失败，请重试');
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* 遮罩 */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closeRegister} />

      {/* 弹窗 */}
      <div className="relative glass-card p-6 w-full max-w-sm animate-fadeIn">
        <button
          onClick={closeRegister}
          className="absolute top-3 right-3 text-white/30 hover:text-white/60 transition-colors"
        >
          <X size={18} />
        </button>

        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-full bg-gold/15 flex items-center justify-center mx-auto mb-3">
            <User size={28} className="text-gold" />
          </div>
          <h3 className="text-lg font-bold text-white">加入竞猜联赛</h3>
          <p className="text-sm text-white/40 mt-1">输入昵称，开始你的预测之旅</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="text"
              value={nickname}
              onChange={(e) => { setNickname(e.target.value); setError(''); }}
              placeholder="输入你的昵称..."
              maxLength={20}
              autoFocus
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:border-gold/40 transition-colors"
            />
            {error && <p className="text-danger text-xs mt-1.5 ml-1">{error}</p>}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : null}
            {loading ? '注册中...' : '开始竞猜'}
          </button>
        </form>

        <p className="text-xs text-white/20 text-center mt-4">
          无需密码，昵称即身份。换设备需重新注册。
        </p>
      </div>
    </div>
  );
}
