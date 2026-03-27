import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Bell, LogOut, Heart, ChevronRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getNotifications, markNotificationRead, markAllRead } from '../../services/api';

/**
 * WarmAppLayout — dual-mode layout shell
 *
 * Mode A (role-based / Admin path): pass `role`
 * Mode B (tab-based / Volunteer + Community): pass `sidebarItems` + `activeTab`
 *
 * Always shows warm sidebar + top navbar.
 */
export default function AppLayout({
    children,
    role,
    sidebarItems,
    activeTab,
    user: userProp,
    topTitle,
    topSubtitle,
}) {
    const { user: authUser, logout } = useAuth();
    const navigate = useNavigate();
    const user = userProp || authUser;
    const [notifOpen, setNotifOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const notifRef = useRef(null);

    const loadNotifs = useCallback(async () => {
        if (!user?.id) return;
        try {
            const res = await getNotifications(user.id);
            setNotifications(res.data || []);
        } catch { /* silent */ }
    }, [user?.id]);

    useEffect(() => {
        if (notifOpen) {
            loadNotifs();
            const interval = setInterval(loadNotifs, 10000);
            return () => clearInterval(interval);
        }
    }, [notifOpen, loadNotifs]);

    // Close panel when clicking outside
    useEffect(() => {
        if (!notifOpen) return;
        const handler = (e) => {
            if (notifRef.current && !notifRef.current.contains(e.target)) {
                setNotifOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [notifOpen]);

    const handleMarkRead = async (id) => {
        try {
            await markNotificationRead(id);
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, status: 'read' } : n));
        } catch { /* silent */ }
    };

    const handleMarkAllRead = async () => {
        if (!user?.id) return;
        try {
            await markAllRead(user.id);
            setNotifications(prev => prev.map(n => ({ ...n, status: 'read' })));
        } catch { /* silent */ }
    };

    const unreadCount = notifications.filter(n => n.status === 'unread').length;

    return (
        <div className="app-shell">
            {/* ── Sidebar ── */}
            <aside className="warm-sidebar">
                {/* Brand */}
                <div className="sidebar-brand">
                    <img
                        src="/logo.png"
                        alt="அறம்சேவை logo"
                        style={{ height: 52, width: 'auto', objectFit: 'contain' }}
                    />
                </div>

                {/* Nav */}
                <div className="sidebar-section" style={{ flex: 1 }}>
                    <div className="sidebar-section-label">Navigation</div>
                    {(sidebarItems || []).map(item => (
                        <button
                            key={item.id}
                            onClick={item.onClick}
                            className={`sidebar-link ${activeTab === item.id ? 'active' : ''}`}
                        >
                            {item.icon && <item.icon size={18} className="link-icon" />}
                            <span>{item.label}</span>
                            {item.badge ? (
                                <span style={{
                                    marginLeft: 'auto',
                                    background: 'var(--coral)',
                                    color: 'white',
                                    fontSize: 10,
                                    fontWeight: 800,
                                    padding: '1px 7px',
                                    borderRadius: 99,
                                }}>
                                    {item.badge}
                                </span>
                            ) : null}
                        </button>
                    ))}
                </div>

                {/* User card */}
                <div className="sidebar-user">
                    <div className="sidebar-user-card">
                        <div className="avatar avatar-sm">
                            {(user?.name || 'U')[0].toUpperCase()}
                        </div>
                        <div style={{ minWidth: 0, flex: 1 }}>
                            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {user?.name || 'User'}
                            </div>
                            <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                                {user?.role || 'Member'}
                            </div>
                        </div>
                        <button
                            onClick={() => { logout(); navigate('/login'); }}
                            title="Sign out"
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4, borderRadius: 6 }}
                            onMouseEnter={e => e.currentTarget.style.color = '#C05050'}
                            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
                        >
                            <LogOut size={16} />
                        </button>
                    </div>
                </div>
            </aside>

            {/* ── Right Side ── */}
            <div className="main-area">
                {/* Top Navbar */}
                <nav className="warm-navbar">
                    {topTitle && (
                        <div style={{ marginRight: 24 }}>
                            <div style={{ fontSize: 17, fontWeight: 800, color: 'var(--text-primary)' }}>{topTitle}</div>
                            {topSubtitle && <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>{topSubtitle}</div>}
                        </div>
                    )}

                    {/* Search */}
                    <div className="navbar-search">
                        <Search size={15} className="search-icon" />
                        <input type="text" placeholder="Search…" />
                    </div>

                    {/* Actions */}
                    <div className="navbar-actions">
                        {/* Notifications */}
                        <div style={{ position: 'relative' }} ref={notifRef}>
                            <button
                                className="icon-btn"
                                onClick={() => setNotifOpen(o => !o)}
                                title="Notifications"
                            >
                                <Bell size={18} />
                                {unreadCount > 0 && (
                                    <span className="notification-badge">{unreadCount}</span>
                                )}
                            </button>

                            {notifOpen && (
                                <div className="notif-dropdown">
                                    <div className="notif-dropdown-header">
                                        <h3>Notifications</h3>
                                        {notifications.some(n => n.status === 'unread') && (
                                            <button
                                                onClick={handleMarkAllRead}
                                                style={{ fontSize: 12, color: 'var(--coral-dark)', fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer' }}
                                            >
                                                Mark all read
                                            </button>
                                        )}
                                    </div>
                                    {notifications.length === 0 ? (
                                        <div style={{ padding: '32px 20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                                            <Bell size={32} style={{ opacity: 0.25, display: 'block', margin: '0 auto 10px' }} />
                                            No notifications
                                        </div>
                                    ) : (
                                        notifications.slice(0, 10).map((n) => (
                                            <div
                                                key={n.id}
                                                className={`notif-item ${n.status === 'unread' ? 'unread' : ''}`}
                                                onClick={() => n.status === 'unread' && handleMarkRead(n.id)}
                                                style={{ cursor: n.status === 'unread' ? 'pointer' : 'default' }}
                                            >
                                                <div className="notif-dot" />
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.3 }}>{n.message}</div>
                                                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                                                        {new Date(n.timestamp).toLocaleString()}
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                    <div style={{ padding: '12px 20px', textAlign: 'center' }}>
                                        <button
                                            onClick={() => setNotifOpen(false)}
                                            style={{ fontSize: 13, color: 'var(--coral-dark)', fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer' }}
                                        >
                                            View all notifications <ChevronRight size={13} style={{ display: 'inline', verticalAlign: 'middle' }} />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Avatar */}
                        <div className="avatar avatar-sm" style={{ cursor: 'pointer' }} title={user?.name}>
                            {(user?.name || 'U')[0].toUpperCase()}
                        </div>
                    </div>
                </nav>

                {/* Page Content */}
                <div className="page-content">
                    {children}
                </div>
            </div>
        </div>
    );
}
