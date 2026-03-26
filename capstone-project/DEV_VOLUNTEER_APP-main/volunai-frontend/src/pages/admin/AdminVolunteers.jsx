import { useState, useEffect } from 'react';
import { Search, Mail, MapPin, Star, Briefcase, UserPlus, X } from 'lucide-react';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import { getVolunteers, adminCreateVolunteer } from '../../services/api';

const ALL_SKILLS = [
    'Medical Assistance', 'Transportation', 'Companionship', 'Food Delivery',
    'Shopping Assistance', 'Pet Care', 'Home Repair', 'Cleaning Services',
    'Childcare', 'Technical Support', 'Educational Support', 'Heavy Lifting'
];
const ALL_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday', 'Flexible', 'Weekend', 'Evening'];

export default function AdminVolunteers() {
    const [volunteers, setVolunteers] = useState([]);
    const [filtered, setFiltered] = useState([]);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({ name: '', email: '', phone: '', location: '' });
    const [formSkills, setFormSkills] = useState([]);
    const [formDays, setFormDays] = useState([]);
    const [errors, setErrors] = useState({});

    const showToast = (msg, type = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3500);
    };

    const reload = () => {
        setLoading(true);
        getVolunteers()
            .then(res => { setVolunteers(res.data || []); setFiltered(res.data || []); })
            .catch(console.error)
            .finally(() => setLoading(false));
    };

    useEffect(() => { reload(); }, []);

    useEffect(() => {
        let list = volunteers;
        if (search) list = list.filter(v => v.name?.toLowerCase().includes(search.toLowerCase()) || v.location?.toLowerCase().includes(search.toLowerCase()));
        if (statusFilter !== 'ALL') list = list.filter(v => v.availabilityStatus === statusFilter);
        setFiltered(list);
    }, [search, statusFilter, volunteers]);



    const toggleChip = (item, list, setList) => {
        setList(list.includes(item) ? list.filter(x => x !== item) : [...list, item]);
    };

    const validate = () => {
        const e = {};
        if (!form.name.trim()) e.name = 'Name is required';
        if (!form.email.trim()) e.email = 'Email is required';
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleCreate = async (ev) => {
        ev.preventDefault();
        if (!validate()) return;
        setSaving(true);
        try {
            await adminCreateVolunteer({ ...form, serviceType: formSkills, availableDays: formDays });
            showToast(`Volunteer "${form.name}" created successfully`);
            setShowModal(false);
            setForm({ name: '', email: '', phone: '', location: '' });
            setFormSkills([]);
            setFormDays([]);
            setErrors({});
            reload();
        } catch (err) {
            showToast(err.response?.data?.error || 'Failed to create volunteer', 'error');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="animate-fadeIn">
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                <div>
                    <h1 className="page-title">Volunteers 🤝</h1>
                    <p className="page-subtitle">Manage your community volunteer roster.</p>
                </div>
                <Button variant="primary" icon={UserPlus} onClick={() => setShowModal(true)}>
                    Create Volunteer
                </Button>
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


                        </div>
                    ))}
                </div>
            )}

            {/* Create Volunteer Modal */}
            {showModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
                    <div style={{ background: 'white', borderRadius: 20, padding: 32, width: '100%', maxWidth: 520, boxShadow: '0 24px 64px rgba(0,0,0,0.2)', maxHeight: '90vh', overflowY: 'auto' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                            <h3 style={{ margin: 0, fontSize: 20, fontWeight: 800 }}>➕ Create Volunteer</h3>
                            <button onClick={() => { setShowModal(false); setErrors({}); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={20} /></button>
                        </div>
                        <form onSubmit={handleCreate}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                                {[
                                    { label: 'Full Name *', key: 'name', placeholder: 'Dr. Jane Doe' },
                                    { label: 'Email *', key: 'email', placeholder: 'jane@example.com' },
                                    { label: 'Phone', key: 'phone', placeholder: '555-0100' },
                                    { label: 'Location', key: 'location', placeholder: 'New York' },
                                ].map(({ label, key, placeholder }) => (
                                    <div key={key}>
                                        <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 5, color: 'var(--text-primary)' }}>{label}</label>
                                        <input
                                            value={form[key]}
                                            onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
                                            placeholder={placeholder}
                                            className="form-input"
                                            style={{ margin: 0 }}
                                        />
                                        {errors[key] && <p style={{ margin: '3px 0 0', fontSize: 11, color: 'var(--rose)' }}>{errors[key]}</p>}
                                    </div>
                                ))}
                            </div>

                            {/* Skills */}
                            <div style={{ marginBottom: 16 }}>
                                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 8, color: 'var(--text-primary)' }}>Skills / Services</label>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                    {ALL_SKILLS.map(s => (
                                        <span
                                            key={s}
                                            onClick={() => toggleChip(s, formSkills, setFormSkills)}
                                            className={`chip ${formSkills.includes(s) ? 'active' : ''}`}
                                            style={{ fontSize: 11, padding: '4px 10px', cursor: 'pointer' }}
                                        >
                                            {s}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            {/* Available Days */}
                            <div style={{ marginBottom: 24 }}>
                                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 8, color: 'var(--text-primary)' }}>Available Days</label>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                    {ALL_DAYS.map(d => (
                                        <span
                                            key={d}
                                            onClick={() => toggleChip(d, formDays, setFormDays)}
                                            className={`chip ${formDays.includes(d) ? 'active' : ''}`}
                                            style={{ fontSize: 11, padding: '4px 10px', cursor: 'pointer' }}
                                        >
                                            {d}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: 10 }}>
                                <Button type="button" variant="ghost" style={{ flex: 1 }} onClick={() => { setShowModal(false); setErrors({}); }}>Cancel</Button>
                                <Button type="submit" variant="primary" style={{ flex: 1 }} disabled={saving}>
                                    {saving ? 'Creating…' : '✓ Create Volunteer'}
                                </Button>
                            </div>
                        </form>
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
