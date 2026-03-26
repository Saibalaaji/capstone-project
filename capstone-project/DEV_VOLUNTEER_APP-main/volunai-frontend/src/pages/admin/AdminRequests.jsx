import { useState, useEffect } from 'react';
import { Search, MapPin, UserCheck, UserX, RefreshCw, Trash2, X } from 'lucide-react';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import {
    getRequests, deleteRequest, getVolunteers,
    assignVolunteer, unassignVolunteer, reassignVolunteer
} from '../../services/api';

export default function AdminRequests() {
    const [requests, setRequests] = useState([]);
    const [filtered, setFiltered] = useState([]);
    const [volunteers, setVolunteers] = useState([]);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState(null);
    // Reassign modal state
    const [reassignModal, setReassignModal] = useState(null); // { requestId, currentVolId }
    const [reassignVolId, setReassignVolId] = useState('');

    const showToast = (msg, type = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3500);
    };

    const reload = async () => {
        try {
            const [reqRes, volRes] = await Promise.all([getRequests(), getVolunteers()]);
            setRequests(reqRes.data || []);
            setVolunteers(volRes.data || []);
        } catch (e) {
            showToast('Failed to load data', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { reload(); }, []);

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

    // Only AVAILABLE volunteers for assignment dropdowns
    const availableVols = volunteers.filter(v => v.active && v.availabilityStatus === 'AVAILABLE');

    const handleAssign = async (requestId, volunteerId) => {
        if (!volunteerId) return;
        try {
            await assignVolunteer(requestId, volunteerId);
            showToast('Volunteer assigned successfully');
            reload();
        } catch (e) {
            showToast(e.response?.data?.error || 'Failed to assign volunteer', 'error');
        }
    };

    const handleUnassign = async (requestId) => {
        if (!window.confirm('Remove the current volunteer assignment?')) return;
        try {
            await unassignVolunteer(requestId);
            showToast('Assignment removed. Request is now PENDING.');
            reload();
        } catch (e) {
            showToast(e.response?.data?.error || 'Failed to unassign volunteer', 'error');
        }
    };

    const handleReassign = async () => {
        if (!reassignVolId) return;
        try {
            await reassignVolunteer(reassignModal.requestId, reassignVolId);
            showToast('Request reassigned successfully');
            setReassignModal(null);
            setReassignVolId('');
            reload();
        } catch (e) {
            showToast(e.response?.data?.error || 'Failed to reassign', 'error');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this request permanently?')) return;
        try {
            await deleteRequest(id);
            showToast('Request deleted');
            reload();
        } catch {
            showToast('Failed to delete request', 'error');
        }
    };

    const urgencyColor = (u) => ({ HIGH: '#C05050', MEDIUM: '#B07000', LOW: '#2E7A50' }[u] || '#6B7280');
    const urgencyBg   = (u) => ({ HIGH: '#FFF0F0', MEDIUM: '#FFF8E8', LOW: '#F0FAF4' }[u] || '#F5F5F5');

    const getVolName = (id) => volunteers.find(v => v.id === id)?.name || `#${id}`;

    return (
        <div className="animate-fadeIn">
            <div className="page-header">
                <h1 className="page-title">Service Requests 📋</h1>
                <p className="page-subtitle">Review, assign, reassign, and manage all community assistance requests.</p>
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
                                <th>Assigned To</th>
                                <th style={{ textAlign: 'right' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((req, i) => (
                                <tr key={req.id || i}>
                                    <td>
                                        <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{req.service_type || req.serviceType}</div>
                                        {req.description && (
                                            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {req.description}
                                            </div>
                                        )}
                                    </td>
                                    <td>
                                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{req.requester_name || req.requesterName}</div>
                                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{req.requester_contact || req.requesterContact}</div>
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
                                            background: urgencyBg(req.urgency_level || req.urgencyLevel),
                                            color: urgencyColor(req.urgency_level || req.urgencyLevel),
                                        }}>
                                            {(req.urgency_level || req.urgencyLevel) === 'HIGH' ? '🔴' : (req.urgency_level || req.urgencyLevel) === 'MEDIUM' ? '🟡' : '🟢'} {req.urgency_level || req.urgencyLevel}
                                        </span>
                                    </td>
                                    <td><Badge variant={req.status}>{req.status}</Badge></td>
                                    <td>
                                        {(req.assignedVolunteerId || req.assigned_volunteer_id) ? (
                                            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--mint-dark)' }}>
                                                👤 {req.assigned_volunteer_name || getVolName(req.assignedVolunteerId || req.assigned_volunteer_id)}
                                            </span>
                                        ) : (
                                            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Unassigned</span>
                                        )}
                                    </td>
                                    <td style={{ textAlign: 'right' }}>
                                        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                                            {/* PENDING: assign dropdown */}
                                            {req.status === 'PENDING' && (
                                                <select
                                                    onChange={e => handleAssign(req.id, e.target.value)}
                                                    defaultValue=""
                                                    style={{ fontSize: 12, padding: '4px 8px', borderRadius: 8, border: '1px solid var(--border)', background: 'white', cursor: 'pointer' }}
                                                >
                                                    <option value="" disabled>Assign…</option>
                                                    {availableVols.map(v => (
                                                        <option key={v.id} value={v.id}>{v.name}</option>
                                                    ))}
                                                </select>
                                            )}

                                            {/* ASSIGNED: reassign + unassign */}
                                            {req.status === 'ASSIGNED' && (
                                                <>
                                                    <button
                                                        onClick={() => { setReassignModal({ requestId: req.id }); setReassignVolId(''); }}
                                                        title="Reassign to another volunteer"
                                                        style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, padding: '4px 10px', borderRadius: 8, border: '1px solid var(--coral)', color: 'var(--coral)', background: 'white', cursor: 'pointer', fontWeight: 600 }}
                                                    >
                                                        <RefreshCw size={12} /> Reassign
                                                    </button>
                                                    <button
                                                        onClick={() => handleUnassign(req.id)}
                                                        title="Remove volunteer assignment"
                                                        style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, padding: '4px 10px', borderRadius: 8, border: '1px solid #aaa', color: '#888', background: 'white', cursor: 'pointer', fontWeight: 600 }}
                                                    >
                                                        <UserX size={12} /> Unassign
                                                    </button>
                                                </>
                                            )}

                                            {/* Delete */}
                                            <button
                                                onClick={() => handleDelete(req.id)}
                                                title="Delete this request"
                                                style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, padding: '4px 8px', borderRadius: 8, border: '1px solid #fca5a5', color: '#dc2626', background: '#fff5f5', cursor: 'pointer' }}
                                            >
                                                <Trash2 size={12} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </Card>
            )}

            {/* Reassign Modal */}
            {reassignModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ background: 'white', borderRadius: 16, padding: 28, width: 380, boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>Reassign Volunteer</h3>
                            <button onClick={() => setReassignModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={18} /></button>
                        </div>
                        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>Select an <strong>AVAILABLE</strong> volunteer to reassign this request to.</p>
                        <select
                            value={reassignVolId}
                            onChange={e => setReassignVolId(e.target.value)}
                            style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid var(--border)', fontSize: 14, marginBottom: 20 }}
                        >
                            <option value="">Choose volunteer…</option>
                            {availableVols.map(v => (
                                <option key={v.id} value={v.id}>{v.name} — {v.location}</option>
                            ))}
                        </select>
                        <div style={{ display: 'flex', gap: 10 }}>
                            <Button variant="ghost" style={{ flex: 1 }} onClick={() => setReassignModal(null)}>Cancel</Button>
                            <Button variant="primary" style={{ flex: 1 }} onClick={handleReassign} disabled={!reassignVolId}>
                                <UserCheck size={14} /> Reassign
                            </Button>
                        </div>
                    </div>
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
