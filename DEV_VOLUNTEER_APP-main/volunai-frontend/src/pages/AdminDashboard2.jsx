import { useState, useEffect } from 'react';
import { authService, chatService, notificationService } from '../services/authService';
import { MessageCircle, Bell, Users, ClipboardList, CheckCircle, Send } from 'lucide-react';

export default function AdminDashboard2() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('requests');
  const [requests, setRequests] = useState([]);
  const [volunteers, setVolunteers] = useState([]);
  const [users, setUsers] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [showChat, setShowChat] = useState(false);

  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    setUser(currentUser);
    loadData(currentUser?.id);
  }, []);

  const loadData = async (userId) => {
    const [reqRes, volRes, userRes, notifRes] = await Promise.all([
      fetch('/api/requests'),
      fetch('/api/volunteers'),
      fetch('/api/auth/users'),
      userId ? notificationService.getNotifications(userId, 'unread') : Promise.resolve([])
    ]);
    
    setRequests(await reqRes.json());
    setVolunteers(await volRes.json());
    setUsers(await userRes.json());
    setNotifications(notifRes);
  };

  const handleAssignVolunteer = async (requestId, volunteerId) => {
    await fetch(`/api/requests/${requestId}/assign/${volunteerId}`, { method: 'POST' });
    loadData(user.id);
  };

  const openChat = async (targetUser) => {
    setSelectedChat(targetUser);
    setShowChat(true);
    const msgs = await chatService.getMessages(user.id, targetUser.id);
    setMessages(msgs);
  };

  const sendMessage = async () => {
    if (!messageText.trim()) return;
    await chatService.sendMessage(user.id, selectedChat.id, messageText);
    setMessageText('');
    const msgs = await chatService.getMessages(user.id, selectedChat.id);
    setMessages(msgs);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-indigo-600 text-white p-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <div className="flex items-center gap-4">
          <div className="relative cursor-pointer">
            <Bell />
            {notifications.length > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center">
                {notifications.length}
              </span>
            )}
          </div>
          <span>{user?.name}</span>
        </div>
      </nav>

      <div className="container mx-auto p-6">
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setActiveTab('requests')}
            className={`px-4 py-2 rounded ${activeTab === 'requests' ? 'bg-indigo-600 text-white' : 'bg-white'}`}
          >
            <ClipboardList className="inline mr-2" size={16} />
            Requests
          </button>
          <button
            onClick={() => setActiveTab('volunteers')}
            className={`px-4 py-2 rounded ${activeTab === 'volunteers' ? 'bg-indigo-600 text-white' : 'bg-white'}`}
          >
            <Users className="inline mr-2" size={16} />
            Volunteers
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2 rounded ${activeTab === 'users' ? 'bg-indigo-600 text-white' : 'bg-white'}`}
          >
            <Users className="inline mr-2" size={16} />
            Users
          </button>
        </div>

        {activeTab === 'requests' && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-4">Service Requests</h2>
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Requester</th>
                  <th className="text-left p-2">Service</th>
                  <th className="text-left p-2">Location</th>
                  <th className="text-left p-2">Urgency</th>
                  <th className="text-left p-2">Status</th>
                  <th className="text-left p-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((req) => (
                  <tr key={req.id} className="border-b">
                    <td className="p-2">{req.requesterName}</td>
                    <td className="p-2">{req.serviceType}</td>
                    <td className="p-2">{req.location}</td>
                    <td className="p-2">
                      <span className={`px-2 py-1 rounded text-xs ${
                        req.urgencyLevel === 'HIGH' ? 'bg-red-100 text-red-700' :
                        req.urgencyLevel === 'MEDIUM' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                        {req.urgencyLevel}
                      </span>
                    </td>
                    <td className="p-2">{req.status}</td>
                    <td className="p-2">
                      {req.status === 'PENDING' && (
                        <select
                          onChange={(e) => handleAssignVolunteer(req.id, e.target.value)}
                          className="border rounded px-2 py-1 text-sm"
                        >
                          <option value="">Assign Volunteer</option>
                          {volunteers.filter(v => v.active).map(v => (
                            <option key={v.id} value={v.id}>{v.name}</option>
                          ))}
                        </select>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'volunteers' && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-4">Volunteers</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {volunteers.map((vol) => (
                <div key={vol.id} className="border rounded p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-bold">{vol.name}</h3>
                      <p className="text-sm text-gray-600">{vol.location}</p>
                      <p className="text-sm">⭐ {vol.rating} • {vol.completedTasks} tasks</p>
                    </div>
                    <button
                      onClick={() => openChat(vol)}
                      className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
                    >
                      <MessageCircle size={16} />
                    </button>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded ${
                    vol.availabilityStatus === 'AVAILABLE' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                  }`}>
                    {vol.availabilityStatus}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-4">All Users</h2>
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Name</th>
                  <th className="text-left p-2">Email</th>
                  <th className="text-left p-2">Role</th>
                  <th className="text-left p-2">Location</th>
                  <th className="text-left p-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b">
                    <td className="p-2">{u.name}</td>
                    <td className="p-2">{u.email}</td>
                    <td className="p-2">
                      <span className="px-2 py-1 rounded text-xs bg-blue-100 text-blue-700">
                        {u.role}
                      </span>
                    </td>
                    <td className="p-2">{u.location}</td>
                    <td className="p-2">
                      <button
                        onClick={() => openChat(u)}
                        className="text-blue-600 hover:underline text-sm"
                      >
                        Chat
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showChat && selectedChat && (
        <div className="fixed bottom-4 right-4 w-96 bg-white rounded-lg shadow-xl">
          <div className="bg-indigo-600 text-white p-3 rounded-t-lg flex justify-between items-center">
            <span>Chat with {selectedChat.name}</span>
            <button onClick={() => setShowChat(false)} className="text-white">✕</button>
          </div>
          <div className="h-64 overflow-y-auto p-4 space-y-2">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.senderId === user.id ? 'justify-end' : 'justify-start'}`}>
                <div className={`px-3 py-2 rounded max-w-xs ${
                  msg.senderId === user.id ? 'bg-indigo-100' : 'bg-gray-100'
                }`}>
                  {msg.messageText}
                </div>
              </div>
            ))}
          </div>
          <div className="p-3 border-t flex gap-2">
            <input
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 px-3 py-2 border rounded"
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            />
            <button onClick={sendMessage} className="bg-indigo-600 text-white px-4 py-2 rounded">
              <Send size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
