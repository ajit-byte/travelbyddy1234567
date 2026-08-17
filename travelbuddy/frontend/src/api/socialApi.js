import { apiJson, apiFetch } from './client.js';

export const getFollowStatus = (targetId) => apiJson(`/api/social/follow-status/${targetId}`);
export const sendFollowRequest = (targetId) => apiJson(`/api/social/follow/${targetId}`, { method: 'POST' });
export const unfollow = (targetId) => apiJson(`/api/social/unfollow/${targetId}`, { method: 'POST' });

export const getNotifications = () => apiJson('/api/social/notifications');
export const acceptNotification = (id) => apiJson(`/api/social/notifications/${id}/accept`, { method: 'POST' });
export const declineNotification = (id) => apiJson(`/api/social/notifications/${id}/decline`, { method: 'POST' });
export const markNotificationRead = (id) => apiJson(`/api/social/notifications/${id}/read`, { method: 'POST' });

export const getMyProfile = () => apiJson('/api/social/profile/me');
export const updateMyProfile = (data) => apiJson('/api/social/profile/me', { method: 'PUT', body: JSON.stringify(data) });
export const uploadImage = (file, folder = 'profiles') => {
  const fd = new FormData();
  fd.append('image', file);
  fd.append('folder', folder);
  return apiFetch('/api/social/upload-image', { method: 'POST', body: fd });
};

export const getProfilePosts = () => apiJson('/api/social/profile/posts');
export const getLikedPosts = () => apiJson('/api/social/profile/liked');
export const getSavedPosts = () => apiJson('/api/social/profile/saved');
export const getMutualFollowers = () => apiJson('/api/social/profile/mutual-followers');
