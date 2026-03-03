import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    Bell, User, Clock, TrendingUp, Calendar, MapPin, Star,
    Award, CheckCircle2, XCircle, Home, Activity, Briefcase,
    BarChart3, Heart, Zap, ChevronDown, ChevronUp, Shield
} from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell
} from 'recharts';
import { getVolunteerById, getVolunteers, getVolunteerRequests, acceptRequest, declineRequest, completeRequestByVolunteer, toggleVolunteerAvailability } from '../services/api';

const TABS = [
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'profile', label: 'My Profile', icon: User },
    { id: 'history', label: 'Task History', icon: Clock },
    { id: 'performance', label: 'Performance', icon: TrendingUp },
];

const CHART_COLORS = ['#8b5cf6', '#3b82f6', '#06b6d4', '#10b981', '#f59e0b', '#f43f5e'];

export default function VolunteerDashboard() {
    const [activeTab, setActiveTab] = useState('notifications');
    const [toast, setToast] = useState(null);

    const [allVolunteers, setAllVolunteers] = useState([]);
    const [selectedVolId, setSelectedVolId] = useState(1);
    const [volunteer, setVolunteer] = useState(null);
    const [notifications, setNotifications] = useState([]);
    const [taskHistory, setTaskHistory] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchVolunteers = async () => {
            try {
                const res = await getVolunteers();
                if (res.data && res.data.length > 0) {
                    setAllVolunteers(res.data);
                    setSelectedVolId(res.data[0].id);
                } else {
                    setLoading(false);
                }
            } catch (err) {
                console.error("Failed to fetch volunteers:", err);
                setLoading(false);
            }
        };
        fetchVolunteers();
    }, []);

    useEffect(() => {
        const fetchData = async () => {
            if (!selectedVolId) return;
            try {
                const [volRes, requestsRes] = await Promise.all([
                    getVolunteerById(selectedVolId),
                    getVolunteerRequests(selectedVolId)
                ]);

                setVolunteer(volRes.data);

                const allRequests = requestsRes.data;

                // Categorize requests
                const pending = allRequests.filter(r => r.status === 'PENDING' && !r.assigned_volunteer_id);
                const myAssigned = allRequests.filter(r => r.is_assigned_to_me && r.status === 'ASSIGNED');
                const completed = allRequests.filter(r => r.status === 'COMPLETED');
                const otherAssigned = allRequests.filter(r => r.assigned_volunteer_id && !r.is_assigned_to_me && r.status === 'ASSIGNED');

                setNotifications([...pending, ...myAssigned]);
                setTaskHistory([...completed, ...otherAssigned]);
                setLoading(false);
            } catch (err) {
                console.error("Failed to fetch volunteer data:", err);
                setLoading(false);
            }
        };

        fetchData();
        const interval = setInterval(fetchData, 10000); // Poll every 10s for sync
        return () => clearInterval(interval);
    }, [selectedVolId]);

    const handleAcceptTask = async (requestId) => {
        try {
            await acceptRequest(requestId, selectedVolId);
            showToast("Task accepted and assigned!", "success");
            // Refresh data
            const requestsRes = await getVolunteerRequests(selectedVolId);
            const allRequests = requestsRes.data;
            const pending = allRequests.filter(r => r.status === 'PENDING' && !r.assigned_volunteer_id);
            const myAssigned = allRequests.filter(r => r.is_assigned_to_me && r.status === 'ASSIGNED');
            const completed = allRequests.filter(r => r.status === 'COMPLETED');
            const otherAssigned = allRequests.filter(r => r.assigned_volunteer_id && !r.is_assigned_to_me && r.status === 'ASSIGNED');

            setNotifications([...pending, ...myAssigned]);
            setTaskHistory([...completed, ...otherAssigned]);
        } catch (err) {
            console.error(err);
            showToast("Failed to accept task", "error");
        }
    };

    const handleDeclineTask = async (requestId) => {
        try {
            await declineRequest(requestId, selectedVolId);
            showToast("Task declined", "info");
            // Refresh data
            const requestsRes = await getVolunteerRequests(selectedVolId);
            const allRequests = requestsRes.data;
            const pending = allRequests.filter(r => r.status === 'PENDING' && !r.assigned_volunteer_id);
            const myAssigned = allRequests.filter(r => r.is_assigned_to_me && r.status === 'ASSIGNED');

            setNotifications([...pending, ...myAssigned]);
        } catch (err) {
            console.error(err);
            showToast("Failed to decline task", "error");
        }
    };

    const handleCompleteTask = async (requestId) => {
        try {
            await completeRequestByVolunteer(requestId, selectedVolId);
            showToast("Task marked as completed!", "success");
            // Refresh data
            const requestsRes = await getVolunteerRequests(selectedVolId);
            const allRequests = requestsRes.data;
            const pending = allRequests.filter(r => r.status === 'PENDING' && !r.assigned_volunteer_id);
            const myAssigned = allRequests.filter(r => r.is_assigned_to_me && r.status === 'ASSIGNED');
            const completed = allRequests.filter(r => r.status === 'COMPLETED');
            const otherAssigned = allRequests.filter(r => r.assigned_volunteer_id && !r.is_assigned_to_me && r.status === 'ASSIGNED');

            setNotifications([...pending, ...myAssigned]);
            setTaskHistory([...completed, ...otherAssigned]);
        } catch (err) {
            console.error(err);
            showToast("Failed to complete task", "error");
        }
    };

    const handleToggleAvailability = async () => {
        const newStatus = volunteer.availabilityStatus === 'AVAILABLE' ? 'BUSY' : 'AVAILABLE';
        try {
            await toggleVolunteerAvailability(selectedVolId, newStatus);
            setVolunteer({ ...volunteer, availabilityStatus: newStatus });
            showToast(`Status updated to ${newStatus}`, "success");
        } catch (err) {
            console.error(err);
            showToast("Failed to update status", "error");
        }
    };


    function showToast(msg, type = 'info') {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 4000);
    }

    // Old static handlers removed — now using async API handlers above

    // Performance data from API
    const completedCount = volunteer?.completedTasks || taskHistory.filter(t => t.status === 'COMPLETED').length;
    const declinedCount = taskHistory.filter(t => t.status === 'DECLINED').length;
    const acceptedCount = notifications.length;
    const totalTasks = taskHistory.length + notifications.length;
    const acceptanceRate = volunteer?.acceptanceRate || (totalTasks > 0 ? ((completedCount + acceptedCount) / totalTasks) : 0);
    const avgRating = volunteer?.reliabilityScore || volunteer?.rating || 0;
    const avgResponseTime = 0; // Not tracked in API yet

    const monthlyTrend = [
        { month: 'Sep', rating: 4.2, tasks: 6 },
        { month: 'Oct', rating: 4.4, tasks: 8 },
        { month: 'Nov', rating: 4.5, tasks: 7 },
        { month: 'Dec', rating: 4.6, tasks: 9 },
        { month: 'Jan', rating: 4.7, tasks: 10 },
        { month: 'Feb', rating: 4.8, tasks: 7 },
    ];

    const serviceBreakdown = {};
    taskHistory.forEach(t => {
        serviceBreakdown[t.serviceType] = (serviceBreakdown[t.serviceType] || 0) + 1;
    });
    const serviceChartData = Object.entries(serviceBreakdown).map(([name, value]) => ({ name, value }));

    const statusPieData = [
        { name: 'Completed', value: completedCount },
        { name: 'Accepted', value: acceptedCount },
        { name: 'Declined', value: declinedCount },
    ];

    if (loading) {
        return (
            <div className="app-layout">
                <div className="main-content" style={{ padding: 32 }}>
                    {/* Skeleton loader — sidebar placeholder */}
                    <div style={{ display: 'flex', gap: 24, width: '100%' }}>
                        <div style={{ width: 240, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
                            {[...Array(5)].map((_, i) => (
                                <div key={i} className="skeleton" style={{ height: 40, borderRadius: 8, opacity: 1 - i * 0.15 }} />
                            ))}
                        </div>
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
                            <div className="skeleton" style={{ height: 32, width: '40%', borderRadius: 8 }} />
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16 }}>
                                {[...Array(4)].map((_, i) => <div key={i} className="skeleton" style={{ height: 90, borderRadius: 12 }} />)}
                            </div>
                            {[...Array(3)].map((_, i) => <div key={i} className="skeleton" style={{ height: 120, borderRadius: 12 }} />)}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (!volunteer && allVolunteers.length === 0) {
        return (
            <div className="app-layout">
                <div className="main-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '40px 20px' }}>
                    <div className="glass-card" style={{ textAlign: 'center', padding: 48, maxWidth: 500 }}>
                        <div style={{ fontSize: 56, marginBottom: 16 }}>👋</div>
                        <h2 style={{ marginBottom: 8 }}>No Volunteers Found</h2>
                        <p style={{ color: 'var(--text-muted)', marginBottom: 24, lineHeight: 1.6 }}>
                            There are no registered volunteers in the system yet.
                            Please register as a volunteer first to access this dashboard.
                        </p>
                        <div className="flex gap-12" style={{ justifyContent: 'center', flexWrap: 'wrap' }}>
                            <Link to="/register-volunteer" className="btn btn-primary" style={{ textDecoration: 'none' }}>
                                <User size={16} /> Register as Volunteer
                            </Link>
                            <Link to="/" className="btn btn-ghost" style={{ textDecoration: 'none' }}>
                                <Home size={16} /> Back to Home
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="app-layout">
            {/* Sidebar */}
            <div className="sidebar">
                <div className="sidebar-logo">
                    <div className="logo-icon">🤖</div>
                    <div>
                        <h1>VolunAI</h1>
                        <span>Volunteer Panel</span>
                    </div>
                </div>

                {/* Volunteer Selector */}
                <div style={{ padding: '8px 16px' }}>
                    <select
                        value={selectedVolId}
                        onChange={e => setSelectedVolId(Number(e.target.value))}
                        style={{ width: '100%', padding: '8px 10px', borderRadius: 8, background: 'var(--bg-glass)', color: 'var(--text-primary)', border: '1px solid var(--border-glass)', fontSize: 13 }}>
                        {allVolunteers.map(v => (
                            <option key={v.id} value={v.id}>{v.name}</option>
                        ))}
                    </select>
                </div>

                {/* Profile Summary */}
                <div className="vol-profile-mini">
                    <div className="profile-avatar" style={{ width: 44, height: 44, fontSize: 18 }}>
                        {volunteer.name?.charAt(0)}
                    </div>
                    <div>
                        <div style={{ fontWeight: 600, fontSize: 14 }}>{volunteer.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                            <MapPin size={10} style={{ marginRight: 2 }} />{volunteer.location} · ⭐ {volunteer.rating}
                        </div>
                        <span className={`badge ${volunteer.availabilityStatus === 'AVAILABLE' ? 'badge-completed' : 'badge-medium'}`}
                            style={{ fontSize: 10, marginTop: 4, display: 'inline-flex' }}>
                            ● {volunteer.availabilityStatus}
                        </span>
                    </div>
                </div>

                <div className="sidebar-section">
                    <div className="sidebar-section-title">Navigation</div>
                    {TABS.map(tab => (
                        <div key={tab.id}
                            className={`sidebar-link ${activeTab === tab.id ? 'active' : ''}`}
                            onClick={() => setActiveTab(tab.id)}>
                            <tab.icon size={18} className="link-icon" />
                            {tab.label}
                            {tab.id === 'notifications' && notifications.length > 0 && (
                                <span className="notification-badge">{notifications.length}</span>
                            )}
                        </div>
                    ))}
                </div>

                <div style={{ marginTop: 'auto', padding: '16px 0', borderTop: '1px solid var(--border-glass)' }}>
                    <Link to="/" className="sidebar-link">
                        <Home size={18} className="link-icon" /> Back to Home
                    </Link>
                </div>
            </div>

            {/* Main Content */}
            <div className="main-content">

                {/* ── Notifications Tab ── */}
                {activeTab === 'notifications' && (
                    <>
                        <div className="page-header">
                            <h2>🔔 Task Notifications</h2>
                            <p>AI-matched service requests awaiting your response</p>
                        </div>

                        <div className="stats-grid">
                            <div className="stat-card" style={{ animationDelay: '0.1s' }}>
                                <div className="stat-icon purple"><Bell size={24} /></div>
                                <div className="stat-info"><h3>{notifications.length}</h3><p>Pending Tasks</p></div>
                            </div>
                            <div className="stat-card" style={{ animationDelay: '0.2s' }}>
                                <div className="stat-icon green"><CheckCircle2 size={24} /></div>
                                <div className="stat-info"><h3>{completedCount}</h3><p>Completed</p></div>
                            </div>
                            <div className="stat-card" style={{ animationDelay: '0.3s' }}>
                                <div className="stat-icon cyan"><Award size={24} /></div>
                                <div className="stat-info"><h3>{volunteer.rating}</h3><p>Reliability Score</p></div>
                            </div>
                            <div className="stat-card" style={{ animationDelay: '0.4s' }}>
                                <div className="stat-icon amber"><Clock size={24} /></div>
                                <div className="stat-info"><h3>{avgResponseTime > 0 ? `${avgResponseTime}m` : 'N/A'}</h3><p>Avg Response</p></div>
                            </div>
                        </div>

                        {notifications.length > 0 ? (
                            <div className="vol-notifications-list">
                                {notifications.map((task, idx) => (
                                    <div key={task.id}
                                        className={`notification-card ${task.urgency_level?.toLowerCase()}`}
                                        style={{ animationDelay: `${idx * 0.1}s` }}>

                                        <div className="flex items-center justify-between" style={{ marginBottom: 12 }}>
                                            <div className="flex items-center gap-12">
                                                <div className="vol-task-icon">
                                                    {task.service_type === 'Food Delivery' ? '🍽️' :
                                                        task.service_type === 'Medical Assistance' ? '🏥' :
                                                            task.service_type === 'Transportation' ? '🚗' :
                                                                task.service_type === 'Elder Care' ? '👴' :
                                                                    task.service_type === 'Home Repair' ? '🔧' : '📋'}
                                                </div>
                                                <div>
                                                    <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 2 }}>
                                                        {task.service_type}
                                                    </div>
                                                    <div className="flex items-center gap-8" style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                                                        <span><MapPin size={11} style={{ marginRight: 3 }} />{task.location}</span>
                                                        <span><User size={11} style={{ marginRight: 3 }} />{task.requester_name}</span>
                                                        {task.is_assigned_to_me && <span style={{ color: 'var(--accent-green)' }}>✓ Assigned to You</span>}
                                                        {task.assigned_volunteer && !task.is_assigned_to_me && <span style={{ color: 'var(--accent-amber)' }}>Assigned to {task.assigned_volunteer}</span>}
                                                    </div>
                                                </div>
                                            </div>
                                            <div style={{ textAlign: 'right' }}>
                                                <span className={`badge badge-${task.urgency_level?.toLowerCase()}`}>
                                                    {task.urgency_level}
                                                </span>
                                                <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--accent-purple-light)', marginTop: 4 }}>
                                                    {Math.round((task.match_score || 0.8) * 100)}%
                                                </div>
                                                <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Match Score</div>
                                            </div>
                                        </div>

                                        <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 12, lineHeight: 1.6 }}>
                                            {task.description}
                                        </p>

                                        <div className="flex gap-8">
                                            {task.can_accept ? (
                                                <>
                                                    <button onClick={() => handleAcceptTask(task.id)}
                                                        className="btn btn-success btn-sm" style={{ flex: 1, justifyContent: 'center' }}>
                                                        <CheckCircle2 size={16} /> Accept Task
                                                    </button>
                                                    <button onClick={() => handleDeclineTask(task.id)}
                                                        className="btn btn-ghost btn-sm" style={{ flex: 1, justifyContent: 'center' }}>
                                                        <XCircle size={16} /> Decline
                                                    </button>
                                                </>
                                            ) : task.can_complete ? (
                                                <>
                                                    <button onClick={() => handleCompleteTask(task.id)}
                                                        className="btn btn-success btn-sm" style={{ flex: 1, justifyContent: 'center' }}>
                                                        <CheckCircle2 size={16} /> Mark Complete
                                                    </button>
                                                </>
                                            ) : (
                                                <div style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center', width: '100%' }}>
                                                    {task.assigned_volunteer ? `Assigned to ${task.assigned_volunteer}` : 'No longer available'}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="glass-card">
                                <div className="empty-state">
                                    <div className="empty-icon">🔔</div>
                                    <p>No new task notifications</p>
                                    <p style={{ fontSize: 12, marginTop: 4 }}>Check back later for new AI-matched opportunities</p>
                                </div>
                            </div>
                        )}
                    </>
                )}

                {/* ── Profile Tab ── */}
                {activeTab === 'profile' && (
                    <>
                        <div className="page-header">
                            <h2>👤 My Profile</h2>
                            <p>Manage your volunteer profile, skills, and availability</p>
                        </div>

                        <div className="grid-2">
                            {/* Contact Info */}
                            <div className="glass-card">
                                <div className="card-title"><User size={18} /> Contact Information</div>
                                <div className="vol-profile-section">
                                    <div className="profile-header" style={{ marginBottom: 24 }}>
                                        <div className="profile-avatar">
                                            {volunteer.name?.charAt(0)}
                                        </div>
                                        <div>
                                            <h3 style={{ fontSize: 22, fontWeight: 700, marginBottom: 2 }}>{volunteer.name}</h3>
                                            <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                                                <MapPin size={12} style={{ marginRight: 4 }} />{volunteer.location}
                                            </div>
                                            <span className={`badge ${volunteer.active ? 'badge-completed' : 'badge-high'}`}
                                                style={{ marginTop: 8, display: 'inline-flex' }}>
                                                {volunteer.active ? '● Active' : '● Inactive'}
                                            </span>
                                            <div style={{ marginTop: 12 }}>
                                                <button onClick={handleToggleAvailability}
                                                    className={`btn btn-sm ${volunteer.availabilityStatus === 'AVAILABLE' ? 'btn-success' : 'btn-ghost'}`}
                                                    style={{ fontSize: 12 }}>
                                                    {volunteer.availabilityStatus === 'AVAILABLE' ? '✅ Available' : '⏸ Set Available'}
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="vol-info-grid">
                                        <div className="vol-info-item">
                                            <span className="vol-info-label">Email</span>
                                            <span className="vol-info-value">{volunteer.email}</span>
                                        </div>
                                        <div className="vol-info-item">
                                            <span className="vol-info-label">Phone</span>
                                            <span className="vol-info-value">{volunteer.phone}</span>
                                        </div>
                                        <div className="vol-info-item">
                                            <span className="vol-info-label">Location</span>
                                            <span className="vol-info-value">{volunteer.location}</span>
                                        </div>
                                        <div className="vol-info-item">
                                            <span className="vol-info-label">Volunteer ID</span>
                                            <span className="vol-info-value">#{volunteer.id}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Skills & Availability */}
                            <div className="glass-card">
                                <div className="card-title"><Zap size={18} /> Skills & Availability</div>

                                <div style={{ marginBottom: 24 }}>
                                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>
                                        Service Types
                                    </div>
                                    <div className="chip-group">
                                        {volunteer.serviceType?.map((s, i) => (
                                            <span key={i} className="chip active">
                                                <Briefcase size={12} /> {s}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                <div style={{ marginBottom: 24 }}>
                                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>
                                        Available Days
                                    </div>
                                    <div className="chip-group">
                                        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => {
                                            const fullDay = { Mon: 'Monday', Tue: 'Tuesday', Wed: 'Wednesday', Thu: 'Thursday', Fri: 'Friday', Sat: 'Saturday', Sun: 'Sunday' }[day];
                                            const isAvail = volunteer.availableDays?.includes(fullDay);
                                            return (
                                                <span key={day} className={`chip ${isAvail ? 'active' : ''}`}>
                                                    <Calendar size={12} /> {day}
                                                </span>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div>
                                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>
                                        Performance Summary
                                    </div>
                                    <div className="vol-perf-mini-grid">
                                        <div className="vol-perf-mini-card">
                                            <div className="vol-perf-value" style={{ color: 'var(--accent-purple)' }}>{volunteer.rating}</div>
                                            <div className="vol-perf-label">Rating</div>
                                        </div>
                                        <div className="vol-perf-mini-card">
                                            <div className="vol-perf-value" style={{ color: 'var(--accent-green)' }}>{completedCount}</div>
                                            <div className="vol-perf-label">Completed</div>
                                        </div>
                                        <div className="vol-perf-mini-card">
                                            <div className="vol-perf-value" style={{ color: 'var(--accent-cyan)' }}>
                                                {Math.round(acceptanceRate * 100)}%
                                            </div>
                                            <div className="vol-perf-label">Acceptance</div>
                                        </div>
                                        <div className="vol-perf-mini-card">
                                            <div className="vol-perf-value" style={{ color: 'var(--accent-amber)' }}>{avgResponseTime}m</div>
                                            <div className="vol-perf-label">Avg Response</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </>
                )}

                {/* ── Task History Tab ── */}
                {activeTab === 'history' && (
                    <>
                        <div className="page-header">
                            <h2>📋 Task History</h2>
                            <p>{taskHistory.length} total assignments · {completedCount} completed · {declinedCount} declined</p>
                        </div>

                        <div className="glass-card">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Service</th>
                                        <th>Requester</th>
                                        <th>Location</th>
                                        <th>Status</th>
                                        <th>Assigned To</th>
                                        <th>Match Score</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {taskHistory.map(task => (
                                        <tr key={task.id}>
                                            <td>
                                                <div style={{ fontWeight: 600, fontSize: 13 }}>{task.service_type || '—'}</div>
                                            </td>
                                            <td>{task.requester_name || '—'}</td>
                                            <td><MapPin size={11} style={{ marginRight: 3 }} />{task.location || '—'}</td>
                                            <td>
                                                <span className={`badge badge-${task.status?.toLowerCase()}`}>
                                                    {task.status}
                                                </span>
                                            </td>
                                            <td>
                                                {task.assigned_volunteer ? (
                                                    <span style={{ color: task.is_assigned_to_me ? 'var(--accent-green)' : 'var(--text-secondary)' }}>
                                                        {task.is_assigned_to_me ? 'You' : task.assigned_volunteer}
                                                    </span>
                                                ) : (
                                                    <span className="text-muted" style={{ fontSize: 12 }}>—</span>
                                                )}
                                            </td>
                                            <td>
                                                {task.match_score > 0 ? (
                                                    <span style={{ fontWeight: 600, color: 'var(--accent-purple-light)' }}>
                                                        {Math.round(task.match_score * 100)}%
                                                    </span>
                                                ) : (
                                                    <span className="text-muted" style={{ fontSize: 12 }}>—</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}

                {/* ── Performance Tab ── */}
                {activeTab === 'performance' && (
                    <>
                        <div className="page-header">
                            <h2>📈 Performance Analytics</h2>
                            <p>Your AI-tracked performance metrics and reliability insights</p>
                        </div>

                        <div className="stats-grid">
                            <div className="stat-card" style={{ animationDelay: '0.1s' }}>
                                <div className="stat-icon purple"><Award size={24} /></div>
                                <div className="stat-info">
                                    <h3>{volunteer.rating}</h3>
                                    <p>Reliability Score</p>
                                </div>
                            </div>
                            <div className="stat-card" style={{ animationDelay: '0.2s' }}>
                                <div className="stat-icon green"><CheckCircle2 size={24} /></div>
                                <div className="stat-info">
                                    <h3>{Math.round(acceptanceRate * 100)}%</h3>
                                    <p>Acceptance Rate</p>
                                </div>
                            </div>
                            <div className="stat-card" style={{ animationDelay: '0.3s' }}>
                                <div className="stat-icon blue"><Star size={24} /></div>
                                <div className="stat-info">
                                    <h3>{avgRating.toFixed(1)}</h3>
                                    <p>Avg Task Rating</p>
                                </div>
                            </div>
                            <div className="stat-card" style={{ animationDelay: '0.4s' }}>
                                <div className="stat-icon cyan"><Clock size={24} /></div>
                                <div className="stat-info">
                                    <h3>{avgResponseTime}m</h3>
                                    <p>Avg Response Time</p>
                                </div>
                            </div>
                            <div className="stat-card" style={{ animationDelay: '0.5s' }}>
                                <div className="stat-icon amber"><Briefcase size={24} /></div>
                                <div className="stat-info">
                                    <h3>{totalTasks}</h3>
                                    <p>Total Tasks</p>
                                </div>
                            </div>
                            <div className="stat-card" style={{ animationDelay: '0.6s' }}>
                                <div className="stat-icon rose"><Heart size={24} /></div>
                                <div className="stat-info">
                                    <h3>{completedCount}</h3>
                                    <p>Tasks Completed</p>
                                </div>
                            </div>
                        </div>

                        <div className="grid-2 mb-24">
                            {/* Rating Trend */}
                            <div className="glass-card">
                                <div className="card-title"><TrendingUp size={18} /> Rating Trend (6 Months)</div>
                                <ResponsiveContainer width="100%" height={240}>
                                    <AreaChart data={monthlyTrend}>
                                        <defs>
                                            <linearGradient id="ratingGrad" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.3} />
                                                <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.02} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                        <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
                                        <YAxis stroke="#64748b" fontSize={12} domain={[3.5, 5]} />
                                        <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }} />
                                        <Area type="monotone" dataKey="rating" stroke="#8b5cf6" strokeWidth={2}
                                            fill="url(#ratingGrad)" dot={{ fill: '#8b5cf6', r: 4 }} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>

                            {/* Tasks Per Month */}
                            <div className="glass-card">
                                <div className="card-title"><BarChart3 size={18} /> Monthly Task Volume</div>
                                <ResponsiveContainer width="100%" height={240}>
                                    <BarChart data={monthlyTrend}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                        <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
                                        <YAxis stroke="#64748b" fontSize={12} />
                                        <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }} />
                                        <Bar dataKey="tasks" fill="#06b6d4" radius={[6, 6, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        <div className="grid-2 mb-24">
                            {/* Service Type Breakdown */}
                            <div className="glass-card">
                                <div className="card-title"><Briefcase size={18} /> Service Type Breakdown</div>
                                <ResponsiveContainer width="100%" height={240}>
                                    <PieChart>
                                        <Pie data={serviceChartData} cx="50%" cy="50%" outerRadius={80} dataKey="value"
                                            label={({ name, value }) => `${name}: ${value}`}>
                                            {serviceChartData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i]} />)}
                                        </Pie>
                                        <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>

                            {/* Task Status Distribution */}
                            <div className="glass-card">
                                <div className="card-title"><Shield size={18} /> Task Outcome Distribution</div>
                                <ResponsiveContainer width="100%" height={240}>
                                    <PieChart>
                                        <Pie data={statusPieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value"
                                            label={({ name, value }) => `${name}: ${value}`}>
                                            {statusPieData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i + 2]} />)}
                                        </Pie>
                                        <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* AI Matching Formula */}
                        <div className="glass-card">
                            <div className="card-title"><Zap size={18} /> How AI Scores You</div>
                            <div style={{ background: 'var(--bg-glass)', borderRadius: 'var(--radius-md)', padding: 20, fontFamily: 'monospace', fontSize: 13, lineHeight: 2 }}>
                                <span style={{ color: 'var(--accent-purple-light)' }}>match_score</span> = {'\n'}
                                &nbsp;&nbsp;(<span style={{ color: 'var(--accent-cyan)' }}>0.25</span> × availability_score) + {'\n'}
                                &nbsp;&nbsp;(<span style={{ color: 'var(--accent-cyan)' }}>0.20</span> × proximity_score) + {'\n'}
                                &nbsp;&nbsp;(<span style={{ color: 'var(--accent-cyan)' }}>0.25</span> × skill_match_score) + {'\n'}
                                &nbsp;&nbsp;(<span style={{ color: 'var(--accent-cyan)' }}>0.15</span> × reliability_score) + {'\n'}
                                &nbsp;&nbsp;(<span style={{ color: 'var(--accent-cyan)' }}>0.15</span> × predicted_acceptance)
                            </div>
                            <p style={{ marginTop: 12, fontSize: 12, color: 'var(--text-muted)' }}>
                                Your scores are dynamically calculated by the Adaptive Learning Engine. Higher reliability and acceptance rates improve your match ranking.
                            </p>
                        </div>
                    </>
                )}

                {/* Toast */}
                {toast && (
                    <div className={`toast ${toast.type}`}>
                        {toast.type === 'success' && <CheckCircle2 size={18} color="var(--accent-green)" />}
                        {toast.type === 'error' && <XCircle size={18} color="var(--accent-rose)" />}
                        {toast.type === 'info' && <Bell size={18} color="var(--accent-blue)" />}
                        <span style={{ fontSize: 14 }}>{toast.msg}</span>
                    </div>
                )}
            </div>
        </div>
    );
}
