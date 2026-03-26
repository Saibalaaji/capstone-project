import { useState, useEffect } from 'react';
import { Search, UserPlus, X, Mail, MapPin, Shield } from 'lucide-react';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import { getUsers, adminCreateUser } from '../../services/api';

const ROLES = ['user', 'volunteer', 'admin'];

export default function AdminUsers() {
    const [users, setUsers] = useState([]);
    const [filtered, setFiltered] = useState([]);
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState('ALL');
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({ name: '', email: '', password: '', role: 'user', location: '', contactNumber: '' });
    const [errors, setErrors] = useState({});

    const showToast = (msg, type = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3500);
    };

    const reload = () => {
        setLoading(true);
        getUsers()
            .then(res => { setUsers(res.data || []); setFiltered(res.data || []); })
            .catch(() => showToast('Failed to load users', 'error'))
            .finally(() => setLoading(false));
    };

    useEffect(() => { reload(); }, []);

    useEffect(() => {
        let list = users;
        if (search) list = list.filter(u =>
            u.name?.toLowerCase().includes(search.toLowerCase()) ||
            u.email?.toLowerCase().includes(search.toLowerCase())
        );
        if (roleFilter !== 'ALL') list = list.filter(u => u.role === roleFilter);
        setFiltered(list);
    }, [search, roleFilter, users]);

    const validate = () => {
        const e = {};
        if (!form.name.trim()) e.name = 'Name is required';
        if (!form.email.trim()) e.email = 'Email is required';
        if (!form.password || form.password.length < 6) e.password = 'Password must be at least 6 characters';
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        if (!validate()) return;
        setSaving(true);
        try {
            await adminCreateUser(form);
            showToast(`User "${form.name}" created successfully`);
            setShowModal(false);
            setForm({ name: '', email: '', password: '', role: 'user', location: '', contactNumber: '' });
            setErrors({});
            reload();
        } catch (err) {
            showToast(err.response?.data?.error || 'Failed to create user', 'error');
        } finally {
            setSaving(false);
        }
    };

    const roleColor = (role) => ({ admin: 'var(--rose)', volunteer: 'var(--mint)', user: 'var(--coral)' }[role] || '#888');
    const roleBg    = (role) => ({ admin: '#FFF0F4', volunteer: '#F0FAF4', user: '#FFF5F0' }[role] || '#f5f5f5');

    return (
        <div className="animate-fadeIn">
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                <div>
                    <h1 className="page-title">Users 👥</h1>
                    <p className="page-subtitle">Manage all registered users across all roles.</p>
                </div>
                <Button variant="primary" icon={UserPlus} onClick={() => setShowModal(true)}>
                    Create User
                </Button>
            </div>

            {/* Filters */}
            <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap', alignItems: 'center' }}>
                <div style={{ position: 'relative', flex: 1, minWidth: 220 }}>
                    <Search size={15} style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input className="form-input with-icon" style={{ margin: 0 }} placeholder="Search by name or email…" value={search} onChange={e => setSearch(e.target.value)} />
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                    {['ALL', ...ROLES].map(r => (
                        <button key={r} onClick={() => setRoleFilter(r)} className={`btn btn-sm ${roleFilter === r ? 'btn-primary' : 'btn-ghost'}`}>
                            {r === 'ALL' ? 'All' : r.charAt(0).toUpperCase() + r.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            {loading ? (
                <div className="empty-state"><div className="empty-icon">🌸</div><p>Loading users…</p></div>
            ) : filtered.length === 0 ? (
                <div className="empty-state"><div className="empty-icon">👥</div><h3>No users found</h3><p>Try adjusting your search or role filter.</p></div>
            ) : (
                <Card padding={false}>
                    <table className="warm-table">
                        <thead>
                            <tr>
                                <th>User</th>
                                <th>Email</th>
                                <th>Role</th>
                                <th>Location</th>
                                <th>Verification</th>
                                <th>Joined</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((u, i) => (
                                <tr key={u.id || i}>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                            <div className="avatar avatar-sm" style={{ background: `hsl(${(i * 53 + 20)}deg 60% 70%)`, fontSize: 13, fontWeight: 800 }}>
                                                {u.name?.[0]?.toUpperCase()}
                                            </div>
                                            <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>{u.name}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, color: 'var(--text-muted)' }}>
                                            <Mail size={12} /> {u.email}
                                        </div>
                                    </td>
                                    <td>
                                        <span style={{
                                            display: 'inline-block', padding: '3px 12px', borderRadius: 99, fontSize: 11, fontWeight: 800,
                                            background: roleBg(u.role), color: roleColor(u.role)
                                        }}>
                                            {u.role?.toUpperCase()}
                                        </span>
                                    </td>
                                    <td>
                                        {u.location ? (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, color: 'var(--text-muted)' }}>
                                                <MapPin size={12} style={{ color: 'var(--coral)' }} /> {u.location}
                                            </div>
                                        ) : <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>—</span>}
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                                            <Shield size={12} style={{ color: u.verificationStatus === 'VERIFIED' ? 'var(--mint)' : 'var(--amber)' }} />
                                            <span style={{ fontSize: 12, fontWeight: 700, color: u.verificationStatus === 'VERIFIED' ? 'var(--mint-dark)' : '#996600' }}>
                                                {u.verificationStatus || 'PENDING'}
                                            </span>
                                        </div>
                                    </td>
                                    <td>
                                        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                                            {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </Card>
            )}

            {/* Create User Modal */}
            {showModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
                    <div style={{ background: 'white', borderRadius: 20, padding: 32, width: '100%', maxWidth: 460, boxShadow: '0 24px 64px rgba(0,0,0,0.2)', maxHeight: '90vh', overflowY: 'auto' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                            <h3 style={{ margin: 0, fontSize: 20, fontWeight: 800 }}>➕ Create User</h3>
                            <button onClick={() => { setShowModal(false); setErrors({}); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={20} /></button>
                        </div>
                        <form onSubmit={handleCreate}>
                            {[
                                { label: 'Full Name *', key: 'name', type: 'text', placeholder: 'Jane Doe' },
                                { label: 'Email *', key: 'email', type: 'email', placeholder: 'jane@example.com' },
                                { label: 'Password *', key: 'password', type: 'password', placeholder: 'Min. 6 characters' },
                                { label: 'Location', key: 'location', type: 'text', placeholder: 'New York' },
                                { label: 'Contact Number', key: 'contactNumber', type: 'text', placeholder: '555-0100' },
                            ].map(({ label, key, type, placeholder }) => (
                                <div key={key} style={{ marginBottom: 16 }}>
                                    <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 6, color: 'var(--text-primary)' }}>{label}</label>
                                    <input
                                        type={type}
                                        value={form[key]}
                                        onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
                                        placeholder={placeholder}
                                        className="form-input"
                                        style={{ margin: 0 }}
                                    />
                                    {errors[key] && <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--rose)' }}>{errors[key]}</p>}
                                </div>
                            ))}
                            <div style={{ marginBottom: 24 }}>
                                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 6, color: 'var(--text-primary)' }}>Role</label>
                                <select
                                    value={form.role}
                                    onChange={e => setForm(p => ({ ...p, role: e.target.value }))}
                                    style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid var(--border)', fontSize: 14 }}
                                >
                                    {ROLES.map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
                                </select>
                            </div>
                            <div style={{ display: 'flex', gap: 10 }}>
                                <Button type="button" variant="ghost" style={{ flex: 1 }} onClick={() => { setShowModal(false); setErrors({}); }}>Cancel</Button>
                                <Button type="submit" variant="primary" style={{ flex: 1 }} disabled={saving}>
                                    {saving ? 'Creating…' : '✓ Create User'}
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
