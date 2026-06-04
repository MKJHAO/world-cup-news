import { create } from 'zustand';
import { userAPI } from '../services/api';

const useUserStore = create((set, get) => ({
  user: null,
  token: localStorage.getItem('user_token') || null,
  isLoggedIn: false,
  loading: false,
  showRegisterModal: false,

  // 初始化：用本地token尝试恢复登录
  init: async () => {
    const token = localStorage.getItem('user_token');
    if (!token) return;
    set({ loading: true });
    try {
      const res = await userAPI.getMe();
      if (res.success) {
        set({ user: res.data, isLoggedIn: true, token });
      }
    } catch {
      localStorage.removeItem('user_token');
    } finally {
      set({ loading: false });
    }
  },

  // 注册
  register: async (nickname) => {
    set({ loading: true });
    try {
      const res = await userAPI.register(nickname);
      if (res.success) {
        localStorage.setItem('user_token', res.data.token);
        set({ user: res.data.user, token: res.data.token, isLoggedIn: true, showRegisterModal: false });
      }
      set({ loading: false });
      return res;
    } catch {
      set({ loading: false });
      throw new Error('注册失败');
    }
  },

  // 退出
  logout: () => {
    localStorage.removeItem('user_token');
    set({ user: null, token: null, isLoggedIn: false });
  },

  // 打开注册弹窗
  openRegister: () => set({ showRegisterModal: true }),
  closeRegister: () => set({ showRegisterModal: false }),

  // 更新本地用户积分
  updatePoints: (points) => {
    const { user } = get();
    if (user) {
      set({ user: { ...user, total_points: (user.total_points || 0) + points } });
    }
  }
}));

export default useUserStore;
