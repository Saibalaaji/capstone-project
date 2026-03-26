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
export const authRegister = (data) => {
    const isFormData = data instanceof FormData;
    return api.post('/auth/register', data, isFormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : {});
};
export const authLogin = (data) => api.post('/auth/login', data);
export const authMe = () => api.get('/auth/me');
export const getUsers = (role) => api.get('/auth/users', { params: role ? { role, per_page: 1000 } : { per_page: 1000 } }).then(res => ({...res, data: res.data?.data || res.data}));
export const getPendingVerifications = () => api.get('/admin/verification/pending');
export const getAllVerifications = () => api.get('/admin/verification/all');
export const updateVerificationFields = (userId, data) => api.put(`/admin/verification/${userId}`, data);
export const softDeleteUser = (userId) => api.delete(`/admin/verification/${userId}`);
export const wipeDatabaseData = () => api.delete(`/admin/verification/wipe`);
export const verifyUser = (userId, action, reason) => {
    if (action === 'VERIFIED') return api.post(`/admin/verification/${userId}/approve`);
    return api.post(`/admin/verification/${userId}/reject`, { reason });
};
export const adminCreateUser = (data) => api.post('/auth/admin/create-user', data);
export const adminCreateVolunteer = (data) => api.post('/auth/admin/create-volunteer', data);


// ── Volunteers ──
export const getVolunteers = () => api.get('/volunteers', { params: { per_page: 1000 } });
export const getActiveVolunteers = () => api.get('/volunteers/active', { params: { per_page: 1000 } });
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
export const filterVolunteers = (params) => api.get('/volunteers/filter', { params: { ...params, per_page: 1000 } });

// ── Requests ──
export const getRequests = () => api.get('/requests', { params: { per_page: 1000 } }).then(res => {
    const arr = res.data?.data || res.data;
    const mapped = arr.map(r => ({
        ...r,
        service_type: r.serviceType || r.service_type,
        urgency_level: r.urgencyLevel || r.urgency_level,
        requester_name: r.requesterName || r.requester_name,
        requester_contact: r.requesterContact || r.requester_contact,
        assigned_volunteer_id: r.assignedVolunteerId || r.assigned_volunteer_id
    }));
    return {...res, data: mapped};
});
export const getRequestById = (id) => api.get(`/requests/${id}`);
export const createRequest = (data) => api.post('/requests', data);
export const getRequestsByStatus = (status) => api.get(`/requests/status/${status}`, { params: { per_page: 1000 } });
export const updateRequestStatus = (id, status) =>
  api.patch(`/requests/${id}/status`, { status });
export const assignVolunteer = (requestId, volunteerId) =>
  api.post(`/requests/${requestId}/assign/${volunteerId}`);
export const unassignVolunteer = (requestId) =>
  api.delete(`/requests/${requestId}/unassign`);
export const reassignVolunteer = (requestId, volunteerId) =>
  api.post(`/requests/${requestId}/reassign/${volunteerId}`);
export const acceptRequest = (requestId, volunteerId) =>
    api.post(`/requests/${requestId}/accept`);
export const declineRequest = (requestId, volunteerId) =>
    api.post(`/requests/${requestId}/decline`);
export const completeRequestByVolunteer = (requestId, volunteerId) =>
    api.post(`/requests/${requestId}/complete`);
export const deleteRequest = (id) => api.delete(`/requests/${id}`);
export const getRequestStats = () => api.get('/requests/stats');
export const getRequestsByContact = (contact) => api.get(`/requests/by-contact/${encodeURIComponent(contact)}`, { params: { per_page: 1000 } });


// ── Assignments ──
export const getAssignments = () => api.get('/assignments', { params: { per_page: 1000 } });
export const getMyAssignments = (volunteerId) => api.get(`/assignments/volunteer/${volunteerId}`, { params: { per_page: 1000 } });
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

// ── Ratings ──
export const submitRating = (data) => api.post('/ratings', data);
export const getVolunteerRatings = (volunteerId) => api.get(`/ratings/volunteer/${volunteerId}`);

// ── Chat ──
export const getMessages = (userId, otherId) =>
  api.get(`/chat/messages`, { params: { userId, otherId } });
export const sendMessage = (data) => api.post('/chat/messages', data);
export const getConversations = (userId) => api.get(`/chat/conversations/${userId}`);

// ── Notifications ──
export const getNotifications = (userId) => api.get(`/notifications/${userId}`, { params: { per_page: 1000 } });
export const markNotificationRead = (id) => api.put(`/notifications/${id}/read`);
export const markAllRead = (userId) => api.put(`/notifications/user/${userId}/mark-all-read`);

// ── Admin Database ──
export const getDatabaseTable = (tableName) => api.get(`/admin/db/${tableName}`);
export const updateDatabaseRecord = (tableName, id, data) => api.put(`/admin/db/${tableName}/${id}`, data);
export const createDatabaseRecord = (tableName, data) => api.post(`/admin/db/${tableName}`, data);
export const deleteDatabaseRecord = (tableName, id) => api.delete(`/admin/db/${tableName}/${id}`);

export default api;
