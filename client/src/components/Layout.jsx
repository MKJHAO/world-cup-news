import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, CalendarDays, BarChart3, Shield, Newspaper, Settings, Trophy, Wifi, WifiOff, Search, TrendingUp, Target, Swords } from 'lucide-react';
import { useSocket } from '../hooks/useSocket';
import useSwipeBack from '../hooks/useSwipeBack';
import useAppStore from '../stores/appStore';
import useUserStore from '../stores/userStore';
import SearchModal from './SearchModal';
import AiFloatingButton from './AiFloatingButton';
import AiChatPanel from './AiChatPanel';
import UserRegisterModal from './UserRegisterModal';
import { App } from '@capacitor/app';

const navItems = [
  { path: '/', label: '首页', Icon: Home },
  { path: '/matches', label: '赛程', Icon: CalendarDays },
  { path: '/standings', label: '积分榜', Icon: BarChart3 },
  { path: '/teams', label: '球队', Icon: Shield },
  { path: '/prediction-game', label: '竞猜', Icon: Swords },
  { path: '/news', label: '新闻', Icon: Newspaper }
];

export default function Layout({ children }) {
  const location = useLocation();
  const { connected } = useAppStore();
  const [searchOpen, setSearchOpen] = useState(false);
  useSocket();
  const { swipeProgress, isDetailPage } = useSwipeBack({ threshold: 70, edgeWidth: 40 });

  // 初始化用户状态
  const userStore = useUserStore();
  useEffect(() => { userStore.init(); }, []);

  // 安卓返回键监听 (Capacitor)
  useEffect(() => {
    try {
      const handler = App.addListener('backButton', ({ canGoBack }) => {
        if (canGoBack) {
          window.history.back();
        } else {
          App.minimizeApp();
        }
      });
      return () => handler.remove();
    } catch {}
  }, []);

  useEffect(() => {
    const handleKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, []);

  const isActive = (path) => location.pathname === path;

  return (
    <div className="min-h-screen bg-dark flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-white/[0.04] landscape:h-10"
        style={{
          background: 'linear-gradient(180deg, rgba(17,26,38,0.95) 0%, rgba(17,26,38,0.85) 100%)',
          backdropFilter: 'blur(20px)',
          paddingTop: 'env(safe-area-inset-top, 0px)'
        }}>
        <div className="max-w-7xl mx-auto px-4 h-14 landscape:h-10 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group shrink-0 landscape:gap-1.5">
            <div className="w-8 h-8 landscape:w-6 landscape:h-6 rounded-lg bg-gradient-to-br from-gold to-yellow-500 flex items-center justify-center
              shadow-lg shadow-gold/30 group-hover:shadow-gold/50 transition-shadow">
              <Trophy className="w-4.5 h-4.5 landscape:w-3.5 landscape:h-3.5 text-dark" strokeWidth={2.5} />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-sm font-bold text-white tracking-wide landscape:text-[11px]">World Cup</span>
              <span className="text-[10px] text-gold/60 tracking-[0.15em] uppercase landscape:hidden">2022 - 2026</span>
            </div>
          </Link>

          {/* Search Bar - Desktop */}
          <button onClick={() => setSearchOpen(true)}
            className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-xs text-white/25 hover:text-white/50 hover:border-white/[0.12] transition-all mx-4 flex-1 max-w-[280px]">
            <Search className="w-3.5 h-3.5" />
            <span className="flex-1 text-left">搜索球队、比赛...</span>
            <kbd className="text-[9px] px-1.5 py-0.5 rounded-md bg-white/[0.04] text-white/15 border border-white/[0.04]">Ctrl+K</kbd>
          </button>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-0.5">
            {navItems.map(({ path, label, Icon }) => (
              <Link
                key={path}
                to={path}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[13px] font-medium transition-all duration-200 focus-visible:ring-1 focus-visible:ring-gold/50 ${
                  isActive(path)
                    ? 'bg-gold/15 text-gold shadow-inner'
                    : 'text-white/50 hover:text-white/90 hover:bg-white/[0.04]'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive(path) ? 'text-gold' : ''}`} strokeWidth={1.75} />
                {label}
              </Link>
            ))}
            <div className="w-px h-5 bg-white/[0.06] mx-1" />
            <Link
              to="/prediction"
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[13px] font-medium transition-all duration-200 focus-visible:ring-1 focus-visible:ring-gold/50 ${
                isActive('/prediction')
                  ? 'bg-gold/15 text-gold'
                  : 'text-white/40 hover:text-white/70 hover:bg-white/[0.04]'
              }`}
            >
              <Target className="w-4 h-4" strokeWidth={1.75} />
              沙盘
            </Link>
            <Link
              to="/bracket-challenge"
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[13px] font-medium transition-all duration-200 focus-visible:ring-1 focus-visible:ring-gold/50 ${
                isActive('/bracket-challenge')
                  ? 'bg-gold/15 text-gold'
                  : 'text-white/40 hover:text-white/70 hover:bg-white/[0.04]'
              }`}
            >
              <Trophy className="w-4 h-4" strokeWidth={1.75} />
              Bracket
            </Link>
            <Link
              to="/analysis"
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[13px] font-medium transition-all duration-200 focus-visible:ring-1 focus-visible:ring-gold/50 ${
                isActive('/analysis')
                  ? 'bg-gold/15 text-gold'
                  : 'text-white/40 hover:text-white/70 hover:bg-white/[0.04]'
              }`}
            >
              <TrendingUp className="w-4 h-4" strokeWidth={1.75} />
              分析
            </Link>
            <Link
              to="/admin"
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[13px] font-medium transition-all duration-200 focus-visible:ring-1 focus-visible:ring-gold/50 ${
                isActive('/admin')
                  ? 'bg-gold/15 text-gold'
                  : 'text-white/30 hover:text-white/60 hover:bg-white/[0.04]'
              }`}
            >
              <Settings className="w-4 h-4" strokeWidth={1.75} />
              管理
            </Link>
            <div className="ml-2 flex items-center gap-1.5 text-[10px] text-white/25">
              {connected ? <Wifi className="w-3 h-3 text-accent/60" /> : <WifiOff className="w-3 h-3 text-danger/60" />}
            </div>
          </nav>

          {/* Mobile Search */}
          <button onClick={() => setSearchOpen(true)}
            className="md:hidden p-2 rounded-xl text-white/35 hover:text-white/60 transition-colors">
            <Search className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Mobile Bottom Nav — 横屏时移至左侧垂直栏 */}
      <nav className="md:hidden fixed landscape:left-0 landscape:top-10 landscape:bottom-0 landscape:w-14 landscape:h-auto
        bottom-0 left-0 right-0 z-50 border-t border-white/[0.04] landscape:border-t-0 landscape:border-r"
        style={{ background: 'linear-gradient(0deg, rgba(17,26,38,0.98) 0%, rgba(17,26,38,0.9) 100%)', backdropFilter: 'blur(20px)', paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
        <div className="flex landscape:flex-col justify-around landscape:justify-start landscape:gap-1 landscape:pt-2 items-center h-14 landscape:h-full px-2 landscape:px-0">
          {navItems.map(({ path, label, Icon }) => (
            <Link
              key={path}
              to={path}
              className={`flex flex-col landscape:flex-col items-center gap-0.5 landscape:gap-0 py-1 px-3 landscape:px-0 landscape:py-2 rounded-xl min-w-0 transition-colors ${
                isActive(path) ? 'text-gold' : 'text-white/35'
              }`}
            >
              <Icon className="w-5 h-5 landscape:w-4.5 landscape:h-4.5" strokeWidth={isActive(path) ? 2 : 1.5} />
              <span className="text-[10px] font-medium landscape:text-[8px]">{label}</span>
            </Link>
          ))}
        </div>
      </nav>

      {/* 侧滑返回指示器 (仅手机端详情页) */}
      {isDetailPage && (
        <div
          className="md:hidden fixed left-0 top-0 bottom-0 z-[60] pointer-events-none transition-opacity duration-200"
          style={{ width: '40px', opacity: swipeProgress > 0 ? 0 : 0.4 }}
        >
          <div className="absolute left-2 top-1/2 -translate-y-1/2 w-0.5 h-16 rounded-full bg-gradient-to-b from-transparent via-gold/40 to-transparent" />
        </div>
      )}
      {/* 滑动进度遮罩 */}
      {swipeProgress > 0 && (
        <div
          className="md:hidden fixed inset-0 z-[55] pointer-events-none transition-opacity duration-100"
          style={{ background: `rgba(196, 146, 46, ${swipeProgress * 0.08})` }}
        />
      )}

      {/* Main Content — 横屏时左侧偏移给垂直导航 */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 landscape:px-2 py-5 md:py-8 landscape:py-2 pb-20 md:pb-8 landscape:pb-2 landscape:pl-16">
        <div className="animate-fade-in">
          {children}
        </div>
      </main>

      {/* Footer — 横屏时隐藏 */}
      <footer className="hidden md:block landscape:hidden border-t border-white/[0.03] py-6 text-center">
        <div className="flex items-center justify-center gap-6 text-xs text-white/25">
          <span>FIFA World Cup 2022-2026</span>
          <span className="w-1 h-1 rounded-full bg-white/10" />
          <span>数据来源：FIFA官方</span>
          <span className="w-1 h-1 rounded-full bg-white/10" />
          <span>仅供学习参考</span>
        </div>
      </footer>

      {/* Search Modal */}
      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />

      {/* AI浮动按钮 + 聊天面板 */}
      <AiFloatingButton />
      <AiChatPanel />

      {/* 用户注册弹窗 */}
      <UserRegisterModal />
    </div>
  );
}
