import { apiJson, apiFetch } from './client.js';

export const getChatFriends = () => apiJson('/api/chat/users');
export const getThread = (userId, page = 1) => apiJson(`/api/chat/thread/${userId}?page=${page}`);
export const searchMessages = (userId, q) => apiJson(`/api/chat/search/${userId}?q=${encodeURIComponent(q)}`);
export const sendMessage = (toUserId, content) => apiJson('/api/chat/send', { method: 'POST', body: JSON.stringify({ toUserId, content }) });
export const sendMedia = (toUserId, file, fileType) => {
  const fd = new FormData();
  fd.append('toUserId', toUserId);
  fd.append('file', file);
  fd.append('fileType', fileType);
  return apiFetch('/api/chat/send-media', { method: 'POST', body: fd });
};
export const updateMessageStatus = (messageId, status) => apiJson(`/api/chat/message/${messageId}/status`, { method: 'PATCH', body: JSON.stringify({ status }) });
