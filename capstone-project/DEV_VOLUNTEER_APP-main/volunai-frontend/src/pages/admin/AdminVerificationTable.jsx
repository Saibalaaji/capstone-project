import { useState, useEffect } from 'react';
import { getAllVerifications, updateVerificationFields, softDeleteUser, wipeDatabaseData } from '../../services/api';
import { Search, Edit2, Trash2, X, AlertTriangle, FileText, Check } from 'lucide-react';

export default function AdminVerificationTable() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [toast, setToast] = useState(null);
    
    // Edit Modal state
    const [editModal, setEditModal] = useState({ open: false, user: null });
    const [editForm, setEditForm] = useState({ verification_status: '', ai_doc_type: '', id_proof_url: '' });
    
    // Wipe Database states
    const [wipeModalOpen, setWipeModalOpen] = useState(false);
    const [confirmText, setConfirmText] = useState('');

    const showToast = (msg, type = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3500);
    };

    const loadData = async () => {
        setLoading(true);
        try {
            const res = await getAllVerifications();
            setUsers(res.data);
        } catch (err) {
            showToast('Failed to load database records', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadData(); }, []);

    // ── Table Actions ──
    const handleUpdate = async (e) => {
        e.preventDefault();
        try {
            await updateVerificationFields(editModal.user.id, editForm);
            showToast('User record updated safely');
            setEditModal({ open: false, user: null });
            loadData();
        } catch (err) {
            showToast(err.response?.data?.error || 'Update failed', 'error');
        }
    };

    const handleDelete = async (id, name) => {
        if (!window.confirm(`Are you sure you want to soft delete the user ${name}?\n\nThis will maintain their records for compliance but remove them from all active queues.`)) return;
        try {
            await softDeleteUser(id);
            showToast(`User ${name} soft deleted.`);
            setUsers(users.filter(u => u.id !== id));
        } catch (err) {
            showToast(err.response?.data?.error || 'Delete failed', 'error');
        }
    };

    const handleWipe = async () => {
        if (confirmText !== 'CONFIRM') return;
        try {
            await wipeDatabaseData();
            showToast('Database wiped successfully. S3/Local files deleted.', 'success');
            setWipeModalOpen(false);
            setConfirmText('');
            loadData();
        } catch (err) {
            showToast(err.response?.data?.error || 'Wipe failed', 'error');
        }
    };

    const filtered = users.filter(u => 
        u.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
        u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(u.id).includes(searchTerm)
    );

    return (
        <div style={{ animation: 'fadeIn 0.4s ease-out' }}>
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: 24 }}>
                <div style={{ position: 'relative', flex: 1, maxWidth: 400 }}>
                    <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input
                        type="text"
                        placeholder="Search by ID, Name or Email…"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="form-input"
                        style={{ paddingLeft: 40, width: '100%', margin: 0 }}
                    />
                </div>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '60px 0' }}>
                    <div className="animate-spin" style={{ fontSize: 32, marginBottom: 16 }}>⚙️</div>
                </div>
            ) : filtered.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 0', background: '#fff', borderRadius: 16 }}>
                    <div style={{ fontSize: 48, marginBottom: 16 }}>📭</div>
                    <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)' }}>No records found</h3>
                </div>
            ) : (
                <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', marginBottom: 40 }}>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead>
                                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                                    <th style={{ padding: '16px', fontSize: '13px', color: '#64748b' }}>ID</th>
                                    <th style={{ padding: '16px', fontSize: '13px', color: '#64748b' }}>User Details</th>
                                    <th style={{ padding: '16px', fontSize: '13px', color: '#64748b' }}>Document Link</th>
                                    <th style={{ padding: '16px', fontSize: '13px', color: '#64748b' }}>AI Status</th>
                                    <th style={{ padding: '16px', fontSize: '13px', color: '#64748b' }}>Admin Status</th>
                                    <th style={{ padding: '16px', fontSize: '13px', color: '#64748b', textAlign: 'right' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((u, i) => (
                                    <tr key={u.id} style={{ borderBottom: i === filtered.length - 1 ? 'none' : '1px solid #f1f5f9' }}>
                                        <td style={{ padding: '16px', fontSize: '14px', fontWeight: 700, color: '#94a3b8' }}>#{u.id}</td>
                                        <td style={{ padding: '16px' }}>
                                            <div style={{ fontWeight: 700, color: '#334155', fontSize: 14 }}>{u.name}</div>
                                            <div style={{ color: '#94a3b8', fontSize: 13 }}>{u.email}</div>
                                        </td>
                                        <td style={{ padding: '16px' }}>
                                            {u.idProofUrl ? (
                                                <a href={u.idProofUrl} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#4f46e5', background: '#e0e7ff', padding: '4px 10px', borderRadius: 99, textDecoration: 'none', fontWeight: 600 }}>
                                                    <FileText size={14} /> View Document
                                                </a>
                                            ) : <span style={{ color: '#cbd5e1', fontSize: 13, fontStyle: 'italic' }}>None</span>}
                                        </td>
                                        <td style={{ padding: '16px' }}>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                                <span style={{ fontSize: 13, fontWeight: 700, color: '#475569' }}>{u.ai_doc_type || 'Unknown'}</span>
                                                {u.ai_confidence && <span style={{ fontSize: 12, color: '#94a3b8' }}>{Math.round(u.ai_confidence * 100)}% Conf.</span>}
                                            </div>
                                        </td>
                                        <td style={{ padding: '16px' }}>
                                            <span style={{
                                                fontSize: 12, fontWeight: 800, padding: '4px 10px', borderRadius: 6,
                                                background: u.verificationStatus === 'VERIFIED' ? '#dcfce7' : u.verificationStatus === 'REJECTED' ? '#fee2e2' : '#fef9c3',
                                                color: u.verificationStatus === 'VERIFIED' ? '#16a34a' : u.verificationStatus === 'REJECTED' ? '#dc2626' : '#ca8a04'
                                            }}>
                                                {u.verificationStatus || 'PENDING'}
                                            </span>
                                        </td>
                                        <td style={{ padding: '16px', textAlign: 'right' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8 }}>
                                                <button onClick={() => {
                                                    setEditModal({ open: true, user: u });
                                                    setEditForm({ verification_status: u.verificationStatus, ai_doc_type: u.ai_doc_type || '', id_proof_url: u.idProofUrl || '' });
                                                }} className="btn btn-sm btn-ghost" style={{ padding: '6px', color: '#64748b' }}>
                                                    <Edit2 size={16} />
                                                </button>
                                                <button onClick={() => handleDelete(u.id, u.name)} className="btn btn-sm btn-ghost" style={{ padding: '6px', color: '#ef4444' }}>
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* ── Danger Zone ── */}
            <div style={{ border: '2px solid #fee2e2', borderRadius: 16, overflow: 'hidden' }}>
                <div style={{ background: '#fef2f2', padding: '20px 24px', borderBottom: '1px solid #fee2e2', display: 'flex', alignItems: 'center', gap: 12 }}>
                    <AlertTriangle size={24} color="#ef4444" />
                    <div>
                        <h3 style={{ margin: 0, color: '#991b1b', fontSize: 16, fontWeight: 800 }}>Danger Zone</h3>
                        <p style={{ margin: 0, color: '#b91c1c', fontSize: 13, marginTop: 4 }}>Destructive actions that cannot be easily undone.</p>
                    </div>
                </div>
                <div style={{ background: '#fff', padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h4 style={{ margin: 0, color: '#0f172a', fontWeight: 700, fontSize: 15 }}>Wipe Database & Documents</h4>
                        <p style={{ margin: 0, color: '#64748b', fontSize: 13, marginTop: 4 }}>Permanently deletes all non-admin user records and clears the S3/local file storage.</p>
                    </div>
                    <button onClick={() => setWipeModalOpen(true)} style={{ background: '#ef4444', color: '#fff', padding: '10px 20px', borderRadius: 8, fontSize: 14, fontWeight: 700, border: 'none', cursor: 'pointer', boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)' }}>
                        Delete All Records
                    </button>
                </div>
            </div>

            {/* ── Edit Modal ── */}
            {editModal.open && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ background: '#fff', width: '100%', maxWidth: 400, borderRadius: 20, padding: 32, boxShadow: '0 24px 64px rgba(0,0,0,0.2)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>Edit Record #{editModal.user.id}</h3>
                            <button onClick={() => setEditModal({ open: false, user: null })} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} color="#94a3b8" /></button>
                        </div>
                        <form onSubmit={handleUpdate}>
                            <div style={{ marginBottom: 16 }}>
                                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 8 }}>Admin Status</label>
                                <select className="form-input" style={{ margin: 0, width: '100%' }} value={editForm.verification_status} onChange={e => setEditForm({...editForm, verification_status: e.target.value})}>
                                    <option value="PENDING">PENDING</option>
                                    <option value="VERIFIED">VERIFIED</option>
                                    <option value="REJECTED">REJECTED</option>
                                </select>
                            </div>
                            <div style={{ marginBottom: 16 }}>
                                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 8 }}>AI Doc Type</label>
                                <input className="form-input" style={{ margin: 0, width: '100%' }} value={editForm.ai_doc_type} onChange={e => setEditForm({...editForm, ai_doc_type: e.target.value})} placeholder="e.g. aadhar" />
                            </div>
                            <div style={{ marginBottom: 24 }}>
                                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 8 }}>Document URL</label>
                                <input className="form-input" style={{ margin: 0, width: '100%' }} value={editForm.id_proof_url} onChange={e => setEditForm({...editForm, id_proof_url: e.target.value})} placeholder="Clear this field to remove image link" />
                            </div>
                            <button type="submit" style={{ width: '100%', padding: '12px', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}>
                                Save Changes
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* ── Confirm Wipe Modal ── */}
            {wipeModalOpen && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ background: '#fff', width: '100%', maxWidth: 440, borderRadius: 24, padding: 32, textAlign: 'center' }}>
                        <div style={{ width: 64, height: 64, background: '#fee2e2', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                            <AlertTriangle size={32} color="#dc2626" />
                        </div>
                        <h2 style={{ margin: '0 0 12px', fontSize: 22, fontWeight: 800, color: '#0f172a' }}>Are you absolutely sure?</h2>
                        <p style={{ margin: '0 0 24px', fontSize: 14, color: '#64748b', lineHeight: 1.5 }}>
                            This action cannot be undone. This will permanently delete <strong>all non-admin user records</strong> and physically wipe their uploaded documents from the server.
                        </p>
                        <div style={{ background: '#f8fafc', padding: '16px', borderRadius: 12, marginBottom: 24 }}>
                            <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 8 }}>
                                Type <strong style={{color: '#dc2626'}}>CONFIRM</strong> to proceed
                            </label>
                            <input
                                autoFocus
                                type="text"
                                value={confirmText}
                                onChange={e => setConfirmText(e.target.value)}
                                style={{ width: '100%', padding: '10px', textAlign: 'center', fontSize: 16, fontWeight: 800, border: '2px solid #e2e8f0', borderRadius: 8, outline: 'none' }}
                            />
                        </div>
                        <div style={{ display: 'flex', gap: 12 }}>
                            <button onClick={() => {setWipeModalOpen(false); setConfirmText('');}} style={{ flex: 1, padding: '12px', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: 10, fontWeight: 700, cursor: 'pointer' }}>
                                Cancel
                            </button>
                            <button onClick={handleWipe} disabled={confirmText !== 'CONFIRM'} style={{ flex: 1, padding: '12px', background: confirmText === 'CONFIRM' ? '#dc2626' : '#fca5a5', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 700, cursor: confirmText === 'CONFIRM' ? 'pointer' : 'not-allowed', transition: '0.2s' }}>
                                Delete All Data
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {toast && (
                <div className="toast-container">
                    <div className={`toast ${toast.type}`}>
                        {toast.type === 'success' ? <Check size={16} /> : <AlertTriangle size={16} />}
                        {toast.msg}
                    </div>
                </div>
            )}
        </div>
    );
}
