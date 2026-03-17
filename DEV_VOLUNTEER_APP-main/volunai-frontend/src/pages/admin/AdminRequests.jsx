import { useState, useEffect } from 'react';
import { Search, MapPin, Filter } from 'lucide-react';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import { getRequests, updateRequestStatus, assignVolunteer, getVolunteers } from '../../services/api';

export default function AdminRequests() {
    const [requests, setRequests] = useState([]);
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
        getRequests()
            .then(res => { setRequests(res.data || []); setFiltered(res.data || []); })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        let list = requests;
        if (search) list = list.filter(r =>
            r.service_type?.toLowerCase().includes(search.toLowerCase()) ||
            r.location?.toLowerCase().includes(search.toLowerCase()) ||
            r.requester_name?.toLowerCase().includes(search.toLowerCase())
        );
        if (statusFilter !== 'ALL') list = list.filter(r => r.status === statusFilter);
        setFiltered(list);
    }, [search, statusFilter, requests]);

    const urgencyColor = (u) => ({ HIGH: '#C05050', MEDIUM: '#B07000', LOW: '#2E7A50' }[u] || '#6B7280');
    const urgencyBg   = (u) => ({ HIGH: '#FFF0F0', MEDIUM: '#FFF8E8', LOW: '#F0FAF4' }[u] || '#F5F5F5');

    return (
        <div className="animate-fadeIn">
            <div className="page-header">
                <h1 className="page-title">Service Requests 📋</h1>
                <p className="page-subtitle">Review and manage all community assistance requests.</p>
            </div>

            {/* Filters */}
            <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap', alignItems: 'center' }}>
                <div style={{ position: 'relative', flex: 1, minWidth: 220 }}>
                    <Search size={15} style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input className="form-input with-icon" style={{ margin: 0 }} placeholder="Search requests…" value={search} onChange={e => setSearch(e.target.value)} />
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {['ALL', 'PENDING', 'ASSIGNED', 'COMPLETED'].map(s => (
                        <button key={s} onClick={() => setStatusFilter(s)} className={`btn btn-sm ${statusFilter === s ? 'btn-primary' : 'btn-ghost'}`}>
                            {s === 'ALL' ? 'All' : s}
                        </button>
                    ))}
                </div>
            </div>

            {loading ? (
                <div className="empty-state"><div className="empty-icon">🌸</div><p>Loading requests…</p></div>
            ) : filtered.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-icon">📋</div>
                    <h3>No requests found</h3>
                    <p>Adjust your filters to see more results.</p>
                </div>
            ) : (
                <Card padding={false}>
                    <table className="warm-table">
                        <thead>
                            <tr>
                                <th>Service</th>
                                <th>Requester</th>
                                <th>Location</th>
                                <th>Urgency</th>
                                <th>Status</th>
                                <th style={{ textAlign: 'right' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((req, i) => (
                                <tr key={req.id || i}>
                                    <td>
                                        <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{req.service_type}</div>
                                        {req.description && (
                                            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {req.description}
                                            </div>
                                        )}
                                    </td>
                                    <td>
                                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{req.requester_name}</div>
                                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{req.requester_contact}</div>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, color: 'var(--text-muted)' }}>
                                            <MapPin size={12} style={{ color: 'var(--coral)', flexShrink: 0 }} /> {req.location}
                                        </div>
                                    </td>
                                    <td>
                                        <span style={{
                                            display: 'inline-flex', alignItems: 'center', gap: 4,
                                            padding: '3px 10px', borderRadius: 99, fontSize: 11, fontWeight: 800,
                                            background: urgencyBg(req.urgency_level),
                                            color: urgencyColor(req.urgency_level),
                                        }}>
                                            {req.urgency_level === 'HIGH' ? '🔴' : req.urgency_level === 'MEDIUM' ? '🟡' : '🟢'} {req.urgency_level}
                                        </span>
                                    </td>
                                    <td><Badge variant={req.status}>{req.status}</Badge></td>
                                    <td style={{ textAlign: 'right' }}>
                                        {req.status === 'PENDING' && (
                                            <Button variant="outline" size="sm">Assign</Button>
                                        )}
                                        {req.status === 'ASSIGNED' && (
                                            <Button variant="mint" size="sm">Complete</Button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </Card>
            )}

            {toast && (
                <div className="toast-container">
                    <div className={`toast ${toast.type}`}>{toast.msg}</div>
                </div>
            )}
        </div>
    );
}
