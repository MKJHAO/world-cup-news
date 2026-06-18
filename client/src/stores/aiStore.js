import { create } from 'zustand';
import { aiAPI } from '../services/api';

const HISTORY_KEY = 'ai_chat_history';
const MAX_HISTORY = 100;

function loadHistory() {
  try {
    const saved = localStorage.getItem(HISTORY_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

function saveHistory(msgs) {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(msgs.slice(-MAX_HISTORY)));
  } catch { /* ignore */ }
}

const useAiStore = create((set, get) => ({
  messages: loadHistory(),
  commentaryMessages: [],  // 解说消息独立存储，不混入聊天历史
  isOpen: false,
  isLoading: false,
  style: 'professional',
  unreadCount: 0,

  setOpen: (open) => {
    set({ isOpen: open, unreadCount: open ? 0 : get().unreadCount });
  },

  togglePanel: () => {
    const { isOpen } = get();
    set({ isOpen: !isOpen, unreadCount: !isOpen ? 0 : get().unreadCount });
  },

  setStyle: (style) => set({ style }),

  sendMessage: async (text) => {
    const { messages, style } = get();
    // 只传纯粹的聊天消息（不含解说），避免污染LLM上下文
    const chatOnly = messages.filter(m => !m.isCommentary);
    const userMsg = { role: 'user', content: text, timestamp: Date.now() };
    const newMsgs = [...chatOnly, userMsg];
    set({ messages: newMsgs, isLoading: true });
    saveHistory(newMsgs);

    try {
      const res = await aiAPI.chat(text, chatOnly.slice(-20), style);
      const aiMsg = {
        role: 'assistant',
        content: res.data?.reply || '抱歉，AI服务暂时不可用。',
        timestamp: Date.now(),
        contextUsed: res.data?.contextUsed
      };
      const final = [...newMsgs, aiMsg];
      set({ messages: final, isLoading: false });
      saveHistory(final);
    } catch {
      set({ isLoading: false });
      const errMsg = {
        role: 'assistant',
        content: '😔 抱歉，AI服务连接失败，请稍后重试。',
        timestamp: Date.now()
      };
      const final = [...newMsgs, errMsg];
      set({ messages: final });
      saveHistory(final);
    }
  },

  // 解说消息写入独立数组，不污染聊天历史
  addCommentary: (text) => {
    const msg = {
      role: 'assistant',
      content: text,
      timestamp: Date.now(),
      isCommentary: true
    };
    const { isOpen } = get();
    set(state => ({
      commentaryMessages: [...state.commentaryMessages.slice(-49), msg],
      unreadCount: isOpen ? 0 : get().unreadCount + 1
    }));
  },

  clearHistory: () => {
    localStorage.removeItem(HISTORY_KEY);
    set({ messages: [], commentaryMessages: [] });
  }
}));

export default useAiStore;
