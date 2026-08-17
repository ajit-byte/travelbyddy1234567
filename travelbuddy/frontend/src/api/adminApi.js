import { apiJson, apiFetch } from './client.js';

export const getAdminStats = () => apiJson('/api/verification/stats');
export const getVerificationRequests = (status = 'pending') => apiJson(`/api/verification/requests?status=${status}`);
export const approveVerification = (userId) => apiJson(`/api/verification/${userId}/approve`, { method: 'POST' });
export const rejectVerification = (userId, reason) => apiJson(`/api/verification/${userId}/reject`, { method: 'POST', body: JSON.stringify({ reason }) });
