import { useState, useEffect } from 'react';
import { Search, Filter, ToggleRight, Mail, MapPin, Star, Briefcase } from 'lucide-react';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import { getVolunteers, toggleVolunteerAvailability } from '../../services/api';

export default function AdminVolunteers() {
    const [volunteers, setVolunteers] = useState([]);
    const [filtered, setFiltered] = useState([]);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState(null);

    const showToast = (msg, type = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3500);
    };

    useEffect(() => {
        getVolunteers()
            .then(res => { setVolunteers(res.data || []); setFiltered(res.data || []); })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        let list = volunteers;
        if (search) list = list.filter(v => v.name?.toLowerCase().includes(search.toLowerCase()) || v.location?.toLowerCase().includes(search.toLowerCase()));
        if (statusFilter !== 'ALL') list = list.filter(v => v.availabilityStatus === statusFilter);
        setFiltered(list);
    }, [search, statusFilter, volunteers]);

    const handleToggle = async (v) => {
        const newStatus = v.availabilityStatus === 'AVAILABLE' ? 'BUSY' : 'AVAILABLE';
        try {
            await toggleVolunteerAvailability(v.id, newStatus);
            setVolunteers(prev => prev.map(x => x.id === v.id ? { ...x, availabilityStatus: newStatus } : x));
            showToast(`${v.name} set to ${newStatus}`);
        } catch { showToast('Failed to update status', 'error'); }
    };

    return (
        <div className="animate-fadeIn">
            <div className="page-header">
                <h1 className="page-title">Volunteers 🤝</h1>
                <p className="page-subtitle">Manage your community volunteer roster.</p>
            </div>

            {/* Filters */}
            <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap', alignItems: 'center' }}>
                <div style={{ position: 'relative', flex: 1, minWidth: 220 }}>
                    <Search size={15} style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input
                        className="form-input with-icon"
                        style={{ margin: 0 }}
                        placeholder="Search by name or location…"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                    {['ALL', 'AVAILABLE', 'BUSY', 'INACTIVE'].map(s => (
                        <button
                            key={s}
                            onClick={() => setStatusFilter(s)}
                            className={`btn btn-sm ${statusFilter === s ? 'btn-primary' : 'btn-ghost'}`}
                        >
                            {s === 'ALL' ? 'All' : s}
                        </button>
                    ))}
                </div>
            </div>

            {loading ? (
                <div className="empty-state"><div className="empty-icon">🌸</div><p>Loading volunteers…</p></div>
            ) : filtered.length === 0 ? (
                <div className="empty-state"><div className="empty-icon">👥</div><h3>No volunteers found</h3><p>Try adjusting your search or filters.</p></div>
            ) : (
                <div className="grid-3">
                    {filtered.map((v, i) => (
                        <div key={v.id || i} className="card" style={{ transition: 'all 0.2s' }}>
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 16 }}>
                                <div className="avatar avatar-md" style={{ background: `hsl(${(i * 47 + 10)}deg 65% 72%)` }}>
                                    {v.name?.[0]?.toUpperCase()}
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 3 }}>{v.name}</div>
                                    <Badge variant={v.availabilityStatus}>{v.availabilityStatus}</Badge>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 12, fontWeight: 800, color: '#B07000' }}>
                                    <Star size={12} fill="#FFB000" color="#FFB000" /> {(v.rating || 0).toFixed(1)}
                                </div>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                                {v.location && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-muted)' }}>
                                        <MapPin size={12} style={{ color: 'var(--coral)' }} /> {v.location}
                                    </div>
                                )}
                                {v.email && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-muted)', overflow: 'hidden' }}>
                                        <Mail size={12} style={{ color: 'var(--coral)' }} />
                                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v.email}</span>
                                    </div>
                                )}
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-muted)' }}>
                                    <Briefcase size={12} style={{ color: 'var(--mint)' }} />
                                    <span>{v.completedTasks || 0} tasks completed</span>
                                </div>
                            </div>

                            {(v.serviceType || []).length > 0 && (
                                <div className="chip-group" style={{ marginBottom: 16 }}>
                                    {(v.serviceType || []).slice(0, 3).map(s => (
                                        <span key={s} className="chip active" style={{ fontSize: 11, padding: '3px 10px' }}>{s}</span>
                                    ))}
                                    {(v.serviceType || []).length > 3 && (
                                        <span className="chip" style={{ fontSize: 11, padding: '3px 10px' }}>+{(v.serviceType).length - 3}</span>
                                    )}
                                </div>
                            )}

                            <Button variant="ghost" size="sm" onClick={() => handleToggle(v)} icon={ToggleRight} style={{ width: '100%', justifyContent: 'center' }}>
                                {v.availabilityStatus === 'AVAILABLE' ? 'Set Busy' : 'Set Available'}
                            </Button>
                        </div>
                    ))}
                </div>
            )}

            {toast && (
                <div className="toast-container">
                    <div className={`toast ${toast.type}`}>{toast.msg}</div>
                </div>
            )}
        </div>
    );
}
