import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';

/**
 * Manages a Socket.IO connection and exposes online/typing state.
 */
export function useSocket(token) {
  const socketRef = useRef(null);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [lastSeen, setLastSeen] = useState({});
  const [typingUsers, setTypingUsers] = useState({});

  useEffect(() => {
    if (!token) return;
    const socket = io(import.meta.env.VITE_API_URL, { auth: { token } });
    socketRef.current = socket;

    socket.on('user:online', ({ userId }) =>
      setOnlineUsers(prev => new Set([...prev, userId]))
    );
    socket.on('user:offline', ({ userId, lastSeen: ls }) => {
      setOnlineUsers(prev => { const s = new Set(prev); s.delete(userId); return s; });
      setLastSeen(prev => ({ ...prev, [userId]: ls }));
    });
    socket.on('typing:start', ({ fromUserId }) =>
      setTypingUsers(prev => ({ ...prev, [fromUserId]: true }))
    );
    socket.on('typing:stop', ({ fromUserId }) =>
      setTypingUsers(prev => ({ ...prev, [fromUserId]: false }))
    );

    return () => { socket.disconnect(); socketRef.current = null; };
  }, [token]);

  return { socket: socketRef, onlineUsers, lastSeen, typingUsers };
}
