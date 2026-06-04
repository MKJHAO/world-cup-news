import { Bot } from 'lucide-react';
import useAiStore from '../stores/aiStore';

export default function AiFloatingButton() {
  const { togglePanel, unreadCount } = useAiStore();

  return (
    <button
      onClick={togglePanel}
      className="fixed bottom-24 md:bottom-6 right-4 md:right-6 z-40 w-14 h-14 rounded-full bg-gradient-to-br from-gold to-amber-500 shadow-lg shadow-gold/20 flex items-center justify-center hover:scale-110 active:scale-95 transition-all group"
      title="AI智能助手"
    >
      <Bot size={26} className="text-dark group-hover:scale-110 transition-transform" />

      {/* 脉冲动画环 */}
      <span className="absolute inset-0 rounded-full border-2 border-gold animate-ping opacity-40" />

      {/* 未读消息数 */}
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 w-5 h-5 bg-danger text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-fadeIn">
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </button>
  );
}
