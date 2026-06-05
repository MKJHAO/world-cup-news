import { useState, useEffect, useRef } from 'react';
import { Send, MessageCircle } from 'lucide-react';
import { getSocket, sendChatMessage, fetchChatHistory, subscribeMatch } from '../hooks/useSocket';
import useUserStore from '../stores/userStore';

const ANON_NAMES = ['球迷小明', '球迷老张', '球迷阿杰', '球迷大卫', '球迷小马'];

function getAnonName() {
  const stored = sessionStorage.getItem('chat_name');
  if (stored) return stored;
  const name = ANON_NAMES[Math.floor(Math.random() * ANON_NAMES.length)] + Math.floor(Math.random() * 99);
  sessionStorage.setItem('chat_name', name);
  return name;
}

export default function LiveChat({ matchId, matchStatus }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [minimized, setMinimized] = useState(false);
  const messagesEndRef = useRef(null);
  const { user, isLoggedIn } = useUserStore();
  const userName = isLoggedIn ? user.nickname : getAnonName();
  const userId = isLoggedIn ? user.id : 0;

  // 加载历史消息
  useEffect(() => {
    setLoading(true);
    subscribeMatch(matchId);
    fetchChatHistory(matchId).then(msgs => {
      setMessages(msgs);
      setLoading(false);
    });
  }, [matchId]);

  // 监听实时消息
  useEffect(() => {
    const s = getSocket();
    const handler = (msg) => {
      if (msg.match_id === matchId) {
        setMessages(prev => [...prev.slice(-199), msg]);
      }
    };
    s.on('match_chat_message', handler);
    return () => s.off('match_chat_message', handler);
  }, [matchId]);

  // 自动滚动
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;
    sendChatMessage(matchId, input.trim(), userName, userId);
    setInput('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const isLive = matchStatus === 'live' || matchStatus === 'first_half' || matchStatus === 'second_half';

  return (
    <div className="glass-card p-0 overflow-hidden">
      {/* 头部 */}
      <div
        className="flex items-center justify-between px-4 py-3 border-b border-white/5 cursor-pointer select-none"
        onClick={() => setMinimized(!minimized)}
      >
        <div className="flex items-center gap-2">
          <MessageCircle size={16} className="text-gold" />
          <h3 className="text-sm font-bold text-white">
            球迷聊天室
            {isLive && (
              <span className="ml-2 inline-flex items-center gap-1 text-[10px] text-accent">
                <span className="w-1.5 h-1.5 rounded-full bg-accent animate-live-pulse" />
                直播中
              </span>
            )}
          </h3>
        </div>
        <span className="text-xs text-white/30">
          {messages.length} 条消息 {minimized ? '▸' : '▾'}
        </span>
      </div>

      {!minimized && (
        <>
          {/* 消息列表 */}
          <div className="h-52 overflow-y-auto px-4 py-3 space-y-2.5">
            {loading ? (
              <div className="text-center py-8 text-white/20 text-xs">加载中...</div>
            ) : messages.length === 0 ? (
              <div className="text-center py-8 text-white/20 text-xs">
                <MessageCircle size={24} className="mx-auto mb-2 opacity-20" />
                暂无消息，来发第一条吧！
              </div>
            ) : (
              messages.map((msg, i) => {
                const isMe = (isLoggedIn && msg.user_id === userId) || (!isLoggedIn && msg.user_name === userName);
                return (
                  <div key={msg.id || i} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] ${isMe ? 'order-2' : ''}`}>
                      <div className="flex items-baseline gap-2 mb-0.5">
                        <span className={`text-[10px] font-medium ${isMe ? 'text-gold/60' : 'text-white/30'}`}>
                          {msg.user_name}
                          {isMe && ' (你)'}
                        </span>
                        <span className="text-[9px] text-white/15">
                          {msg.created_at ? new Date(msg.created_at).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }) : ''}
                        </span>
                      </div>
                      <div className={`text-xs px-3 py-1.5 rounded-2xl ${
                        isMe
                          ? 'bg-gold/15 border border-gold/20 text-white/90 rounded-br-sm'
                          : 'bg-white/[0.04] border border-white/5 text-white/70 rounded-bl-sm'
                      }`}>
                        {msg.message}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* 输入框 */}
          <div className="px-3 py-2.5 border-t border-white/5 flex gap-2">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="说点什么..."
              maxLength={500}
              className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white placeholder-white/20 outline-none focus:border-gold/40 transition-colors"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim()}
              className="w-8 h-8 rounded-lg bg-gold flex items-center justify-center disabled:opacity-30 hover:bg-gold-light transition-colors flex-shrink-0"
            >
              <Send size={13} className="text-dark" />
            </button>
          </div>
        </>
      )}
    </div>
  );
}
