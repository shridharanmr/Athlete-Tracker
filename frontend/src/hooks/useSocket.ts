import { useEffect, useRef, useCallback, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { SocketNotification } from '../types';

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';

export const useSocket = () => {
  const socketRef = useRef<Socket | null>(null);
  const [notifications, setNotifications] = useState<SocketNotification[]>([]);
  const [connected, setConnected] = useState(false);

  const addNotification = useCallback((n: Omit<SocketNotification, 'id' | 'read'>) => {
    setNotifications((prev) => [
      { ...n, id: Date.now().toString(), read: false },
      ...prev.slice(0, 19), // keep last 20
    ]);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) return;

    const socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket'],
    });
    socketRef.current = socket;

    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));

    socket.on('performance:new', (data: { athleteName: string; eventName: string; result: string }) => {
      addNotification({
        type: 'performance',
        message: `📈 ${data.athleteName} recorded ${data.result} in ${data.eventName}`,
        timestamp: new Date().toISOString(),
      });
    });

    socket.on('payment:alert', (data: { athleteName: string; amount: number }) => {
      addNotification({
        type: 'payment',
        message: `💰 Payment of ₹${data.amount} due for ${data.athleteName}`,
        timestamp: new Date().toISOString(),
      });
    });

    socket.on('notification', (data: { message: string }) => {
      addNotification({
        type: 'info',
        message: data.message,
        timestamp: new Date().toISOString(),
      });
    });

    return () => {
      socket.disconnect();
    };
  }, [addNotification]);

  const markAllRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return { connected, notifications, unreadCount, markAllRead };
};
