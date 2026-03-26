import { useState, useEffect } from 'react';
import { getPendingVerifications, verifyUser } from '../../services/api';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import { ShieldCheck, CircleX, CircleCheck, User, Mail, MapPin, Eye, Search, Brain, List, Database } from 'lucide-react';
import AdminVerificationTable from './AdminVerificationTable';

export default function AdminVerification() {
    const [pendingUsers, setPendingUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [viewMode, setViewMode] = useState('queue'); // 'queue' | 'database'
    const [actionLoading, setActionLoading] = useState(null);
    const [selectedImage, setSelectedImage] = useState(null);
    const [rejectModalOpen, setRejectModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [rejectionReason, setRejectionReason] = useState('');

    const loadPending = async () => {
        setLoading(true);
        try {
            const res = await getPendingVerifications();
            setPendingUsers(res.data);
        } catch (err) {
            console.error('Failed to load pending verifications', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadPending();
    }, []);

    const handleApprove = async (userId) => {
        setActionLoading(userId);
        try {
            await verifyUser(userId, 'VERIFIED');
            setPendingUsers(prev => prev.filter(u => u.id !== userId));
        } catch (err) {
            console.error('Failed to approve user', err);
            alert('Failed to approve user. Please try again.');
        } finally {
            setActionLoading(null);
        }
    };

    const handleReject = async () => {
        if (!selectedUser) return;
        setActionLoading(selectedUser.id);
        try {
            await verifyUser(selectedUser.id, 'REJECTED', rejectionReason);
            setPendingUsers(prev => prev.filter(u => u.id !== selectedUser.id));
            setRejectModalOpen(false);
            setRejectionReason('');
            setSelectedUser(null);
        } catch (err) {
            console.error('Failed to reject user', err);
            alert('Failed to reject user. Please try again.');
        } finally {
            setActionLoading(null);
        }
    };

    const openRejectModal = (user) => {
        setSelectedUser(user);
        setRejectModalOpen(true);
    };

    const filteredUsers = pendingUsers.filter(u => 
        u.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
        u.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (viewMode === 'database') {
        return (
            <div className="animate-fadeIn">
                <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
                    <div>
                        <h1 className="page-title">Identity Verification 🛡️</h1>
                        <p className="page-subtitle">Review and approve government IDs for new community members and volunteers.</p>
                    </div>
                    <div style={{ display: 'flex', gap: 4, background: '#f1f5f9', padding: '4px', borderRadius: 12 }}>
                        <button onClick={() => setViewMode('queue')} className={`btn btn-sm btn-ghost`} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <List size={16} /> Review Queue
                        </button>
                        <button onClick={() => setViewMode('database')} className={`btn btn-sm btn-primary`} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <Database size={16} /> Data Table
                        </button>
                    </div>
                </div>
                <AdminVerificationTable />
            </div>
        );
    }

    return (
        <div className="animate-fadeIn">
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
                <div>
                    <h1 className="page-title">Identity Verification 🛡️</h1>
                    <p className="page-subtitle">Review and approve government IDs for new community members and volunteers.</p>
                </div>
                <div style={{ display: 'flex', gap: 4, background: '#f1f5f9', padding: '4px', borderRadius: 12 }}>
                    <button onClick={() => setViewMode('queue')} className={`btn btn-sm btn-primary`} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <List size={16} /> Review Queue
                    </button>
                    <button onClick={() => setViewMode('database')} className={`btn btn-sm btn-ghost`} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Database size={16} /> Data Table
                    </button>
                </div>
            </div>

            <Card style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <div style={{ position: 'relative', flex: 1 }}>
                        <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                        <input
                            type="text"
                            placeholder="Search by name or email…"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="form-input"
                            style={{ paddingLeft: 40, width: '100%', maxWidth: 400 }}
                        />
                    </div>
                    <Badge variant="info">
                        {pendingUsers.length} Pending
                    </Badge>
                </div>
            </Card>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '60px 0' }}>
                    <div className="animate-spin" style={{ fontSize: 32, marginBottom: 16 }}>⚙️</div>
                    <p style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Loading pending verifications…</p>
                </div>
            ) : filteredUsers.length === 0 ? (
                <Card style={{ textAlign: 'center', padding: '60px 0' }}>
                    <div style={{ fontSize: 48, marginBottom: 16 }}>✨</div>
                    <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 8 }}>All Caught Up!</h3>
                    <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>There are no users waiting for verification right now.</p>
                </Card>
            ) : (
                <div style={{ display: 'grid', gap: '16px' }}>
                    {filteredUsers.map(user => (
                        <Card key={user.id} style={{ padding: '0', overflow: 'hidden' }}>
                            <div style={{ display: 'flex', flexWrap: 'wrap' }}>
                                {/* User Info Side */}
                                <div style={{ flex: '1 1 300px', padding: '24px', borderRight: '1px solid var(--border)' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
                                        <div className="avatar avatar-lg" style={{ background: user.role === 'volunteer' ? 'var(--coral-light)' : 'var(--mint-light)', color: user.role === 'volunteer' ? 'var(--coral-dark)' : 'var(--mint-dark)' }}>
                                            {user.name?.[0]?.toUpperCase()}
                                        </div>
                                        <div>
                                            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: 'var(--text-primary)' }}>{user.name}</h3>
                                            <Badge variant={user.role === 'volunteer' ? 'draft' : 'info'} style={{ marginTop: 4 }}>
                                                {user.role === 'volunteer' ? 'Volunteer' : 'Community Member'}
                                            </Badge>
                                        </div>
                                    </div>
                                    
                                    <div style={{ display: 'grid', gap: 12 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: 'var(--text-secondary)' }}>
                                            <Mail size={16} color="var(--text-muted)" /> {user.email}
                                        </div>
                                        {user.location && (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: 'var(--text-secondary)' }}>
                                                <MapPin size={16} color="var(--text-muted)" /> {user.location}
                                            </div>
                                        )}
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: 'var(--text-secondary)' }}>
                                            <User size={16} color="var(--text-muted)" /> Joined {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                                        </div>
                                    </div>
                                </div>

                                {/* ID Proof & Action Side */}
                                <div style={{ flex: '1 1 400px', padding: '24px', background: '#FAFAFA', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                                    <div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                                            <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>Government ID Proof</h4>
                                            {/* AI Score Badge */}
                                            {user.ai_confidence != null && (
                                                <div style={{
                                                    display: 'flex', alignItems: 'center', gap: 6,
                                                    padding: '4px 10px', borderRadius: 99,
                                                    background: user.ai_confidence >= 0.75 ? '#D1FAE5' : user.ai_confidence >= 0.45 ? '#FEF3C7' : '#FEE2E2',
                                                    fontSize: 12, fontWeight: 700,
                                                    color: user.ai_confidence >= 0.75 ? '#065F46' : user.ai_confidence >= 0.45 ? '#92400E' : '#991B1B',
                                                }}>
                                                    <Brain size={12} />
                                                    {user.ai_doc_type
                                                        ? `${user.ai_doc_type.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}`
                                                        : 'Unknown Doc'}
                                                    &nbsp;·&nbsp;{Math.round(user.ai_confidence * 100)}%
                                                </div>
                                            )}
                                        </div>
                                        {user.id_proof_url ? (
                                            <div 
                                                style={{ 
                                                    height: 140, 
                                                    background: '#EAEAEA', 
                                                    borderRadius: 'var(--radius-md)', 
                                                    overflow: 'hidden',
                                                    position: 'relative',
                                                    cursor: 'pointer',
                                                    border: '1px solid var(--border)'
                                                }}
                                                onClick={() => setSelectedImage(`/api${user.id_proof_url}`)}
                                            >
                                                {user.id_proof_url.endsWith('.pdf') ? (
                                                    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                                                        <div style={{ fontSize: 32, marginBottom: 8 }}>📄</div>
                                                        <span style={{ fontSize: 12, fontWeight: 600 }}>PDF Document (Click to View)</span>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <img 
                                                            src={`/api${user.id_proof_url}`} 
                                                            alt="ID Proof" 
                                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                                                            onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                                                        />
                                                        <div style={{ display: 'none', height: '100%', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                                                            <div style={{ fontSize: 32, marginBottom: 8 }}>⚠️</div>
                                                            <span style={{ fontSize: 12, fontWeight: 600 }}>Image not found</span>
                                                        </div>
                                                        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: '0.2s' }} className="hover-glass">
                                                            <Eye size={32} color="white" />
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        ) : (
                                            <div style={{ padding: '20px', background: '#FFF1F1', border: '1px dashed #FFCECE', borderRadius: 'var(--radius-md)', color: '#C05050', fontSize: 13, textAlign: 'center' }}>
                                                No ID proof uploaded.
                                            </div>
                                        )}
                                    </div>

                                    <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                                        <Button 
                                            variant="outline" 
                                            onClick={() => openRejectModal(user)}
                                            disabled={actionLoading === user.id}
                                            style={{ flex: 1, justifyContent: 'center', borderColor: 'var(--rose)', color: 'var(--rose)' }}
                                            icon={CircleX}
                                        >
                                            Reject
                                        </Button>
                                        <Button 
                                            variant="primary" 
                                            onClick={() => handleApprove(user.id)}
                                            loading={actionLoading === user.id}
                                            style={{ flex: 1, justifyContent: 'center', background: 'var(--mint)', borderColor: 'var(--mint)' }}
                                            icon={CircleCheck}
                                        >
                                            Approve
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            {/* Image Modal */}
            {selectedImage && (
                <div 
                    style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px' }}
                    onClick={() => setSelectedImage(null)}
                >
                    <div style={{ position: 'relative', maxWidth: '100%', maxHeight: '100%' }} onClick={e => e.stopPropagation()}>
                        <button 
                            onClick={() => setSelectedImage(null)}
                            style={{ position: 'absolute', top: -40, right: 0, background: 'none', border: 'none', color: 'white', fontSize: 16, cursor: 'pointer', fontWeight: 700 }}
                        >
                            Close ✕
                        </button>
                        {selectedImage.endsWith('.pdf') ? (
                            <iframe src={selectedImage} title="ID Proof" style={{ width: '80vw', height: '80vh', border: 'none', background: 'white', borderRadius: '8px' }} />
                        ) : (
                            <img src={selectedImage} alt="ID Proof Full" style={{ maxWidth: '100%', maxHeight: '80vh', objectFit: 'contain', borderRadius: '8px', boxShadow: '0 10px 40px rgba(0,0,0,0.3)' }} />
                        )}
                    </div>
                </div>
            )}

            {/* Reject Modal */}
            {rejectModalOpen && selectedUser && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                    <div style={{ background: 'white', borderRadius: 'var(--radius-xl)', padding: '32px', width: '100%', maxWidth: '440px', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
                        <h3 style={{ fontSize: 20, fontWeight: 800, marginBottom: 8, color: 'var(--text-primary)' }}>Reject Verification</h3>
                        <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 24 }}>
                            Provide a reason for rejecting <strong style={{color: 'var(--text-primary)'}}>{selectedUser.name}</strong>'s ID proof. They will be notified to upload a new one.
                        </p>
                        
                        <label className="form-label" style={{ marginBottom: 6, display: 'block' }}>Rejection Reason (Optional)</label>
                        <textarea 
                            className="form-input" 
                            rows={3} 
                            placeholder="e.g. ID is blurry, expired, or doesn't match name..."
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                            style={{ marginBottom: 24 }}
                        />

                        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                            <Button variant="ghost" onClick={() => setRejectModalOpen(false)}>Cancel</Button>
                            <Button 
                                variant="primary" 
                                onClick={handleReject} 
                                loading={actionLoading === selectedUser.id}
                                style={{ background: 'var(--rose)', borderColor: 'var(--rose)' }}
                            >
                                Confirm Rejection
                            </Button>
                        </div>
                    </div>
                </div>
            )}
            
            <style jsx>{`
                .hover-glass:hover { opacity: 1 !important; }
            `}</style>
        </div>
    );
}
