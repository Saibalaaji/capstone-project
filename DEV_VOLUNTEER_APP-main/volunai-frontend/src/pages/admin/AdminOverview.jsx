import { useState, useEffect } from 'react';
import { Users, ClipboardList, CheckCircle2, Clock, TrendingUp, Heart, MapPin, Star } from 'lucide-react';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import { getVolunteers, getRequests } from '../../services/api';

export default function AdminOverview() {
    const [stats, setStats] = useState({ volunteers: 0, pending: 0, assigned: 0, completed: 0 });
    const [recentRequests, setRecentRequests] = useState([]);
    const [topVolunteers, setTopVolunteers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [vRes, rRes] = await Promise.all([getVolunteers(), getRequests()]);
                const volunteers = vRes.data || [];
                const requests = rRes.data || [];
                setStats({
                    volunteers: volunteers.length,
                    pending:   requests.filter(r => r.status === 'PENDING').length,
                    assigned:  requests.filter(r => r.status === 'ASSIGNED').length,
                    completed: requests.filter(r => r.status === 'COMPLETED').length,
                });
                setRecentRequests(requests.slice(0, 5));
                setTopVolunteers(volunteers.sort((a, b) => (b.rating || 0) - (a.rating || 0)).slice(0, 4));
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) return (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}>
            <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>🌸</div>
                <p style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Loading dashboard…</p>
            </div>
        </div>
    );

    const statCards = [
        { label: 'Total Volunteers', value: stats.volunteers, icon: Users,        color: 'coral',  emoji: '🤝' },
        { label: 'Pending Requests', value: stats.pending,    icon: Clock,        color: 'amber',  emoji: '⏳' },
        { label: 'Active Assigned',  value: stats.assigned,   icon: ClipboardList,color: 'sky',    emoji: '🚀' },
        { label: 'Completed Tasks',  value: stats.completed,  icon: CheckCircle2, color: 'mint',   emoji: '✅' },
    ];

    return (
        <div className="animate-fadeIn">
            {/* Header */}
            <div className="page-header">
                <h1 className="page-title">Good morning! 🌻</h1>
                <p className="page-subtitle">Here's what's happening in your community today.</p>
            </div>

            {/* KPI Cards */}
            <div className="grid-4" style={{ marginBottom: 32 }}>
                    {statCards.map((s, i) => (
                        <div key={i} className={`stat-card card-interactive ${['coral','amber','sky','mint'][i]}`}>
                            <div className={`stat-icon-wrap ${s.color}`}>
                                <s.icon size={24} />
                            </div>
                            <div>
                                <div className="stat-value">{s.value}</div>
                                <div className="stat-label">{s.label}</div>
                            </div>
                        </div>
                    ))}
            </div>

            <div className="grid-2" style={{ alignItems: 'start' }}>
                {/* Recent Requests */}
                <Card>
                    <div className="card-title">
                        <ClipboardList size={15} style={{ color: 'var(--coral)' }} /> Recent Requests
                    </div>
                    {recentRequests.length === 0 ? (
                        <div className="empty-state" style={{ padding: '32px 0' }}>
                            <div className="empty-icon">📋</div>
                            <p>No requests yet</p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            {recentRequests.map((req, i) => (
                                <div key={req.id || i} style={{
                                    display: 'flex', alignItems: 'center', gap: 12,
                                    padding: '12px 0',
                                    borderBottom: i < recentRequests.length - 1 ? '1px solid var(--border-card)' : 'none',
                                }}>
                                    <div style={{
                                        width: 36, height: 36, borderRadius: 10,
                                        background: req.urgency_level === 'HIGH' ? 'var(--rose-light)' : req.urgency_level === 'MEDIUM' ? 'var(--amber-light)' : 'var(--sage)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: 16, flexShrink: 0,
                                    }}>
                                        {req.urgency_level === 'HIGH' ? '🔴' : req.urgency_level === 'MEDIUM' ? '🟡' : '🟢'}
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {req.service_type}
                                        </div>
                                        <div style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                                            <MapPin size={11} /> {req.location}
                                        </div>
                                    </div>
                                    <Badge variant={req.status}>{req.status}</Badge>
                                </div>
                            ))}
                        </div>
                    )}
                </Card>

                {/* Top Volunteers */}
                <Card>
                    <div className="card-title">
                        <Heart size={15} style={{ color: 'var(--coral)' }} /> Top Volunteers
                    </div>
                    {topVolunteers.length === 0 ? (
                        <div className="empty-state" style={{ padding: '32px 0' }}>
                            <div className="empty-icon">👥</div>
                            <p>No volunteers yet</p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                            {topVolunteers.map((v, i) => (
                                <div key={v.id || i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                    <div style={{
                                        width: 36, height: 36, borderRadius: '50%',
                                        background: `hsl(${(i * 60 + 10)}deg 70% 75%)`,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: 14, fontWeight: 800, color: 'white', flexShrink: 0,
                                    }}>
                                        {v.name?.[0]?.toUpperCase()}
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{v.name}</div>
                                        <div style={{ fontSize: 11, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {(v.serviceType || []).slice(0, 2).join(' · ')}
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 12, fontWeight: 700, color: '#B07000' }}>
                                        <Star size={12} fill="#FFB000" color="#FFB000" /> {(v.rating || 0).toFixed(1)}
                                    </div>
                                    <Badge variant={v.availabilityStatus}>{v.availabilityStatus}</Badge>
                                </div>
                            ))}
                        </div>
                    )}
                </Card>
            </div>
        </div>
    );
}
