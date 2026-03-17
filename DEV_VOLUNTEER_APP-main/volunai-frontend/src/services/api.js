import axios from 'axios';

const API_BASE = '/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token to every request automatically
api.interceptors.request.use(config => {
  const token = localStorage.getItem('cvas_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Auth ──
export const authRegister = (data) => api.post('/auth/register', data);
export const authLogin = (data) => api.post('/auth/login', data);
export const authMe = () => api.get('/auth/me');
export const getUsers = (role) => api.get('/auth/users', { params: role ? { role } : {} });
export const getUserById = (id) => api.get(`/auth/users/${id}`);

// ── Volunteers ──
export const getVolunteers = () => api.get('/volunteers');
export const getActiveVolunteers = () => api.get('/volunteers/active');
export const getVolunteerById = (id) => api.get(`/volunteers/${id}`);
export const getVolunteerByEmail = (email) => api.get(`/volunteers/by-email/${encodeURIComponent(email)}`);
export const getVolunteerStats = () => api.get('/volunteers/stats');
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
export const getRequestStats = () => api.get('/requests/stats');
export const getRequestsByContact = (contact) => api.get(`/requests/by-contact/${encodeURIComponent(contact)}`);

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

// ── Chat ──
export const getMessages = (userId, otherId) =>
  api.get(`/chat/messages`, { params: { userId, otherId } });
export const sendMessage = (data) => api.post('/chat/messages', data);
export const getConversations = (userId) => api.get(`/chat/conversations/${userId}`);

// ── Notifications ──
export const getNotifications = (userId) => api.get(`/notifications/${userId}`);
export const markNotificationRead = (id) => api.patch(`/notifications/${id}/read`);
export const markAllRead = (userId) => api.patch(`/notifications/read-all/${userId}`);

export default api;
