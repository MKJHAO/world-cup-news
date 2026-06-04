import { useEffect, useState } from 'react';
import { Settings, Edit3, Trash2, Plus, Save, X, RefreshCw, Zap, Target, Star, LogOut, Lock } from 'lucide-react';
import { adminAPI, authAPI } from '../services/api';

const statusOptions = ['scheduled', 'live', 'first_half', 'halftime', 'second_half', 'completed'];

export default function AdminPage() {
  const [authenticated, setAuthenticated] = useState(false);
  const [checking, setChecking] = useState(true);
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [tab, setTab] = useState('matches');
  const [stats, setStats] = useState(null);
  const [matches, setMatches] = useState([]);
  const [news, setNews] = useState([]);
  const [showAddNews, setShowAddNews] = useState(false);
  const [newArticle, setNewArticle] = useState({ title: '', summary: '', content: '', category: 'news', source: '' });
  const [editingMatches, setEditingMatches] = useState({});

  useEffect(() => {
    authAPI.check().then(r => {
      if (r.success) {
        setAuthenticated(true);
        loadData();
      }
      setChecking(false);
    });
  }, []);

  const loadData = () => {
    adminAPI.getStats().then(r => r.success && setStats(r.data));
    loadMatches();
    loadNews();
  };

  const loadMatches = () => adminAPI.getMatches().then(r => r.success && setMatches(r.data));
  const loadNews = () => adminAPI.getNews().then(r => r.success && setNews(r.data));

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!password) return;
    setLoginLoading(true);
    setLoginError('');
    try {
      const r = await authAPI.login(password);
      if (r.success) {
        sessionStorage.setItem('admin_token', r.token);
        setAuthenticated(true);
        loadData();
      }
    } catch (err) {
      setLoginError(err.response?.data?.message || '登录失败');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = async () => {
    await authAPI.logout();
    sessionStorage.removeItem('admin_token');
    setAuthenticated(false);
  };

  const handleMatchUpdate = async (id) => {
    const data = editingMatches[id];
    if (!data) return;
    await adminAPI.updateMatch(id, data);
    setEditingMatches(prev => { const n = { ...prev }; delete n[id]; return n; });
    loadMatches();
  };

  const handleAddNews = async () => {
    if (!newArticle.title || !newArticle.content) return;
    await adminAPI.createNews(newArticle);
    setNewArticle({ title: '', summary: '', content: '', category: 'news', source: '' });
    setShowAddNews(false);
    loadNews();
  };

  const handleDeleteNews = async (id) => { if (!confirm('确定删除？')) return; await adminAPI.deleteNews(id); loadNews(); };

  if (checking) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh]">
        <div className="glass-card max-w-md w-full text-center space-y-6 p-8">
          <div className="w-16 h-16 rounded-2xl bg-gold/10 flex items-center justify-center mx-auto">
            <Lock className="w-8 h-8 text-gold" />
          </div>
          <div>
            <h2 className="text-xl font-bold">管理员登录</h2>
            <p className="text-sm text-white/40 mt-1">请输入管理密码以继续</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-3">
            <input
              type="password"
              className="w-full bg-dark border border-white/[0.1] rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-gold/40 text-center"
              placeholder="请输入管理密码"
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoFocus
            />
            {loginError && <div className="text-xs text-danger">{loginError}</div>}
            <button
              type="submit"
              disabled={loginLoading}
              className="btn-primary w-full py-3 text-sm font-semibold disabled:opacity-50"
            >
              {loginLoading ? '验证中...' : '登录'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-3">
          <Settings className="w-6 h-6 text-gold" /> 后台管理
        </h1>
        <button onClick={handleLogout} className="glass-card !py-2 !px-3 text-white/40 hover:text-danger transition-colors flex items-center gap-1.5 text-xs">
          <LogOut className="w-3.5 h-3.5" /> 退出
        </button>
      </div>

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { v: stats.totalMatches, l: '总比赛', c: 'text-gold', Icon: Zap },
            { v: stats.totalGoals, l: '总进球', c: 'text-accent', Icon: Target },
            { v: stats.avgGoals, l: '场均进球', c: 'text-warning', Icon: Star },
            { v: stats.totalTeams, l: '球队', c: 'text-blue-400', Icon: Star },
            { v: stats.totalPlayers, l: '球员', c: 'text-purple-400', Icon: Star }
          ].map((s, i) => (
            <div key={i} className="glass-card text-center">
              <div className={`text-xl font-bold ${s.c}`}>{s.v}</div>
              <div className="text-[11px] text-white/30 mt-1">{s.l}</div>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-1.5">
        {['matches', 'news'].map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              tab === t ? 'bg-gold text-dark shadow-lg shadow-gold/20' : 'glass-card !py-2.5 text-white/40 hover:text-white/80'
            }`}>{t === 'matches' ? '比赛管理' : '新闻管理'}</button>
        ))}
      </div>

      {tab === 'matches' && (
        <div className="glass-card !p-0 overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-white/[0.04]">
            <h2 className="font-bold text-sm">比赛列表</h2>
            <button onClick={loadMatches} className="text-white/30 hover:text-white/70 transition-colors"><RefreshCw className="w-3.5 h-3.5" /></button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[10px] text-white/25 uppercase tracking-wider border-b border-white/[0.04]">
                  <th className="py-3 pl-4 text-left">ID</th>
                  <th className="py-3 text-left">比赛</th>
                  <th className="py-3 text-center">比分</th>
                  <th className="py-3 text-center">状态</th>
                  <th className="py-3 text-left hidden md:table-cell">日期</th>
                  <th className="py-3 pr-4 text-center">操作</th>
                </tr>
              </thead>
              <tbody>
                {matches.slice(0, 20).map(m => (
                  <tr key={m.id} className="border-b border-white/[0.02] hover:bg-white/[0.02]">
                    <td className="py-2.5 pl-4 text-white/20 text-xs">{m.id}</td>
                    <td className="py-2.5 text-[13px] font-medium">{m.home_team_cn} vs {m.away_team_cn}</td>
                    <td className="py-2.5 text-center">
                      {editingMatches[m.id] ? (
                        <span className="inline-flex items-center gap-1">
                          <input type="number" className="w-12 bg-dark border border-white/[0.1] rounded-lg px-1.5 py-1 text-center text-white text-sm"
                            value={editingMatches[m.id].home_score} onChange={e => setEditingMatches(p => ({ ...p, [m.id]: { ...p[m.id], home_score: parseInt(e.target.value) || 0 }}))} />
                          <span className="text-white/20">-</span>
                          <input type="number" className="w-12 bg-dark border border-white/[0.1] rounded-lg px-1.5 py-1 text-center text-white text-sm"
                            value={editingMatches[m.id].away_score} onChange={e => setEditingMatches(p => ({ ...p, [m.id]: { ...p[m.id], away_score: parseInt(e.target.value) || 0 }}))} />
                        </span>
                      ) : <span className="font-bold">{m.home_score} - {m.away_score}</span>}
                    </td>
                    <td className="py-2.5 text-center">
                      {editingMatches[m.id] ? (
                        <select className="bg-dark border border-white/[0.1] rounded-lg px-1.5 py-1 text-white text-xs"
                          value={editingMatches[m.id].status} onChange={e => setEditingMatches(p => ({ ...p, [m.id]: { ...p[m.id], status: e.target.value }}))}>
                          {statusOptions.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      ) : <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                        m.status === 'completed' ? 'bg-white/[0.06] text-white/40' : m.status === 'live' ? 'bg-red-600/20 text-red-400' : 'bg-white/[0.03] text-white/30'
                      }`}>{m.status}</span>}
                    </td>
                    <td className="py-2.5 text-white/30 text-xs hidden md:table-cell">{m.match_date}</td>
                    <td className="py-2.5 pr-4 text-center">
                      {editingMatches[m.id] ? (
                        <span className="inline-flex items-center gap-1">
                          <button onClick={() => handleMatchUpdate(m.id)} className="text-accent hover:text-green-400 transition-colors"><Save className="w-3.5 h-3.5" /></button>
                          <button onClick={() => setEditingMatches(p => { const n = { ...p }; delete n[m.id]; return n; })} className="text-white/30 hover:text-white"><X className="w-3.5 h-3.5" /></button>
                        </span>
                      ) : (
                        <button onClick={() => setEditingMatches(p => ({ ...p, [m.id]: { status: m.status, home_score: m.home_score, away_score: m.away_score, home_penalty: m.home_penalty, away_penalty: m.away_penalty }}))}
                          className="text-white/25 hover:text-gold transition-colors"><Edit3 className="w-3.5 h-3.5" /></button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'news' && (
        <div className="glass-card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-sm">新闻列表</h2>
            <button onClick={() => setShowAddNews(!showAddNews)} className="btn-primary text-xs flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5" /> 新增
            </button>
          </div>

          {showAddNews && (
            <div className="mb-5 p-5 bg-dark/50 rounded-2xl space-y-3 border border-white/[0.04]">
              <input className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-gold/40"
                placeholder="标题" value={newArticle.title} onChange={e => setNewArticle(p => ({ ...p, title: e.target.value }))} />
              <input className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-gold/40"
                placeholder="摘要" value={newArticle.summary} onChange={e => setNewArticle(p => ({ ...p, summary: e.target.value }))} />
              <textarea className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-gold/40 resize-none"
                rows={4} placeholder="内容" value={newArticle.content} onChange={e => setNewArticle(p => ({ ...p, content: e.target.value }))} />
              <div className="flex gap-2">
                <select className="bg-white/[0.04] border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-sm text-white/70"
                  value={newArticle.category} onChange={e => setNewArticle(p => ({ ...p, category: e.target.value }))}>
                  <option value="news" className="bg-dark">新闻</option><option value="match_report" className="bg-dark">战报</option>
                  <option value="feature" className="bg-dark">特写</option><option value="award" className="bg-dark">奖项</option>
                  <option value="player" className="bg-dark">球员</option><option value="gossip" className="bg-dark">花边</option>
                  <option value="transfer" className="bg-dark">转会</option><option value="injury" className="bg-dark">伤病</option>
                  <option value="preview" className="bg-dark">预告</option>
                </select>
                <input className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-gold/40"
                  placeholder="来源" value={newArticle.source} onChange={e => setNewArticle(p => ({ ...p, source: e.target.value }))} />
                <button onClick={handleAddNews} className="btn-primary text-sm px-6">发布</button>
              </div>
            </div>
          )}

          <div className="space-y-1">
            {news.map(n => (
              <div key={n.id} className="flex items-center justify-between py-2.5 px-3 rounded-xl hover:bg-white/[0.03] transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-medium truncate">{n.title}</div>
                  <div className="text-[10px] text-white/25 mt-0.5">{n.published_at?.split(' ')[0]} · {n.category}</div>
                </div>
                <button onClick={() => handleDeleteNews(n.id)} className="text-white/20 hover:text-danger transition-colors ml-3 shrink-0">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
