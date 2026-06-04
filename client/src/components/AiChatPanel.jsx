import { useState, useRef, useEffect } from 'react';
import { X, Send, Loader2, Bot, Trash2, Sparkles, User } from 'lucide-react';
import useAiStore from '../stores/aiStore';

const QUICK_ASKS = [
  { text: '🏆 预测一下冠军', query: '根据目前的数据，哪支球队最有可能获得2026世界杯冠军？' },
  { text: '📊 实力排名', query: '给我展示一下目前球队实力排名前十' },
  { text: '🇧🇷 巴西队分析', query: '分析一下巴西队的实力和晋级前景' },
  { text: '📅 今日赛程', query: '今天有哪些比赛？' }
];

const STYLES = [
  { value: 'professional', label: '专业', icon: '🎙️' },
  { value: 'humorous', label: '幽默', icon: '😄' },
  { value: 'dialect', label: '接地气', icon: '🤝' }
];

export default function AiChatPanel() {
  const { messages, isOpen, isLoading, style, setOpen, setStyle, sendMessage, clearHistory } = useAiStore();
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // 自动聚焦输入框
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSend = () => {
    if (!input.trim() || isLoading) return;
    sendMessage(input.trim());
    setInput('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* 移动端遮罩 */}
      <div className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40" onClick={() => setOpen(false)} />

      {/* 聊天面板 */}
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-[400px] bg-card border-l border-white/5 flex flex-col shadow-2xl animate-fadeIn">
        {/* 头部 */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-gold to-amber-500 flex items-center justify-center">
              <Sparkles size={18} className="text-dark" />
            </div>
            <div>
              <h3 className="text-white font-bold text-sm">AI球探助手</h3>
              <p className="text-[10px] text-white/30">Powered by DeepSeek</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {/* 风格选择 */}
            <select
              value={style}
              onChange={e => setStyle(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-xs text-white/60 outline-none cursor-pointer"
            >
              {STYLES.map(s => (
                <option key={s.value} value={s.value}>{s.icon} {s.label}</option>
              ))}
            </select>
            {/* 清空 */}
            <button onClick={clearHistory} className="text-white/20 hover:text-white/50 p-1.5" title="清空对话">
              <Trash2 size={16} />
            </button>
            {/* 关闭 */}
            <button onClick={() => setOpen(false)} className="text-white/30 hover:text-white/60 p-1.5">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* 消息区域 */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {/* 欢迎消息 */}
          {messages.length === 0 && (
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-2xl bg-gold/10 flex items-center justify-center mx-auto mb-4">
                <Bot size={32} className="text-gold" />
              </div>
              <p className="text-white font-semibold mb-1">你好，我是AI球探助手！⚽</p>
              <p className="text-white/30 text-sm mb-5">我可以帮你分析球队实力、预测比赛走势、解读赔率数据，随便问！</p>

              {/* 快捷提问 */}
              <div className="grid grid-cols-2 gap-2">
                {QUICK_ASKS.map((qa, i) => (
                  <button
                    key={i}
                    onClick={() => sendMessage(qa.query)}
                    className="text-left p-3 rounded-xl bg-white/[0.03] border border-white/5 hover:border-gold/20 hover:bg-gold/[0.03] text-white/60 hover:text-gold text-xs transition-all"
                  >
                    {qa.text}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 消息列表 */}
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex gap-2.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'assistant' && (
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-gold to-amber-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Sparkles size={12} className="text-dark" />
                </div>
              )}

              <div
                className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap break-words ${
                  msg.role === 'user'
                    ? 'bg-gold/15 border border-gold/20 text-white rounded-br-md'
                    : msg.isCommentary
                      ? 'bg-accent/10 border border-accent/20 text-accent rounded-bl-md'
                      : 'bg-white/[0.04] border border-white/5 text-white/80 rounded-bl-md'
                }`}
              >
                {msg.content}
                <div className={`text-[10px] mt-1 ${msg.role === 'user' ? 'text-white/20 text-right' : 'text-white/15'}`}>
                  {new Date(msg.timestamp).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>

              {msg.role === 'user' && (
                <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <User size={14} className="text-white/50" />
                </div>
              )}
            </div>
          ))}

          {/* 加载中 */}
          {isLoading && (
            <div className="flex gap-2.5">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-gold to-amber-500 flex items-center justify-center flex-shrink-0">
                <Sparkles size={12} className="text-dark" />
              </div>
              <div className="bg-white/[0.04] border border-white/5 rounded-2xl rounded-bl-md px-4 py-3">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-gold/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-gold/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-gold/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* 输入区域 */}
        <div className="p-3 border-t border-white/5">
          <div className="flex gap-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="问点什么... (Enter发送)"
              rows={1}
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/20 resize-none outline-none focus:border-gold/40 transition-colors"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="w-10 h-10 rounded-xl bg-gold flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gold-light transition-colors flex-shrink-0"
            >
              {isLoading ? <Loader2 size={18} className="animate-spin text-dark" /> : <Send size={18} className="text-dark" />}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
