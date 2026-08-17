import { useState, useEffect, useCallback } from 'react';
import { getChatFriends, getThread, searchMessages as apiSearchMessages, sendMessage as apiSendMessage, sendMedia as apiSendMedia } from '../api/chatApi.js';

/**
 * Manages chat friends list, message thread, and send logic.
 */
export function useChat(user, socket) {
  const token = JSON.parse(localStorage.getItem('authTokens'))?.token;
  const [friends, setFriends] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [threadId, setThreadId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);

  // Load friends
  useEffect(() => {
    getChatFriends()
      .then(data => setFriends(data))
      .catch(console.error)
      .finally(() => setLoadingUsers(false));
  }, []);

  // Load thread when user selected
  useEffect(() => {
    if (!selectedUser) return;
    setLoadingMessages(true);
    setMessages([]);
    getThread(selectedUser._id)
      .then(data => {
        setThreadId(data.threadId);
        setMessages(data.messages);
        // Mark messages as read
        data.messages.forEach(m => {
          if (m.sender._id !== user.id && m.status !== 'read') {
            socket?.current?.emit('message:read', { messageId: m._id, threadId: data.threadId, toUserId: m.sender._id });
          }
        });
      })
      .catch(console.error)
      .finally(() => setLoadingMessages(false));
  }, [selectedUser]);

  // Listen for incoming messages
  useEffect(() => {
    const s = socket?.current;
    if (!s) return;
    const handler = ({ message }) => {
      setMessages(prev => [...prev, message]);
      s.emit('message:delivered', { messageId: message._id, threadId: message.threadId, toUserId: message.sender._id });
    };
    s.on('message:new', handler);
    return () => s.off('message:new', handler);
  }, [socket?.current]);

  const sendMessage = useCallback(async (content, mediaFile) => {
    if (!selectedUser) return;
    setSending(true);
    const tempId = `temp-${Date.now()}`;
    const optimistic = {
      _id: tempId, sender: { _id: user.id }, content, status: 'sent',
      createdAt: new Date().toISOString(),
      attachments: mediaFile ? [{ url: URL.createObjectURL(mediaFile), fileType: 'image' }] : [],
    };
    setMessages(prev => [...prev, optimistic]);
    try {
      let real;
      if (mediaFile) {
        const fileType = mediaFile.type.startsWith('video') ? 'video' : mediaFile.type.startsWith('audio') ? 'audio' : 'image';
        const res = await apiSendMedia(selectedUser._id, mediaFile, fileType);
        real = await res.json();
      } else {
        real = await apiSendMessage(selectedUser._id, content);
      }
      setMessages(prev => prev.map(m => m._id === tempId ? real : m));
    } catch (err) {
      console.error(err);
      setMessages(prev => prev.filter(m => m._id !== tempId));
    } finally {
      setSending(false);
    }
  }, [selectedUser, user]);

  const searchMessages = useCallback(async (q) => {
    if (!q.trim() || !selectedUser) return [];
    return apiSearchMessages(selectedUser._id, q);
  }, [selectedUser]);

  return { friends, selectedUser, setSelectedUser, threadId, messages, loadingUsers, loadingMessages, sending, sendMessage, searchMessages };
}
