import { ClipboardList, Clock, CheckCircle2, Star, MapPin, PlusCircle, RefreshCw } from 'lucide-react';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';

export default function CommunityMyRequests({ requests, loading, onRefresh, onNew }) {
    const pending   = requests.filter(r => r.status === 'PENDING').length;
    const assigned  = requests.filter(r => r.status === 'ASSIGNED').length;
    const completed = requests.filter(r => r.status === 'COMPLETED').length;

    const urgencyStripe = { HIGH: 'var(--rose)', MEDIUM: 'var(--amber)', LOW: 'var(--mint)' };

    return (
        <div className="animate-fadeIn">
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
                <div>
                    <h1 className="page-title">My Requests 📋</h1>
                    <p className="page-subtitle">Track the status of your submitted assistance requests.</p>
                </div>
                <Button variant="ghost" size="sm" onClick={onRefresh} icon={RefreshCw}>Refresh</Button>
            </div>

            <div className="grid-4" style={{ marginBottom: 28 }}>
                {[
                    { label: 'Total',     value: requests.length, color: 'coral', emoji: '📂' },
                    { label: 'Pending',   value: pending,         color: 'amber', emoji: '⏳' },
                    { label: 'Assigned',  value: assigned,        color: 'sky',   emoji: '🚀' },
                    { label: 'Completed', value: completed,       color: 'mint',  emoji: '✅' },
                ].map((s, i) => (
                    <div key={i} className="stat-card">
                        <div className={`stat-icon-wrap ${s.color}`} style={{ fontSize: 22 }}>{s.emoji}</div>
                        <div>
                            <div className="stat-value">{s.value}</div>
                            <div className="stat-label">{s.label}</div>
                        </div>
                    </div>
                ))}
            </div>

            {loading ? (
                <div className="empty-state"><div className="empty-icon">🌸</div><p>Loading your requests…</p></div>
            ) : requests.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-icon">📋</div>
                    <h3>No Requests Yet</h3>
                    <p>You haven't submitted any help requests yet. When you do, they'll appear here with live status updates.</p>
                    <Button variant="primary" onClick={onNew} icon={PlusCircle} style={{ marginTop: 8 }}>Submit Your First Request</Button>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {requests.map((req, i) => (
                        <div
                            key={req.id || i}
                            className="card"
                            style={{ borderLeft: `4px solid ${urgencyStripe[req.urgency_level] || 'var(--border)'}`, transition: 'all 0.2s' }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10, marginBottom: 12 }}>
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                                        <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', background: 'var(--bg-page)', padding: '2px 8px', borderRadius: 99, border: '1px solid var(--border)' }}>
                                            #{req.id}
                                        </span>
                                        <span style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-primary)' }}>{req.service_type}</span>
                                        <Badge variant={req.urgency_level}>{req.urgency_level}</Badge>
                                    </div>
                                    {req.description && (
                                        <p style={{ fontSize: 13, color: 'var(--text-muted)', fontStyle: 'italic', lineHeight: 1.5 }}>"{req.description}"</p>
                                    )}
                                </div>
                                <Badge variant={req.status}>{req.status}</Badge>
                            </div>

                            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>
                                {req.location && (
                                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                        <MapPin size={12} style={{ color: 'var(--coral)' }} /> {req.location}
                                    </span>
                                )}
                                {req.assigned_volunteer_name && (
                                    <span>🙋 Volunteer: <strong style={{ color: 'var(--text-secondary)' }}>{req.assigned_volunteer_name}</strong></span>
                                )}
                            </div>

                            {req.status === 'ASSIGNED' && (
                                <div style={{ marginTop: 12, padding: '10px 14px', background: 'var(--sky-light)', border: '1px solid #B8DFF8', borderRadius: 10, fontSize: 13, color: '#2E6090', fontWeight: 600 }}>
                                    🚀 A volunteer has been assigned and will contact you soon.
                                </div>
                            )}
                            {req.status === 'COMPLETED' && (
                                <div style={{ marginTop: 12, padding: '10px 14px', background: 'var(--sage)', border: '1px solid #B0DCC0', borderRadius: 10, fontSize: 13, color: '#2E7A50', fontWeight: 600 }}>
                                    ✅ This request has been completed. Thank you for using VolunAI!
                                </div>
                            )}
                        </div>
                    ))}

                    <div style={{ textAlign: 'center', marginTop: 8 }}>
                        <Button variant="primary" onClick={onNew} icon={PlusCircle}>Submit Another Request</Button>
                    </div>
                </div>
            )}
        </div>
    );
}
