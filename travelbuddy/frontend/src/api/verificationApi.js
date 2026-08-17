import { apiJson, apiFetch } from './client.js';

export const getVerificationStatus = () => apiJson('/api/verification/status');
export const submitVerification = (formData) => apiFetch('/api/verification/submit', { method: 'POST', body: formData });
export const getVerificationRequests = (status = 'pending') => apiJson(`/api/verification/requests?status=${status}`);
export const approveVerification = (userId) => apiJson(`/api/verification/${userId}/approve`, { method: 'POST' });
export const rejectVerification = (userId, reason) => apiJson(`/api/verification/${userId}/reject`, { method: 'POST', body: JSON.stringify({ reason }) });
export const getVerificationStats = () => apiJson('/api/verification/stats');
