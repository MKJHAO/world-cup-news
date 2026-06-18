import { useEffect } from 'react';
import { io } from 'socket.io-client';
import useAppStore from '../stores/appStore';

let socket = null;

export function getSocket() {
  if (!socket) {
    socket = io('/', { transports: ['websocket', 'polling'] });
  }
  return socket;
}

export function useSocket() {
  const { setConnected, updateMatchInList, addMatchEvent } = useAppStore();

  useEffect(() => {
    const s = getSocket();

    s.on('connect', () => setConnected(true));
    s.on('disconnect', () => setConnected(false));
    s.on('match_updated', (match) => updateMatchInList(match));

    // 比赛事件实时推送
    s.on('match_event_added', (event) => addMatchEvent(event));

    // AI实时解说
    s.on('ai_commentary', (data) => {
      // 动态导入避免循环依赖
      import('../stores/aiStore').then(mod => {
        mod.default.getState().addCommentary(data.text);
      });
    });

    // 预测评分通知
    s.on('prediction_scored', (data) => {
      import('../stores/userStore').then(mod => {
        mod.default.getState().updatePoints(data.points);
      });
    });

    // 比赛专属解说
    s.onAny((event, data) => {
      if (event.startsWith('match_') && event.endsWith('_commentary')) {
        import('../stores/aiStore').then(mod => {
          mod.default.getState().addCommentary(data.text);
        });
      }
    });

    return () => {
      s.off('connect');
      s.off('disconnect');
      s.off('match_updated');
      s.off('match_event_added');
      s.off('ai_commentary');
      s.off('prediction_scored');
    };
  }, []);

  return getSocket();
}

export function subscribeMatch(matchId) {
  const s = getSocket();
  if (s.connected) s.emit('subscribe_match', matchId);
}

export function subscribeGroup(groupName) {
  const s = getSocket();
  if (s.connected) s.emit('subscribe_group', groupName);
}

// 发送聊天消息
export function sendChatMessage(matchId, message, userName, userId) {
  const s = getSocket();
  if (s.connected) {
    s.emit('chat_message', { matchId, message, userName, userId });
  }
}

// 获取历史聊天消息（REST API回退）
export async function fetchChatHistory(matchId) {
  try {
    const res = await fetch(`/api/matches/${matchId}/chat`);
    if (res.ok) {
      const data = await res.json();
      return data.success ? data.data : [];
    }
  } catch {}
  return [];
}
