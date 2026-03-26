import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, User, Clock, TrendingUp, ToggleRight, ToggleLeft, ShieldAlert, CircleCheck } from 'lucide-react';
import {
    getVolunteerByEmail, getVolunteerById, getVolunteerRequests,
    acceptRequest, declineRequest, completeRequestByVolunteer,
    toggleVolunteerAvailability, updateVolunteer
} from '../services/api';
import { useAuth } from '../context/AuthContext';

import AppLayout from '../components/layout/AppLayout';
import VolunteerTasks from './volunteer/VolunteerTasks';
import VolunteerProfile from './volunteer/VolunteerProfile';
import VolunteerHistory from './volunteer/VolunteerHistory';
import VolunteerAnalytics from './volunteer/VolunteerAnalytics';
import Card from '../components/common/Card';
import Badge from '../components/common/Badge';

const TABS = [
    { id: 'tasks', label: 'Tasks', icon: Bell },
    { id: 'profile', label: 'My Profile', icon: User },
    { id: 'history', label: 'History', icon: Clock },
    { id: 'performance', label: 'Analytics', icon: TrendingUp },
];

export default function VolunteerDashboard() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('tasks');
    const [toast, setToast] = useState(null);
    const [loading, setLoading] = useState(true);
    const [volunteer, setVolunteer] = useState(null);
    const [notifications, setNotifications] = useState([]);
    const [taskHistory, setTaskHistory] = useState([]);
    const [isEditing, setIsEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [editForm, setEditForm] = useState({});
    const [editSkills, setEditSkills] = useState([]);
    const [editDays, setEditDays] = useState([]);

    const showToast = (msg, type = 'info') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 4000);
    };

    const refreshRequests = useCallback(async (volId) => {
        try {
            const requestsRes = await getVolunteerRequests(volId);
            const all = requestsRes.data;
            setNotifications(all.filter(r => (r.status === 'PENDING' && !r.assigned_volunteer_id) || (r.is_assigned_to_me && r.status === 'ASSIGNED')));
            setTaskHistory(all.filter(r => r.status === 'COMPLETED' || (r.assigned_volunteer_id && !r.is_assigned_to_me)));
        } catch (err) {
            console.error('Request sync failed', err);
        }
    }, []);

    useEffect(() => {
        if (!user) { navigate('/login'); return; }

        const fetchProfile = async () => {
            try {
                const volRes = await getVolunteerByEmail(user.email);
                const vol = volRes.data;
                setVolunteer(vol);
                setEditForm({ name: vol.name, email: vol.email, phone: vol.phone || '', location: vol.location || '' });
                setEditSkills(vol.serviceType || []);
                setEditDays(vol.availableDays || []);
                await refreshRequests(vol.id);
            } catch (err) {
                console.error('Profile fetch failed', err);
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
        const interval = setInterval(() => {
            if (volunteer?.id) refreshRequests(volunteer.id);
        }, 15000);
        return () => clearInterval(interval);
    }, [user, navigate, refreshRequests]);

    const handleAcceptTask = async (requestId) => {
        try {
            await acceptRequest(requestId, volunteer.id);
            showToast('Task accepted! You are now assigned.', 'success');
            await refreshRequests(volunteer.id);
        } catch { showToast('Failed to accept task', 'error'); }
    };

    const handleDeclineTask = async (requestId) => {
        try {
            await declineRequest(requestId, volunteer.id);
            showToast('Task declined', 'info');
            await refreshRequests(volunteer.id);
        } catch { showToast('Failed to decline task', 'error'); }
    };

    const handleCompleteTask = async (requestId) => {
        try {
            await completeRequestByVolunteer(requestId, volunteer.id);
            showToast('Task completed! Great work!', 'success');
            const volRes = await getVolunteerById(volunteer.id);
            setVolunteer(volRes.data);
            await refreshRequests(volunteer.id);
        } catch { showToast('Failed to complete task', 'error'); }
    };

    const handleToggleAvailability = async () => {
        const newStatus = volunteer.availabilityStatus === 'AVAILABLE' ? 'BUSY' : 'AVAILABLE';
        try {
            await toggleVolunteerAvailability(volunteer.id, newStatus);
            setVolunteer({ ...volunteer, availabilityStatus: newStatus });
            showToast(`Status updated to ${newStatus}`, 'success');
        } catch { showToast('Failed to update status', 'error'); }
    };

    const handleSaveProfile = async () => {
        setSaving(true);
        try {
            const res = await updateVolunteer(volunteer.id, {
                ...editForm,
                serviceType: editSkills,
                availableDays: editDays,
            });
            setVolunteer(res.data);
            setIsEditing(false);
            showToast('Profile updated successfully!', 'success');
        } catch { showToast('Failed to save profile', 'error'); }
        finally { setSaving(false); }
    };

    if (loading) {
        return (
            <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-page)' }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 48, marginBottom: 12 }}>🌿</div>
                    <p style={{ color: 'var(--text-muted)', fontWeight: 700, fontSize: 14 }}>Loading your profile…</p>
                </div>
            </div>
        );
    }

    if (!volunteer && !loading) {
        return (
            <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-page)' }}>
                <div style={{ textAlign: 'center' }}>
                    <ShieldAlert size={48} color="var(--rose)" style={{ marginBottom: 16 }} />
                    <h2 style={{ margin: '0 0 12px', color: 'var(--text-main)', fontSize: 24 }}>Profile Not Found</h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: 16, maxWidth: 400, lineHeight: 1.5, margin: '0 auto 24px' }}>
                        We couldn't find a volunteer profile associated with your email. Your account might have been disabled or deleted.
                    </p>
                    <button 
                        onClick={logout}
                        style={{ background: 'var(--primary)', color: 'white', border: 'none', padding: '10px 24px', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontWeight: 600 }}
                    >
                        Return to Login
                    </button>
                </div>
            </div>
        );
    }

    const sidebarItems = [
        ...TABS.map(tab => ({
            id: tab.id,
            label: tab.label,
            icon: tab.icon,
            onClick: () => setActiveTab(tab.id)
        })),
        {
            id: 'availability',
            label: volunteer?.availabilityStatus === 'AVAILABLE' ? 'Set Busy' : 'Set Available',
            icon: volunteer?.availabilityStatus === 'AVAILABLE' ? ToggleRight : ToggleLeft,
            onClick: handleToggleAvailability,
            className: volunteer?.availabilityStatus === 'AVAILABLE' ? 'text-emerald-400' : 'text-amber-400'
        }
    ];

    const renderContent = () => {
        switch (activeTab) {
            case 'tasks':
                return (
                    <VolunteerTasks 
                        tasks={notifications} 
                        onAccept={handleAcceptTask} 
                        onDecline={handleDeclineTask} 
                        onComplete={handleCompleteTask}
                        completedCount={volunteer?.completedTasks || 0}
                    />
                );
            case 'profile':
                return (
                    <VolunteerProfile 
                        volunteer={volunteer}
                        isEditing={isEditing}
                        setIsEditing={setIsEditing}
                        editForm={editForm}
                        setEditForm={setEditForm}
                        editSkills={editSkills}
                        setEditSkills={setEditSkills}
                        editDays={editDays}
                        setEditDays={setEditDays}
                        onSave={handleSaveProfile}
                        saving={saving}
                    />
                );
            case 'history':
                return <VolunteerHistory history={taskHistory} />;
            case 'performance':
                return (
                    <VolunteerAnalytics 
                        volunteer={volunteer} 
                        taskHistory={taskHistory}
                        stats={{
                            completed: volunteer?.completedTasks || 0,
                            active: notifications.filter(n => n.is_assigned_to_me).length,
                            pending: notifications.filter(n => !n.is_assigned_to_me).length
                        }}
                    />
                );
            default:
                return null;
        }
    };

    return (
        <AppLayout
            sidebarItems={sidebarItems}
            activeTab={activeTab}
            user={user}
        >
            {volunteer?.verification_status === 'PENDING' && (
                <div style={{ background: '#FFFDF0', border: '1px solid #FFE080', padding: '12px 20px', borderRadius: 'var(--radius-md)', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12 }}>
                    <ShieldAlert size={20} color="var(--amber)" />
                    <div style={{ flex: 1 }}>
                        <h4 style={{ margin: '0 0 4px', fontSize: 14, color: '#996600' }}>Verification Pending</h4>
                        <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)' }}>Your government ID is currently under review by an administrator. Some features may be limited until approved.</p>
                    </div>
                </div>
            )}
            
            {volunteer?.verification_status === 'REJECTED' && (
                <div style={{ background: '#FFF0F0', border: '1px solid #FFCECE', padding: '12px 20px', borderRadius: 'var(--radius-md)', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12 }}>
                    <ShieldAlert size={20} color="var(--rose)" />
                    <div style={{ flex: 1 }}>
                        <h4 style={{ margin: '0 0 4px', fontSize: 14, color: '#C05050' }}>Verification Rejected</h4>
                        <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)' }}>
                            {volunteer.rejection_reason ? `Reason: ${volunteer.rejection_reason}` : "Your ID could not be verified. Please contact support."}
                        </p>
                    </div>
                </div>
            )}

            {volunteer?.verification_status === 'VERIFIED' && (
                <div style={{ background: '#F0FAF4', border: '1px solid #B0DCC0', padding: '12px 20px', borderRadius: 'var(--radius-md)', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12 }}>
                    <CircleCheck size={20} color="var(--mint)" />
                    <div style={{ flex: 1 }}>
                        <h4 style={{ margin: 0, fontSize: 14, color: '#2E7A50' }}>Verified Volunteer</h4>
                    </div>
                </div>
            )}

            {renderContent()}

            {toast && (
                <div className="toast-container">
                    <div className={`toast ${toast.type}`}>
                        {toast.type === 'success' ? '✅' : toast.type === 'error' ? '⚠️' : 'ℹ️'}
                        {' '}{toast.msg}
                    </div>
                </div>
            )}
        </AppLayout>
    );
}
