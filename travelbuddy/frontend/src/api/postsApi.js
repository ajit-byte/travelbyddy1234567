import { apiFetch, apiJson } from './client.js';

export const getPosts = () => apiJson('/api/posts');
export const getMyPosts = () => apiJson('/api/posts/my');
export const createPost = (formData) => apiFetch('/api/posts', { method: 'POST', body: formData });
export const deletePost = (id) => apiJson(`/api/posts/${id}`, { method: 'DELETE' });

export const getLikeStatus = (postId) => apiJson(`/api/posts/${postId}/like`);
export const toggleLike = (postId) => apiJson(`/api/posts/${postId}/like`, { method: 'POST' });

export const getSaveStatus = (postId) => apiJson(`/api/posts/${postId}/save`);
export const toggleSave = (postId) => apiJson(`/api/posts/${postId}/save`, { method: 'POST' });

export const getComments = (postId) => apiJson(`/api/posts/${postId}/comments`);
export const addComment = (postId, text) => apiJson(`/api/posts/${postId}/comments`, { method: 'POST', body: JSON.stringify({ text }) });
export const toggleCommentLike = (postId, commentId) => apiJson(`/api/posts/${postId}/comments/${commentId}/like`, { method: 'POST' });
export const addReply = (postId, commentId, text) => apiJson(`/api/posts/${postId}/comments/${commentId}/reply`, { method: 'POST', body: JSON.stringify({ text }) });

export const getFollowingList = () => apiJson('/api/posts/following/list');
export const searchUsers = (q) => apiJson(`/api/posts/users/search?q=${encodeURIComponent(q)}`);
