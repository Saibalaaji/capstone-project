import { useState, useEffect } from 'react';
import { notificationService } from '../services/authService';
import { Bell, X, Check } from 'lucide-react';

export default function NotificationPanel({ userId, show, onClose }) {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    if (show && userId) {
      loadNotifications();
      const interval = setInterval(loadNotifications, 5000);
      return () => clearInterval(interval);
    }
  }, [show, userId]);

  const loadNotifications = async () => {
    const data = await notificationService.getNotifications(userId);
    setNotifications(data);
  };

  const markAsRead = async (id) => {
    await notificationService.markAsRead(id);
    loadNotifications();
  };

  const markAllAsRead = async () => {
    await notificationService.markAllAsRead(userId);
    loadNotifications();
  };

  if (!show) return null;

  return (
    <div className="fixed top-16 right-4 w-96 bg-white rounded-lg shadow-2xl border border-gray-200 z-50 max-h-96 overflow-hidden">
      <div className="bg-indigo-600 text-white p-3 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Bell size={18} />
          <span className="font-semibold">Notifications</span>
          {notifications.filter(n => n.status === 'unread').length > 0 && (
            <span className="bg-red-500 text-white rounded-full px-2 py-0.5 text-xs">
              {notifications.filter(n => n.status === 'unread').length}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {notifications.length > 0 && (
            <button
              onClick={markAllAsRead}
              className="text-xs hover:bg-indigo-700 px-2 py-1 rounded"
            >
              Mark all read
            </button>
          )}
          <button onClick={onClose} className="hover:bg-indigo-700 rounded p-1">
            <X size={18} />
          </button>
        </div>
      </div>
      
      <div className="overflow-y-auto max-h-80">
        {notifications.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            <Bell size={48} className="mx-auto mb-2 opacity-30" />
            <p>No notifications</p>
          </div>
        ) : (
          notifications.map((notif) => (
            <div
              key={notif.id}
              className={`p-4 border-b hover:bg-gray-50 cursor-pointer ${
                notif.status === 'unread' ? 'bg-blue-50' : ''
              }`}
              onClick={() => markAsRead(notif.id)}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-800">{notif.message}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(notif.timestamp).toLocaleString()}
                  </p>
                </div>
                {notif.status === 'unread' && (
                  <div className="w-2 h-2 bg-blue-600 rounded-full mt-1"></div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
