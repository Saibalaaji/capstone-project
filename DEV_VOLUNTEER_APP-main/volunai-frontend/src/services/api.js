import axios from 'axios';

const API_BASE = '/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

// ── Volunteers ──
export const getVolunteers = () => api.get('/volunteers');
export const getActiveVolunteers = () => api.get('/volunteers/active');
export const getVolunteerById = (id) => api.get(`/volunteers/${id}`);
export const getVolunteerRequests = (id) => api.get(`/volunteers/${id}/requests`);
export const createVolunteer = (data) => api.post('/volunteers', data);
export const updateVolunteer = (id, data) => api.put(`/volunteers/${id}`, data);
export const deleteVolunteer = (id) => api.delete(`/volunteers/${id}`);
export const toggleVolunteerAvailability = (id, status) =>
  api.patch(`/volunteers/${id}/availability`, { status });
export const toggleVolunteerActivation = (id, active) =>
  api.patch(`/volunteers/${id}/activate`, { active });
export const filterVolunteers = (params) => api.get('/volunteers/filter', { params });

// ── Requests ──
export const getRequests = () => api.get('/requests');
export const getRequestById = (id) => api.get(`/requests/${id}`);
export const createRequest = (data) => api.post('/requests', data);
export const getRequestsByStatus = (status) => api.get(`/requests/status/${status}`);
export const updateRequestStatus = (id, status) =>
  api.patch(`/requests/${id}/status`, { status });
export const assignVolunteer = (requestId, volunteerId) =>
  api.post(`/requests/${requestId}/assign/${volunteerId}`);
export const acceptRequest = (requestId, volunteerId) =>
  api.post(`/requests/${requestId}/accept/${volunteerId}`);
export const declineRequest = (requestId, volunteerId) =>
  api.post(`/requests/${requestId}/decline/${volunteerId}`);
export const completeRequestByVolunteer = (requestId, volunteerId) =>
  api.post(`/requests/${requestId}/complete/${volunteerId}`);
export const deleteRequest = (id) => api.delete(`/requests/${id}`);

// ── Assignments ──
export const getAssignments = () => api.get('/assignments');
export const getMyAssignments = (volunteerId) => api.get(`/assignments/volunteer/${volunteerId}`);
export const acceptAssignment = (id) => api.patch(`/assignments/${id}/accept`);
export const declineAssignment = (id) => api.patch(`/assignments/${id}/decline`);
export const completeAssignment = (id) => api.patch(`/assignments/${id}/complete`);

// ── AI Services ──
export const interpretRequestAI = (description) =>
  api.post('/ai/interpret_request', { description });
export const getEnhancedMatches = (requestId) =>
  api.get(`/ai/enhanced/match_volunteers/${requestId}`);
export const updateVolunteerPerformance = (volunteerId, data) =>
  api.post(`/ai/enhanced/update_performance/${volunteerId}`, data);
export const adjustMatchingWeights = (data) =>
  api.post('/ai/enhanced/adjust_weights', data);
export const getLearningAnalytics = () =>
  api.get('/ai/enhanced/analytics');
export const improveRecommendations = () =>
  api.post('/ai/enhanced/improve_recommendations');

export default api;
