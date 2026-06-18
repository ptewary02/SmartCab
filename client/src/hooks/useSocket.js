import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import useAuthStore from '../store/authStore';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:8000';
let socketInstance = null;

const useSocket = () => {
  const { user } = useAuthStore();
  const ref = useRef(null);

  useEffect(() => {
    if (!user?._id && !user?.id) return;
    const userId = user._id || user.id;

    if (socketInstance?.connected) { ref.current = socketInstance; return; }

    socketInstance = io(SOCKET_URL, {
      auth: { userId },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketInstance.on('connect',       () => console.log('✅ Socket connected:', socketInstance.id));
    socketInstance.on('connect_error', (e) => console.error('Socket error:', e.message));
    socketInstance.on('disconnect',    (r) => console.log('Socket disconnected:', r));

    ref.current = socketInstance;
  }, [user?._id, user?.id]);

  return ref.current || socketInstance;
};

export const getSocket = () => socketInstance;

export const disconnectSocket = () => {
  if (socketInstance) { socketInstance.disconnect(); socketInstance = null; }
};

export default useSocket;
