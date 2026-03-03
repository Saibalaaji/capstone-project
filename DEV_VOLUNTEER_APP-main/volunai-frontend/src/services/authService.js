const API_BASE = '/api';

export const authService = {
  async register(userData) {
    const response = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
    if (!response.ok) throw new Error('Registration failed');
    return response.json();
  },

  async login(email, password) {
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    if (!response.ok) throw new Error('Login failed');
    const user = await response.json();
    localStorage.setItem('user', JSON.stringify(user));
    return user;
  },

  logout() {
    localStorage.removeItem('user');
  },

  getCurrentUser() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }
};

export const chatService = {
  async sendMessage(senderId, receiverId, messageText, requestId = null) {
    const response = await fetch(`${API_BASE}/chat/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ senderId, receiverId, messageText, requestId })
    });
    return response.json();
  },

  async getMessages(userId, otherUserId) {
    const response = await fetch(`${API_BASE}/chat/messages?userId=${userId}&otherUserId=${otherUserId}`);
    return response.json();
  },

  async getConversations(userId) {
    const response = await fetch(`${API_BASE}/chat/conversations/${userId}`);
    return response.json();
  }
};

export const notificationService = {
  async getNotifications(userId, status = null) {
    const url = status 
      ? `${API_BASE}/notifications/${userId}?status=${status}`
      : `${API_BASE}/notifications/${userId}`;
    const response = await fetch(url);
    return response.json();
  },

  async markAsRead(notificationId) {
    const response = await fetch(`${API_BASE}/notifications/${notificationId}/read`, {
      method: 'PUT'
    });
    return response.json();
  },

  async markAllAsRead(userId) {
    const response = await fetch(`${API_BASE}/notifications/user/${userId}/mark-all-read`, {
      method: 'PUT'
    });
    return response.json();
  }
};

export const approvalService = {
  async approveTask(volunteerId, requestId) {
    const response = await fetch(`${API_BASE}/approvals/volunteer/${volunteerId}/approve/${requestId}`, {
      method: 'POST'
    });
    return response.json();
  },

  async declineTask(volunteerId, requestId) {
    const response = await fetch(`${API_BASE}/approvals/volunteer/${volunteerId}/decline/${requestId}`, {
      method: 'POST'
    });
    return response.json();
  },

  async completeTask(requestId) {
    const response = await fetch(`${API_BASE}/approvals/task/${requestId}/complete`, {
      method: 'POST'
    });
    return response.json();
  }
};
