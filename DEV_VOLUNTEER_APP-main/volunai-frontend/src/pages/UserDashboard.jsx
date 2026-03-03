import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { authService, chatService, notificationService } from '../services/authService';
import {
  MessageCircle, Bell, Send, User, Home, FileText,
  Users, Plus, AlertTriangle, CheckCircle, Clock, X,
  MapPin, Zap
} from 'lucide-react';

const URGENCY_COLORS = {
  HIGH: { bg: 'rgba(239,68,68,0.12)', border: '#ef4444', text: '#ef4444' },
  MEDIUM: { bg: 'rgba(245,158,11,0.12)', border: '#f59e0b', text: '#f59e0b' },
  LOW: { bg: 'rgba(34,197,94,0.12)', border: '#22c55e', text: '#22c55e' },
};

const SERVICE_OPTIONS = [
  'Medical Assistance', 'Food Delivery', 'Transportation',
  'Home Repair', 'Pet Care', 'Technical Support',
  'Companionship', 'Childcare', 'Cleaning Services', 'Shopping Assistance',
];

const LOCATION_OPTIONS = [
  'Manhattan', 'Brooklyn', 'Queens', 'Bronx', 'Staten Island',
];

export default function UserDashboard() {
  const [user] = useState(() => authService.getCurrentUser());
  const [activeTab, setActiveTab] = useState('request');
  const [volunteers, setVolunteers] = useState([]);
  const [loadingVolunteers, setLoadingVolunteers] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [messages, setMessages] = useState([]);
  const [selectedVolunteer, setSelectedVolunteer] = useState(null);
  const [messageText, setMessageText] = useState('');
  const [showChat, setShowChat] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null); // 'success' | 'error' | null
  const [requestForm, setRequestForm] = useState({
    serviceType: '',
    location: '',
    urgency: 'MEDIUM',
    description: '',
  });

  const loadVolunteers = useCallback(async () => {
    setLoadingVolunteers(true);
    try {
      const res = await fetch('/api/volunteers/active');
      const data = await res.json();
      setVolunteers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingVolunteers(false);
    }
  }, []);

  const loadNotifications = useCallback(async (userId) => {
    if (!userId) return;
    try {
      const data = await notificationService.getNotifications(userId, 'unread');
      setNotifications(data);
    } catch (err) {
      console.error(err);
    }
  }, []);

  const loadMessages = useCallback(async (otherUserId) => {
    if (!user) return;
    try {
      const data = await chatService.getMessages(user.id, otherUserId);
      setMessages(data);
    } catch (err) {
      console.error(err);
    }
  }, [user]);

  useEffect(() => {
    const init = async () => {
      await loadVolunteers();
      await loadNotifications(user?.id);
    };
    init();
  }, [loadVolunteers, loadNotifications, user?.id]);

  const handleSendMessage = async () => {
    if (!messageText.trim() || !selectedVolunteer) return;
    await chatService.sendMessage(user.id, selectedVolunteer.id, messageText);
    setMessageText('');
    loadMessages(selectedVolunteer.id);
  };

  const handleSubmitRequest = async () => {
    if (!requestForm.serviceType || !requestForm.location) return;
    try {
      const res = await fetch('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requesterName: user?.name,
          requesterContact: user?.contactNumber,
          selectedVolunteerId: selectedVolunteer?.id,
          ...requestForm,
        }),
      });
      if (res.ok) {
        setSubmitStatus('success');
        setRequestForm({ serviceType: '', location: '', urgency: 'MEDIUM', description: '' });
        setTimeout(() => setSubmitStatus(null), 4000);
      } else {
        setSubmitStatus('error');
      }
    } catch (err) {
      console.error(err);
      setSubmitStatus('error');
    }
  };

  const openChat = (volunteer) => {
    setSelectedVolunteer(volunteer);
    setShowChat(true);
    loadMessages(volunteer.id);
  };

  const update = (field) => (e) => setRequestForm({ ...requestForm, [field]: e.target.value });

  const navItems = [
    { id: 'request', icon: <Plus size={18} />, label: 'New Request' },
    { id: 'volunteers', icon: <Users size={18} />, label: 'Volunteers', badge: volunteers.length },
    { id: 'notifications', icon: <Bell size={18} />, label: 'Notifications', badge: notifications.length },
  ];

  return (
    <div className="app-layout">
      {/* ── Sidebar ─────────────────────────────────────────────────── */}
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="sidebar-logo">🤖</div>
          <div>
            <div className="sidebar-logo-text">VolunAI</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>User Panel</div>
          </div>
        </div>

        {/* User profile pill */}
        <div style={{
          background: 'var(--bg-elevated)',
          borderRadius: 'var(--radius-md)',
          padding: '12px 14px',
          marginBottom: 24,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          border: '1px solid var(--border-default)',
        }}>
          <div style={{
            width: 36, height: 36,
            borderRadius: '50%',
            background: 'var(--gradient-primary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 700, fontSize: 14,
          }}>
            {user?.name?.[0]?.toUpperCase() || <User size={16} />}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 600, fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user?.name || 'User'}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{user?.email || ''}</div>
          </div>
        </div>

        <div className="sidebar-nav-label">NAVIGATION</div>
        <nav aria-label="Dashboard navigation">
          {navItems.map((item) => (
            <button
              key={item.id}
              className={`sidebar-item ${activeTab === item.id ? 'active' : ''}`}
              onClick={() => setActiveTab(item.id)}
              style={{ position: 'relative' }}
            >
              {item.icon}
              <span>{item.label}</span>
              {item.badge > 0 && (
                <span style={{
                  marginLeft: 'auto',
                  background: 'var(--accent-purple)',
                  color: '#fff',
                  borderRadius: 10,
                  fontSize: 10,
                  fontWeight: 700,
                  padding: '2px 7px',
                  minWidth: 18,
                  textAlign: 'center',
                }}>
                  {item.badge}
                </span>
              )}
            </button>
          ))}
        </nav>

        <div style={{ marginTop: 'auto', paddingTop: 24, borderTop: '1px solid var(--border-default)' }}>
          <Link to="/" className="sidebar-item" style={{ textDecoration: 'none', color: 'inherit' }}>
            <Home size={18} /> Back to Home
          </Link>
          <Link to="/chat" className="sidebar-item" style={{ textDecoration: 'none', color: 'inherit' }}>
            <MessageCircle size={18} /> Request via Chat
          </Link>
        </div>
      </aside>

      {/* ── Main Content ─────────────────────────────────────────────── */}
      <main className="main-content" style={{ padding: 32 }}>
        {/* ── New Request tab ────────────────────────────────────────── */}
        {activeTab === 'request' && (
          <section aria-labelledby="request-heading">
            <header style={{ marginBottom: 28 }}>
              <h1 id="request-heading" style={{ fontSize: 26, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 10 }}>
                <FileText size={24} aria-hidden="true" /> Submit Service Request
              </h1>
              <p style={{ color: 'var(--text-secondary)', marginTop: 4 }}>
                Fill in the details below and our AI will find the best volunteer match
              </p>
            </header>

            {/* Success / error banner */}
            {submitStatus === 'success' && (
              <div role="alert" style={{
                background: 'rgba(34,197,94,0.12)', border: '1px solid #22c55e',
                borderRadius: 'var(--radius-md)', padding: '12px 16px', marginBottom: 24,
                color: '#22c55e', display: 'flex', alignItems: 'center', gap: 8,
              }}>
                <CheckCircle size={16} aria-hidden="true" /> Request submitted successfully! Our AI is matching you with a volunteer.
              </div>
            )}
            {submitStatus === 'error' && (
              <div role="alert" style={{
                background: 'rgba(239,68,68,0.12)', border: '1px solid #ef4444',
                borderRadius: 'var(--radius-md)', padding: '12px 16px', marginBottom: 24,
                color: '#ef4444', display: 'flex', alignItems: 'center', gap: 8,
              }}>
                <AlertTriangle size={16} aria-hidden="true" /> Failed to submit. Please try again.
              </div>
            )}

            <div className="glass-card" style={{ maxWidth: 620 }}>
              <div className="form-group">
                <label htmlFor="svc-type">Service Type</label>
                <select id="svc-type" className="form-select" value={requestForm.serviceType} onChange={update('serviceType')}>
                  <option value="">Select a service…</option>
                  {SERVICE_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="svc-location">
                  <MapPin size={13} style={{ marginRight: 4 }} aria-hidden="true" /> Location
                </label>
                <select id="svc-location" className="form-select" value={requestForm.location} onChange={update('location')}>
                  <option value="">Select a location…</option>
                  {LOCATION_OPTIONS.map((l) => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="svc-urgency">
                  <Zap size={13} style={{ marginRight: 4 }} aria-hidden="true" /> Urgency Level
                </label>
                <select id="svc-urgency" className="form-select" value={requestForm.urgency} onChange={update('urgency')}>
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="svc-desc">Description</label>
                <textarea
                  id="svc-desc"
                  className="form-input"
                  placeholder="Describe your situation in detail (at least 10 characters)…"
                  value={requestForm.description}
                  onChange={update('description')}
                  rows={4}
                  style={{ resize: 'vertical' }}
                />
              </div>

              <button
                className="btn btn-primary"
                style={{ marginTop: 8 }}
                onClick={handleSubmitRequest}
                disabled={!requestForm.serviceType || !requestForm.location}
              >
                <Send size={15} aria-hidden="true" /> Submit Request
              </button>
            </div>
          </section>
        )}

        {/* ── Volunteers tab ─────────────────────────────────────────── */}
        {activeTab === 'volunteers' && (
          <section aria-labelledby="vol-heading">
            <header style={{ marginBottom: 28 }}>
              <h1 id="vol-heading" style={{ fontSize: 26, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 10 }}>
                <Users size={24} aria-hidden="true" /> Available Volunteers
              </h1>
              <p style={{ color: 'var(--text-secondary)', marginTop: 4 }}>
                Browse active volunteers and start a conversation
              </p>
            </header>

            {loadingVolunteers ? (
              <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="glass-card" style={{ height: 120, opacity: 0.5, animation: 'pulse 1.5s ease-in-out infinite' }} />
                ))}
              </div>
            ) : volunteers.length === 0 ? (
              <div className="glass-card" style={{ textAlign: 'center', padding: 48 }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>😴</div>
                <h3 style={{ marginBottom: 8 }}>No Volunteers Online</h3>
                <p style={{ color: 'var(--text-muted)' }}>Check back later or submit a request and we&apos;ll match you automatically.</p>
              </div>
            ) : (
              <ul style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', listStyle: 'none', padding: 0, margin: 0 }}>
                {volunteers.map((vol) => (
                  <li key={vol.id}>
                    <article className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{
                          width: 44, height: 44, borderRadius: '50%',
                          background: 'var(--gradient-primary)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontWeight: 700, fontSize: 16, flexShrink: 0,
                        }}>
                          {vol.name?.[0]?.toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600 }}>{vol.name}</div>
                          <div style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                            <MapPin size={11} aria-hidden="true" /> {vol.location} · ⭐ {vol.rating || '—'}
                          </div>
                        </div>
                        <span style={{
                          marginLeft: 'auto', background: 'rgba(34,197,94,0.15)',
                          color: '#22c55e', fontSize: 10, fontWeight: 700,
                          padding: '2px 8px', borderRadius: 10, flexShrink: 0,
                        }}>
                          ONLINE
                        </span>
                      </div>
                      <button
                        className="btn btn-primary"
                        style={{ width: '100%', justifyContent: 'center', fontSize: 13 }}
                        onClick={() => openChat(vol)}
                      >
                        <MessageCircle size={14} aria-hidden="true" /> Chat
                      </button>
                    </article>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}

        {/* ── Notifications tab ──────────────────────────────────────── */}
        {activeTab === 'notifications' && (
          <section aria-labelledby="notif-heading">
            <header style={{ marginBottom: 28 }}>
              <h1 id="notif-heading" style={{ fontSize: 26, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 10 }}>
                <Bell size={24} aria-hidden="true" /> Notifications
              </h1>
            </header>
            {notifications.length === 0 ? (
              <div className="glass-card" style={{ textAlign: 'center', padding: 48 }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>🔔</div>
                <h3 style={{ marginBottom: 8 }}>All caught up!</h3>
                <p style={{ color: 'var(--text-muted)' }}>No unread notifications.</p>
              </div>
            ) : (
              <ul style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: 0, listStyle: 'none' }}>
                {notifications.map((n) => (
                  <li key={n.id} className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: '50%',
                      background: 'rgba(139,92,246,0.2)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    }}>
                      <Bell size={16} style={{ color: 'var(--accent-purple)' }} aria-hidden="true" />
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{n.type || 'Notification'}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{n.message || ''}</div>
                    </div>
                    <div style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                      <Clock size={11} style={{ verticalAlign: 'middle', marginRight: 2 }} aria-hidden="true" />
                      {n.timestamp ? new Date(n.timestamp).toLocaleDateString() : 'Now'}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}
      </main>

      {/* ── Floating Chat Drawer ──────────────────────────────────────── */}
      {showChat && selectedVolunteer && (
        <div
          role="dialog"
          aria-label={`Chat with ${selectedVolunteer.name}`}
          aria-modal="true"
          style={{
            position: 'fixed', bottom: 24, right: 24, width: 360,
            background: 'var(--bg-card)', border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-lg)', boxShadow: '0 24px 48px rgba(0,0,0,0.5)',
            zIndex: 9999, display: 'flex', flexDirection: 'column', overflow: 'hidden',
          }}
        >
          {/* Header */}
          <div style={{
            background: 'var(--gradient-primary)',
            padding: '14px 16px',
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              background: 'rgba(255,255,255,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13
            }}>
              {selectedVolunteer.name?.[0]?.toUpperCase()}
            </div>
            <span style={{ fontWeight: 600, fontSize: 14 }}>{selectedVolunteer.name}</span>
            <button
              onClick={() => setShowChat(false)}
              aria-label="Close chat"
              style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'white', cursor: 'pointer', padding: 4 }}
            >
              <X size={16} aria-hidden="true" />
            </button>
          </div>

          {/* Messages */}
          <div style={{ height: 260, overflowY: 'auto', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {messages.length === 0 && (
              <p style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center', marginTop: 80 }}>
                Start the conversation!
              </p>
            )}
            {messages.map((msg) => {
              const isMe = msg.senderId === user?.id;
              return (
                <div key={msg.id} style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start' }}>
                  <div style={{
                    maxWidth: '80%', padding: '8px 12px', borderRadius: 12,
                    background: isMe ? 'var(--accent-purple)' : 'var(--bg-elevated)',
                    color: isMe ? '#fff' : 'var(--text-primary)',
                    fontSize: 13, lineHeight: 1.4,
                  }}>
                    {msg.messageText}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Input */}
          <div style={{
            borderTop: '1px solid var(--border-default)',
            padding: '10px 12px',
            display: 'flex', gap: 8,
          }}>
            <input
              className="form-input"
              style={{ flex: 1, padding: '8px 12px', fontSize: 13 }}
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder="Type a message…"
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              aria-label="Message input"
            />
            <button
              className="btn btn-primary"
              style={{ padding: '8px 14px' }}
              onClick={handleSendMessage}
              aria-label="Send message"
            >
              <Send size={14} aria-hidden="true" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
