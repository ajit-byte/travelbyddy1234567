import { apiJson } from './client.js';

export const getPublicItineraries = () => apiJson('/api/itineraries/public');
export const getMyItineraries = () => apiJson('/api/itineraries/my');
export const createItinerary = (data) => apiJson('/api/itineraries', { method: 'POST', body: JSON.stringify(data) });
export const updateItinerary = (id, data) => apiJson(`/api/itineraries/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteItinerary = (id) => apiJson(`/api/itineraries/${id}`, { method: 'DELETE' });
