import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
    LayoutDashboard, PlusCircle, Users, ClipboardList, BarChart3,
    Brain, Target, Zap, CheckCircle2, XCircle, Clock, MapPin,
    AlertTriangle, ArrowRight, ChevronDown, ChevronUp, Home,
    Sparkles, TrendingUp, Activity, Send, MessageSquare, ExternalLink
} from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    PieChart, Pie, Cell, ResponsiveContainer, RadarChart,
    PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend
} from 'recharts';
import {
    getVolunteers, getRequests, createRequest, assignVolunteer,
    updateRequestStatus
} from '../services/api';
import {
    interpretRequest, rankVolunteers, recordOutcome, getAdaptiveSuggestions
} from '../services/aiEngine';

const TABS = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'create', label: 'Create Request', icon: PlusCircle },
    { id: 'chatbox', label: 'Chat Requests', icon: MessageSquare },
    { id: 'requests', label: 'All Requests', icon: ClipboardList },
    { id: 'volunteers', label: 'Volunteers', icon: Users },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
];

const CHART_COLORS = ['#8b5cf6', '#3b82f6', '#06b6d4', '#10b981', '#f59e0b', '#f43f5e'];

export default function AdminDashboard() {
    const [activeTab, setActiveTab] = useState('overview');
    const [volunteers, setVolunteers] = useState([]);
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState(null);

    // Create request state
    const [form, setForm] = useState({
        requesterName: '', requesterContact: '', location: '',
        serviceType: '', description: '', urgencyLevel: 'MEDIUM'
    });
    const [nlpResult, setNlpResult] = useState(null);
    const [aiRanking, setAiRanking] = useState([]);
    const [showRanking, setShowRanking] = useState(false);
    const [expandedVolunteer, setExpandedVolunteer] = useState(null);
    const [createdRequest, setCreatedRequest] = useState(null);

    const showToast = useCallback((msg, type = 'info') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 4000);
    }, []);

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const [vRes, rRes] = await Promise.all([getVolunteers(), getRequests()]);
            setVolunteers(vRes.data);
            setRequests(rRes.data);
        } catch (err) {
            console.error('Failed to load data', err);
            showToast('Failed to connect to backend. Is it running on port 8080?', 'error');
        }
        setLoading(false);
    }, [showToast]);

    useEffect(() => {
        const init = async () => { await loadData(); };
        init();
    }, [loadData]);

    // NLP Analysis on description change
    function handleDescriptionChange(e) {
        const desc = e.target.value;
        setForm(f => ({ ...f, description: desc }));
        if (desc.length > 15) {
            const result = interpretRequest(desc);
            setNlpResult(result);
            if (result.service_type && !form.serviceType) {
                setForm(f => ({ ...f, serviceType: result.service_type }));
            }
            if (result.urgency_level) {
                setForm(f => ({ ...f, urgencyLevel: result.urgency_level }));
            }
            if (result.location && !form.location) {
                setForm(f => ({ ...f, location: result.location }));
            }
        } else {
            setNlpResult(null);
        }
    }

    async function handleCreateRequest(e) {
        e.preventDefault();
        if (!form.requesterName || !form.requesterContact || !form.location || !form.serviceType || !form.urgencyLevel) {
            showToast('Please fill in all required fields', 'error');
            return;
        }
        try {
            const res = await createRequest(form);
            const newRequest = res.data.request;
            setCreatedRequest(newRequest);

            // Run AI ranking on frontend
            const ranked = rankVolunteers(volunteers, newRequest);
            setAiRanking(ranked);
            setShowRanking(true);

            showToast('Request created! AI has ranked volunteers.', 'success');
            loadData();
        } catch (err) {
            showToast('Failed to create request: ' + (err.response?.data?.message || err.message), 'error');
        }
    }

    async function handleAssign(requestId, volunteerId, volunteerName) {
        try {
            await assignVolunteer(requestId, volunteerId);
            recordOutcome(volunteerId, requestId, 'completed');
            showToast(`Assigned ${volunteerName} successfully!`, 'success');
            setShowRanking(false);
            setForm({ requesterName: '', requesterContact: '', location: '', serviceType: '', description: '', urgencyLevel: 'MEDIUM' });
            setNlpResult(null);
            setCreatedRequest(null);
            loadData();
        } catch (err) {
            showToast('Assignment failed: ' + (err.response?.data?.message || err.message), 'error');
        }
    }

    async function handleStatusChange(requestId, status) {
        try {
            await updateRequestStatus(requestId, status);
            showToast(`Request status updated to ${status}`, 'success');
            loadData();
        } catch (err) {
            console.error(err);
            showToast('Failed to fetch data.', 'error');
        }
    }

    // Stats
    const pendingCount = requests.filter(r => r.status === 'PENDING').length;
    const assignedCount = requests.filter(r => r.status === 'ASSIGNED').length;
    const completedCount = requests.filter(r => r.status === 'COMPLETED').length;
    const activeVolunteers = volunteers.filter(v => v.active).length;

    // Chart data
    const statusData = [
        { name: 'Pending', value: pendingCount },
        { name: 'Assigned', value: assignedCount },
        { name: 'Completed', value: completedCount },
    ];

    const urgencyData = [
        { name: 'High', value: requests.filter(r => r.urgencyLevel === 'HIGH').length },
        { name: 'Medium', value: requests.filter(r => r.urgencyLevel === 'MEDIUM').length },
        { name: 'Low', value: requests.filter(r => r.urgencyLevel === 'LOW').length },
    ];

    const serviceTypeData = {};
    requests.forEach(r => { serviceTypeData[r.serviceType] = (serviceTypeData[r.serviceType] || 0) + 1; });
    const serviceChartData = Object.entries(serviceTypeData).map(([name, value]) => ({ name, value }));

    const locationData = {};
    volunteers.forEach(v => { locationData[v.location] = (locationData[v.location] || 0) + 1; });
    const locationChartData = Object.entries(locationData).map(([name, count]) => ({ name, count }));

    const adaptiveData = getAdaptiveSuggestions();

    if (loading) {
        return (
            <div className="app-layout">
                <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
                <div className="main-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div className="text-center">
                        <Activity size={48} style={{ marginBottom: 16, opacity: 0.5, color: 'var(--accent-purple)' }} />
                        <p className="text-muted">Connecting to VolunAI backend...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="app-layout">
            <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
            <div className="main-content">

                {/* ── Overview Tab ── */}
                {activeTab === 'overview' && (
                    <>
                        <div className="page-header">
                            <h2>📊 Admin Overview</h2>
                            <p>VolunAI Autonomous Coordination Dashboard</p>
                        </div>

                        <div className="stats-grid">
                            <div className="stat-card" style={{ animationDelay: '0.1s' }}>
                                <div className="stat-icon purple"><ClipboardList size={24} /></div>
                                <div className="stat-info"><h3>{requests.length}</h3><p>Total Requests</p></div>
                            </div>
                            <div className="stat-card" style={{ animationDelay: '0.2s' }}>
                                <div className="stat-icon amber"><Clock size={24} /></div>
                                <div className="stat-info"><h3>{pendingCount}</h3><p>Pending</p></div>
                            </div>
                            <div className="stat-card" style={{ animationDelay: '0.3s' }}>
                                <div className="stat-icon blue"><Send size={24} /></div>
                                <div className="stat-info"><h3>{assignedCount}</h3><p>Assigned</p></div>
                            </div>
                            <div className="stat-card" style={{ animationDelay: '0.4s' }}>
                                <div className="stat-icon green"><CheckCircle2 size={24} /></div>
                                <div className="stat-info"><h3>{completedCount}</h3><p>Completed</p></div>
                            </div>
                            <div className="stat-card" style={{ animationDelay: '0.5s' }}>
                                <div className="stat-icon cyan"><Users size={24} /></div>
                                <div className="stat-info"><h3>{activeVolunteers}</h3><p>Active Volunteers</p></div>
                            </div>
                            <div className="stat-card" style={{ animationDelay: '0.6s' }}>
                                <div className="stat-icon rose"><Brain size={24} /></div>
                                <div className="stat-info"><h3>{adaptiveData.totalOutcomes}</h3><p>AI Outcomes Logged</p></div>
                            </div>
                        </div>

                        <div className="grid-2 mb-24">
                            <div className="glass-card">
                                <div className="card-title"><BarChart3 size={18} /> Request Status</div>
                                <ResponsiveContainer width="100%" height={220}>
                                    <PieChart>
                                        <Pie data={statusData} cx="50%" cy="50%" outerRadius={80} dataKey="value"
                                            label={({ name, value }) => `${name}: ${value}`}>
                                            {statusData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i]} />)}
                                        </Pie>
                                        <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>

                            <div className="glass-card">
                                <div className="card-title"><AlertTriangle size={18} /> Urgency Breakdown</div>
                                <ResponsiveContainer width="100%" height={220}>
                                    <BarChart data={urgencyData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                        <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
                                        <YAxis stroke="#64748b" fontSize={12} />
                                        <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }} />
                                        <Bar dataKey="value" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Recent Requests */}
                        <div className="glass-card">
                            <div className="card-title"><ClipboardList size={18} /> Recent Requests</div>
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>ID</th><th>Requester</th><th>Service</th><th>Location</th><th>Urgency</th><th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {requests.slice(0, 5).map(r => (
                                        <tr key={r.id}>
                                            <td>#{r.id}</td>
                                            <td>{r.requesterName}</td>
                                            <td>{r.serviceType}</td>
                                            <td><MapPin size={12} style={{ marginRight: 4 }} />{r.location}</td>
                                            <td><span className={`badge badge-${r.urgencyLevel?.toLowerCase()}`}>{r.urgencyLevel}</span></td>
                                            <td><span className={`badge badge-${r.status?.toLowerCase()}`}>{r.status}</span></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}

                {/* ── Create Request Tab ── */}
                {activeTab === 'create' && (
                    <>
                        <div className="page-header">
                            <h2>🧠 Create Service Request</h2>
                            <p>AI will automatically interpret your request and match the best volunteers</p>
                        </div>

                        <div className="grid-2">
                            <div className="glass-card">
                                <div className="card-title"><PlusCircle size={18} /> Request Form</div>
                                <form onSubmit={handleCreateRequest}>
                                    <div className="grid-2" style={{ gap: 20 }}>
                                        <div className="form-group">
                                            <label>Requester Name</label>
                                            <input className="form-input" value={form.requesterName}
                                                onChange={e => setForm(f => ({ ...f, requesterName: e.target.value }))}
                                                placeholder="Jane Smith" required />
                                        </div>
                                        <div className="form-group">
                                            <label>Contact</label>
                                            <input className="form-input" value={form.requesterContact}
                                                onChange={e => setForm(f => ({ ...f, requesterContact: e.target.value }))}
                                                placeholder="555-1234" required />
                                        </div>
                                    </div>

                                    <div className="form-group">
                                        <label>Description</label>
                                        <textarea className="form-textarea" value={form.description}
                                            onChange={handleDescriptionChange}
                                            placeholder="Describe the service needed... (AI will analyze this text)"
                                            rows={4} required />
                                    </div>

                                    {nlpResult && (
                                        <div className="nlp-panel" style={{ animation: 'fadeInUp 0.3s ease' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                                                <Brain size={16} color="var(--accent-purple)" />
                                                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent-purple-light)' }}>
                                                    AI Request Understanding — Confidence: {Math.round(nlpResult.confidence * 100)}%
                                                </span>
                                            </div>
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                                {nlpResult.service_type && <span className="nlp-tag"><Target size={12} /> {nlpResult.service_type}</span>}
                                                <span className="nlp-tag"><AlertTriangle size={12} /> {nlpResult.urgency_level}</span>
                                                {nlpResult.location && <span className="nlp-tag"><MapPin size={12} /> {nlpResult.location}</span>}
                                                {nlpResult.required_skills.map((s, i) => <span key={i} className="nlp-tag"><Zap size={12} /> {s}</span>)}
                                            </div>
                                            <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8 }}>
                                                Analyzed {nlpResult.nlp_tokens} tokens
                                            </p>
                                        </div>
                                    )}

                                    <div className="grid-2" style={{ gap: 20 }}>
                                        <div className="form-group">
                                            <label>Location</label>
                                            <select className="form-select" value={form.location}
                                                onChange={e => setForm(f => ({ ...f, location: e.target.value }))} required>
                                                <option value="">Select location</option>
                                                <option>New York</option><option>Los Angeles</option>
                                                <option>Chicago</option><option>San Francisco</option>
                                            </select>
                                        </div>
                                        <div className="form-group">
                                            <label>Service Type</label>
                                            <select className="form-select" value={form.serviceType}
                                                onChange={e => setForm(f => ({ ...f, serviceType: e.target.value }))} required>
                                                <option value="">Select type</option>
                                                <option>Food Delivery</option><option>Medical Assistance</option>
                                                <option>Home Repair</option><option>Transportation</option>
                                                <option>Elder Care</option><option>Cleaning</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="form-group">
                                        <label>Urgency Level</label>
                                        <select className="form-select" value={form.urgencyLevel}
                                            onChange={e => setForm(f => ({ ...f, urgencyLevel: e.target.value }))} required>
                                            <option value="LOW">Low</option>
                                            <option value="MEDIUM">Medium</option>
                                            <option value="HIGH">High</option>
                                        </select>
                                    </div>

                                    <button type="submit" className="btn btn-primary btn-lg w-full" style={{ marginTop: 8 }}>
                                        <Sparkles size={18} /> Submit & Get AI Recommendations
                                    </button>
                                </form>
                            </div>

                            {/* AI Ranking Panel */}
                            <div className="glass-card">
                                <div className="card-title"><Target size={18} /> AI Volunteer Ranking</div>
                                {showRanking && aiRanking.length > 0 ? (
                                    <div>
                                        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>
                                            <Sparkles size={14} style={{ marginRight: 4, verticalAlign: 'middle' }} />
                                            {aiRanking.length} volunteers scored for Request #{createdRequest?.id}
                                        </p>
                                        {aiRanking.map((match, idx) => (
                                            <div key={match.volunteer.id} className="notification-card" style={{ animationDelay: `${idx * 0.1}s` }}>
                                                <div className="flex items-center justify-between" style={{ marginBottom: 8 }}>
                                                    <div className="flex items-center gap-12">
                                                        <div className="profile-avatar" style={{ width: 36, height: 36, fontSize: 14 }}>
                                                            {match.volunteer.name?.charAt(0)}
                                                        </div>
                                                        <div>
                                                            <div style={{ fontWeight: 600, fontSize: 14 }}>
                                                                #{idx + 1} {match.volunteer.name}
                                                            </div>
                                                            <div className="text-sm text-muted">
                                                                <MapPin size={11} style={{ marginRight: 3 }} />
                                                                {match.volunteer.location} · ⭐ {match.volunteer.rating}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div style={{ textAlign: 'right' }}>
                                                        <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--accent-purple-light)' }}>
                                                            {Math.round(match.totalScore * 100)}%
                                                        </div>
                                                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                                                            Accept: {Math.round(match.acceptanceProbability * 100)}%
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="score-bar-container">
                                                    <div className="score-bar">
                                                        <div className="score-bar-fill" style={{ width: `${match.totalScore * 100}%` }} />
                                                    </div>
                                                </div>

                                                <button onClick={() => setExpandedVolunteer(expandedVolunteer === match.volunteer.id ? null : match.volunteer.id)}
                                                    className="btn btn-ghost btn-sm" style={{ marginTop: 8, fontSize: 11 }}>
                                                    {expandedVolunteer === match.volunteer.id ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                                                    Score Breakdown
                                                </button>

                                                {expandedVolunteer === match.volunteer.id && (
                                                    <div className="score-breakdown" style={{ animation: 'fadeInUp 0.2s ease' }}>
                                                        {Object.entries(match.breakdown).map(([key, val]) => (
                                                            <div key={key} className="score-factor">
                                                                <span className="score-factor-label">{key}</span>
                                                                <span className="score-factor-value">{Math.round(val.score * 100)}% × {val.weight}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}

                                                <div className="flex gap-8" style={{ marginTop: 10 }}>
                                                    <button onClick={() => handleAssign(createdRequest.id, match.volunteer.id, match.volunteer.name)}
                                                        className="btn btn-success btn-sm">
                                                        <CheckCircle2 size={14} /> Approve
                                                    </button>
                                                    <button onClick={() => {
                                                        recordOutcome(match.volunteer.id, createdRequest.id, 'declined');
                                                        showToast('Skipped — select next candidate', 'info');
                                                    }}
                                                        className="btn btn-ghost btn-sm">
                                                        <XCircle size={14} /> Reject
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="empty-state">
                                        <div className="empty-icon">🤖</div>
                                        <p>Submit a request to see AI-ranked volunteers</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </>
                )}

                {/* ── Chat Requests Tab ── */}
                {activeTab === 'chatbox' && (
                    <>
                        <div className="page-header">
                            <h2>💬 Chat Requests Inbox</h2>
                            <p>Service requests submitted through the AI Chat interface — ready to match</p>
                        </div>

                        {/* Link to public chat */}
                        <div className="glass-card" style={{ marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <div style={{ width: 40, height: 40, borderRadius: 12, background: 'linear-gradient(135deg,#7c3aed,#4f46e5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <MessageSquare size={20} color="#fff" />
                                </div>
                                <div>
                                    <div style={{ fontWeight: 700, fontSize: 15 }}>Public Chat Request Page</div>
                                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Share this link with people who need assistance</div>
                                </div>
                            </div>
                            <a href="/chat" target="_blank" rel="noreferrer"
                                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 18px', background: 'linear-gradient(135deg,#7c3aed,#4f46e5)', borderRadius: 10, color: '#fff', textDecoration: 'none', fontWeight: 600, fontSize: 14 }}>
                                <ExternalLink size={15} /> Open Chat Page
                            </a>
                        </div>

                        {/* Pending requests table */}
                        <div className="glass-card">
                            <div className="card-title"><ClipboardList size={18} /> Incoming Requests ({requests.filter(r => r.status === 'PENDING').length} pending)</div>
                            {requests.filter(r => r.status === 'PENDING').length === 0 ? (
                                <div className="empty-state">
                                    <div className="empty-icon">📭</div>
                                    <p>No pending chat requests yet. Share the chat link to receive requests.</p>
                                </div>
                            ) : (
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th>ID</th><th>Requester</th><th>Service</th><th>Location</th>
                                            <th>Urgency</th><th>Description</th><th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {requests.filter(r => r.status === 'PENDING').map(r => (
                                            <tr key={r.id}>
                                                <td>#{r.id}</td>
                                                <td>
                                                    <strong>{r.requesterName}</strong><br />
                                                    <span className="text-sm text-muted">{r.requesterContact}</span>
                                                </td>
                                                <td>{r.serviceType}</td>
                                                <td><MapPin size={12} style={{ marginRight: 4 }} />{r.location}</td>
                                                <td><span className={`badge badge-${r.urgencyLevel?.toLowerCase()}`}>{r.urgencyLevel}</span></td>
                                                <td style={{ maxWidth: 220 }}>
                                                    <span style={{ fontSize: 12, color: 'var(--text-secondary)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                                        {r.description || '—'}
                                                    </span>
                                                </td>
                                                <td>
                                                    <button onClick={() => {
                                                        const ranked = rankVolunteers(volunteers, r);
                                                        setAiRanking(ranked);
                                                        setCreatedRequest(r);
                                                        setShowRanking(true);
                                                        setActiveTab('create');
                                                    }} className="btn btn-primary btn-sm">
                                                        <Brain size={12} /> Match AI
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </>
                )}

                {/* ── All Requests Tab ── */}
                {activeTab === 'requests' && (
                    <>
                        <div className="page-header">
                            <h2>📋 All Service Requests</h2>
                            <p>Track and manage all assistance requests</p>
                        </div>

                        <div className="glass-card">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>ID</th><th>Requester</th><th>Service</th><th>Location</th>
                                        <th>Urgency</th><th>Status</th><th>Assigned To</th><th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {requests.map(r => (
                                        <tr key={r.id}>
                                            <td>#{r.id}</td>
                                            <td>
                                                <strong>{r.requester_name}</strong><br />
                                                <span className="text-sm text-muted">{r.requester_contact}</span>
                                            </td>
                                            <td>{r.service_type}</td>
                                            <td>{r.location}</td>
                                            <td><span className={`badge badge-${r.urgency_level?.toLowerCase()}`}>{r.urgency_level}</span></td>
                                            <td><span className={`badge badge-${r.status?.toLowerCase()}`}>{r.status}</span></td>
                                            <td>
                                                {r.assigned_volunteer_name
                                                    ? <span className="text-sm">{r.assigned_volunteer_name}</span>
                                                    : <span className="text-muted text-sm">—</span>}
                                            </td>
                                            <td>
                                                {r.status === 'ASSIGNED' && (
                                                    <button onClick={() => handleStatusChange(r.id, 'COMPLETED')}
                                                        className="btn btn-success btn-sm">
                                                        <CheckCircle2 size={12} /> Complete
                                                    </button>
                                                )}
                                                {r.status === 'PENDING' && (
                                                    <button onClick={() => {
                                                        const ranked = rankVolunteers(volunteers, r);
                                                        setAiRanking(ranked);
                                                        setCreatedRequest(r);
                                                        setShowRanking(true);
                                                        setActiveTab('create');
                                                    }} className="btn btn-primary btn-sm">
                                                        <Brain size={12} /> Match AI
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}

                {/* ── Volunteers Tab ── */}
                {activeTab === 'volunteers' && (
                    <>
                        <div className="page-header">
                            <h2>👥 Volunteer Database</h2>
                            <p>{volunteers.length} registered volunteers · {activeVolunteers} active</p>
                        </div>

                        <div className="glass-card">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Volunteer</th><th>Location</th><th>Services</th>
                                        <th>Available Days</th><th>Rating</th><th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {volunteers.map(v => (
                                        <tr key={v.id}>
                                            <td>
                                                <div className="flex items-center gap-12">
                                                    <div className="profile-avatar" style={{ width: 32, height: 32, fontSize: 13 }}>
                                                        {v.name?.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <div style={{ fontWeight: 600 }}>{v.name}</div>
                                                        <div className="text-sm text-muted">{v.email}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td><MapPin size={12} style={{ marginRight: 4 }} />{v.location}</td>
                                            <td>
                                                <div className="chip-group">
                                                    {v.serviceType?.map((s, i) => <span key={i} className="chip">{s}</span>)}
                                                </div>
                                            </td>
                                            <td>
                                                <div className="chip-group">
                                                    {v.availableDays?.map((d, i) => <span key={i} className="chip">{d.slice(0, 3)}</span>)}
                                                </div>
                                            </td>
                                            <td>
                                                <div className="score-bar-container">
                                                    <div className="score-bar" style={{ width: 60 }}>
                                                        <div className="score-bar-fill" style={{ width: `${(v.rating / 5) * 100}%` }} />
                                                    </div>
                                                    <span className="score-value">{v.rating}</span>
                                                </div>
                                            </td>
                                            <td>
                                                <span className={`badge ${v.active ? 'badge-completed' : 'badge-high'}`}>
                                                    {v.active ? 'Active' : 'Inactive'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}

                {/* ── Analytics Tab ── */}
                {activeTab === 'analytics' && (
                    <>
                        <div className="page-header">
                            <h2>📈 Performance Analytics</h2>
                            <p>AI-driven insights and system intelligence metrics</p>
                        </div>

                        <div className="stats-grid">
                            <div className="stat-card">
                                <div className="stat-icon purple"><TrendingUp size={24} /></div>
                                <div className="stat-info">
                                    <h3>{Math.round(adaptiveData.successRate * 100)}%</h3>
                                    <p>AI Success Rate</p>
                                </div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-icon green"><CheckCircle2 size={24} /></div>
                                <div className="stat-info">
                                    <h3>{adaptiveData.totalOutcomes}</h3>
                                    <p>Total Outcomes</p>
                                </div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-icon cyan"><Brain size={24} /></div>
                                <div className="stat-info">
                                    <h3>{volunteers.length > 0 ? (volunteers.reduce((a, v) => a + v.rating, 0) / volunteers.length).toFixed(1) : 0}</h3>
                                    <p>Avg Volunteer Rating</p>
                                </div>
                            </div>
                        </div>

                        <div className="grid-2 mb-24">
                            <div className="glass-card">
                                <div className="card-title"><BarChart3 size={18} /> Service Type Distribution</div>
                                <ResponsiveContainer width="100%" height={250}>
                                    <BarChart data={serviceChartData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                        <XAxis dataKey="name" stroke="#64748b" fontSize={11} angle={-20} textAnchor="end" height={60} />
                                        <YAxis stroke="#64748b" fontSize={12} />
                                        <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }} />
                                        <Bar dataKey="value" fill="#06b6d4" radius={[6, 6, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>

                            <div className="glass-card">
                                <div className="card-title"><MapPin size={18} /> Volunteer Location Spread</div>
                                <ResponsiveContainer width="100%" height={250}>
                                    <BarChart data={locationChartData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                        <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                                        <YAxis stroke="#64748b" fontSize={12} />
                                        <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }} />
                                        <Bar dataKey="count" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        <div className="glass-card">
                            <div className="card-title"><Sparkles size={18} /> AI Matching Formula</div>
                            <div style={{ background: 'var(--bg-glass)', borderRadius: 'var(--radius-md)', padding: 20, fontFamily: 'monospace', fontSize: 13, lineHeight: 2 }}>
                                <span style={{ color: 'var(--accent-purple-light)' }}>match_score</span> = {'\n'}
                                &nbsp;&nbsp;(<span style={{ color: 'var(--accent-cyan)' }}>0.25</span> × availability_score) + {'\n'}
                                &nbsp;&nbsp;(<span style={{ color: 'var(--accent-cyan)' }}>0.20</span> × proximity_score) + {'\n'}
                                &nbsp;&nbsp;(<span style={{ color: 'var(--accent-cyan)' }}>0.25</span> × skill_match_score) + {'\n'}
                                &nbsp;&nbsp;(<span style={{ color: 'var(--accent-cyan)' }}>0.15</span> × reliability_score) + {'\n'}
                                &nbsp;&nbsp;(<span style={{ color: 'var(--accent-cyan)' }}>0.15</span> × predicted_acceptance)
                            </div>
                        </div>
                    </>
                )}

                {/* Toast */}
                {toast && (
                    <div className={`toast ${toast.type}`}>
                        {toast.type === 'success' && <CheckCircle2 size={18} color="var(--accent-green)" />}
                        {toast.type === 'error' && <XCircle size={18} color="var(--accent-rose)" />}
                        {toast.type === 'info' && <Brain size={18} color="var(--accent-blue)" />}
                        <span style={{ fontSize: 14 }}>{toast.msg}</span>
                    </div>
                )}
            </div>
        </div>
    );
}

/* ── Sidebar Component ── */
function Sidebar({ activeTab, setActiveTab }) {
    return (
        <div className="sidebar">
            <div className="sidebar-logo">
                <div className="logo-icon">🤖</div>
                <div>
                    <h1>VolunAI</h1>
                    <span>Admin Panel</span>
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
                    </div>
                ))}
            </div>

            <div style={{ marginTop: 'auto', padding: '16px 0', borderTop: '1px solid var(--border-glass)', display: 'flex', flexDirection: 'column', gap: 4 }}>
                <a href="/chat" target="_blank" rel="noreferrer" className="sidebar-link" style={{ color: 'var(--accent-purple-light)' }}>
                    <MessageSquare size={18} className="link-icon" /> Open Chat Page
                </a>
                <Link to="/" className="sidebar-link">
                    <Home size={18} className="link-icon" /> Back to Home
                </Link>
            </div>
        </div>
    );
}
