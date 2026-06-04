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
    const userMsg = { role: 'user', content: text, timestamp: Date.now() };
    const newMsgs = [...messages, userMsg];
    set({ messages: newMsgs, isLoading: true });
    saveHistory(newMsgs);

    try {
      const res = await aiAPI.chat(text, messages.slice(-20), style);
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

  addCommentary: (text) => {
    const msg = {
      role: 'assistant',
      content: `📢 ${text}`,
      timestamp: Date.now(),
      isCommentary: true
    };
    const { messages, isOpen } = get();
    const newMsgs = [...messages, msg];
    set({
      messages: newMsgs,
      unreadCount: isOpen ? 0 : get().unreadCount + 1
    });
    saveHistory(newMsgs);
  },

  clearHistory: () => {
    localStorage.removeItem(HISTORY_KEY);
    set({ messages: [] });
  }
}));

export default useAiStore;
