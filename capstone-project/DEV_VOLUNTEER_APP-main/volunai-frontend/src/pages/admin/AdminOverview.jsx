import { useState, useEffect } from 'react';
import { Users, ClipboardList, CircleCheck, TrendingUp, Search, Bell, MapPin, Star, UserPlus, Clock, Heart } from 'lucide-react';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import MapView from '../../components/common/MapView';
import WeeklyActivityGraph from '../../components/common/WeeklyActivityGraph';
import { getVolunteers, getRequests, updateRequestStatus } from '../../services/api';

export default function AdminOverview() {
    const [stats, setStats] = useState({ volunteers: 0, pending: 0, active: 0, completed: 0 });
    const [requests, setRequests] = useState([]);
    const [topVolunteers, setTopVolunteers] = useState([]);
    const [volunteers, setVolunteers] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Madurai coordinates as default map context
    const [selectedCity, setSelectedCity] = useState({ lat: 9.9252, lng: 78.1198 });

    const fetchData = async () => {
        try {
            const [vRes, rRes] = await Promise.all([getVolunteers(), getRequests()]);
            const volunteersList = vRes.data || [];
            const reqData = rRes.data || [];
            
            setStats({
                volunteers: volunteersList.filter(v => v.availabilityStatus === 'AVAILABLE').length,
                pending:   reqData.filter(r => r.status === 'PENDING').length,
                active:  reqData.filter(r => r.status === 'ASSIGNED').length,
                completed: reqData.filter(r => r.status === 'COMPLETED').length,
            });
            setRequests(reqData);
            setVolunteers(volunteersList);
            setTopVolunteers(volunteersList.sort((a, b) => (b.rating || 0) - (a.rating || 0)).slice(0, 4));
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleAcceptRequest = async (id) => {
        try {
            await updateRequestStatus(id, 'ASSIGNED');
            fetchData(); // Refresh list to reflect changes visually
        } catch (error) {
            console.error("Failed to accept request", error);
            alert("Could not assign request. Check backend logs.");
        }
    };

    if (loading) return (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}>
            <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>🌸</div>
                <p style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Loading dashboard…</p>
            </div>
        </div>
    );

    const statCards = [
        { label: 'Active Requests', value: stats.active, icon: TrendingUp,  color: 'coral' },
        { label: 'Pending Requests',value: stats.pending, icon: Clock,      color: 'amber' },
        { label: 'Available Vols',  value: stats.volunteers, icon: Users,    color: 'sky' },
        { label: 'Completed Tasks', value: stats.completed, icon: CircleCheck, color: 'mint' },
    ];

    // Simple mock data for Weekly chart
    const mockWeeklyData = [
        { name: 'Mon', requests: 12 }, { name: 'Tue', requests: 28 }, { name: 'Wed', requests: 18 },
        { name: 'Thu', requests: 42 }, { name: 'Fri', requests: 35 }, { name: 'Sat', requests: 50 }, { name: 'Sun', requests: 30 }
    ];
    
    const pendingRequests = requests.filter(r => r.status === 'PENDING').slice(0, 4);

    return (
        <div className="animate-fade-in-up" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            
            {/* Header Area */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 className="page-title">Welcome back, Admin! 👋</h1>
                    <p className="page-subtitle">Here is what is happening across your city today.</p>
                </div>
            </div>

            {/* Top Metric Cards */}
            <div className="grid-4">
                {statCards.map((s, i) => (
                    <div key={i} className={`stat-card card-interactive ${s.color}`}>
                        <div className={`stat-icon-wrap ${s.color}`}>
                            <s.icon size={22} />
                        </div>
                        <div>
                            <div className="stat-value" style={{ fontSize: 24, paddingBottom: 2 }}>{s.value}</div>
                            <div className="stat-label" style={{ fontSize: 11 }}>{s.label}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Main Content Layout (Left Columns + Right Panel) */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 24, alignItems: 'start' }}>
                
                {/* Center Column / Left Panel */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                    
                    {/* New Requests Feed */}
                    <div className="card">
                        <div className="card-title">
                            <ClipboardList size={18} style={{ color: 'var(--coral)' }} /> New Requests Feed
                        </div>
                        
                        {pendingRequests.length === 0 ? (
                            <div className="empty-state" style={{ padding: '30px 0' }}>
                                <p>No pending requests.</p>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                {pendingRequests.map((req, i) => (
                                    <div key={req.id || i} style={{
                                        display: 'flex', alignItems: 'center', gap: 12,
                                        padding: '12px 14px', background: '#f8fafc', borderRadius: 12,
                                        border: '1px solid var(--border-card)'
                                    }}>
                                        {/* Avatar Placeholder */}
                                        <div style={{
                                            width: 40, height: 40, borderRadius: '50%', background: 'var(--peach-light)',
                                            color: 'var(--coral-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold'
                                        }}>
                                            {(req.contact_name?.[0] || 'U').toUpperCase()}
                                        </div>
                                        
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)' }}>
                                                {req.service_type}
                                                <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500, marginLeft: 6 }}>
                                                    - {req.location || 'Unknown Location'}
                                                </span>
                                            </div>
                                            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                                                {req.description?.substring(0, 50)}...
                                            </div>
                                        </div>
                                        
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                            <Badge variant={req.status}>{req.status}</Badge>
                                            <Button variant="outline" size="sm" onClick={() => handleAcceptRequest(req.id)}>
                                                Accept
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Lower Left Two-Column Grid: AI Matching + Top Vols */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                        {/* Top Volunteers */}
                        <div className="card">
                            <div className="card-title">
                                <Heart size={18} style={{ color: 'var(--coral)' }} /> Top Volunteers
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                                {topVolunteers.map((v, i) => (
                                    <div key={v.id || i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                        <div style={{
                                            width: 36, height: 36, borderRadius: '50%',
                                            background: `hsl(${(i * 40 + 10)}deg 70% 75%)`, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            color: 'white', fontWeight: 'bold'
                                        }}>
                                            {v.name?.[0]?.toUpperCase()}
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{v.name}</div>
                                            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{v.serviceType?.[0] || 'General'}</div>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 13, fontWeight: 700, color: '#f59e0b' }}>
                                            <Star size={14} fill="#f59e0b" color="#f59e0b" /> {(v.rating || 0).toFixed(1)}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* AI Matching Queue */}
                        <div className="card">
                            <div className="card-title">
                                <UserPlus size={18} style={{ color: 'var(--coral)' }} /> AI Matching Queue
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                                {pendingRequests.slice(0,3).map((req, i) => (
                                    <div key={'ai-'+i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px', background: '#fff7ed', borderRadius: 10, border: '1px solid #ffedd5' }}>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-coral)' }}>Auto-Match Foundry</div>
                                            <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Assigning volunteer to #{req.id}...</div>
                                        </div>
                                        <div style={{ height: 6, width: 6, borderRadius: '50%', background: 'var(--coral)', animation: 'pulse 1.5s infinite' }} />
                                    </div>
                                ))}
                                {pendingRequests.length === 0 && <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>No matches analyzing.</p>}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="transition-all duration-300 ease-in-out" style={{ display: 'flex', flexDirection: 'column', gap: 24, position: 'sticky', top: 24 }}>
                    <MapView 
                        selectedCityCenter={selectedCity} 
                        activeRequests={requests.filter(r => r.status === 'ASSIGNED' || r.status === 'PENDING')} 
                        volunteers={volunteers}
                    />
                    <WeeklyActivityGraph data={mockWeeklyData} />
                </div>
            </div>
            
            <style>{`
                @keyframes pulse { 0% { opacity: 1; transform: scale(1); } 50% { opacity: 0.5; transform: scale(1.5); } 100% { opacity: 1; transform: scale(1); } }
            `}</style>
        </div>
    );
}
