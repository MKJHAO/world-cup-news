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
  const { setConnected, updateMatchInList } = useAppStore();

  useEffect(() => {
    const s = getSocket();

    s.on('connect', () => setConnected(true));
    s.on('disconnect', () => setConnected(false));
    s.on('match_updated', (match) => updateMatchInList(match));

    return () => {
      s.off('connect');
      s.off('disconnect');
      s.off('match_updated');
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
