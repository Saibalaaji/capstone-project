import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlusCircle, ClipboardList } from 'lucide-react';
import { createRequest, getRequestsByContact } from '../services/api';
import { useAuth } from '../context/AuthContext';
import AppLayout from '../components/layout/AppLayout';
import CommunityNewRequest from './community/CommunityNewRequest';
import CommunityMyRequests from './community/CommunityMyRequests';

const TABS = [
    { id: 'new', label: 'New Request', icon: PlusCircle },
    { id: 'my',  label: 'My Requests', icon: ClipboardList },
];

const EMPTY_FORM = {
    requesterName: '',
    requesterContact: '',
    location: '',
    serviceType: '',
    description: '',
    urgencyLevel: 'MEDIUM',
};

export default function UserDashboard() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('new');
    const [form, setForm] = useState(EMPTY_FORM);
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(null);
    const [myRequests, setMyRequests] = useState([]);
    const [loadingRequests, setLoadingRequests] = useState(false);
    const [toast, setToast] = useState(null);

    const showToast = (msg, type = 'info') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 4000);
    };

    // Pre-fill contact info from auth user
    useEffect(() => {
        if (user) {
            setForm(f => ({
                ...f,
                requesterName: user.name || '',
                requesterContact: user.contactNumber || '',
                location: user.location || '',
            }));
        } else {
            navigate('/login');
        }
    }, [user, navigate]);

    const fetchMyRequests = useCallback(async () => {
        if (!user) return;
        setLoadingRequests(true);
        try {
            const contact = user.contactNumber || form.requesterContact || '';
            if (contact) {
                const res = await getRequestsByContact(contact);
                setMyRequests(res.data);
            } else {
                setMyRequests([]);
            }
        } catch (err) {
            console.error('Failed to fetch requests:', err);
            setMyRequests([]);
        } finally {
            setLoadingRequests(false);
        }
    }, [user, form.requesterContact]);

    useEffect(() => {
        if (activeTab === 'my') fetchMyRequests();
    }, [activeTab, fetchMyRequests]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.requesterName || !form.requesterContact || !form.location || !form.serviceType) {
            showToast('Please fill in all required fields', 'error');
            return;
        }
        setSubmitting(true);
        try {
            const res = await createRequest(form);
            setSubmitted(res.data.request);
            setForm(f => ({ ...EMPTY_FORM, requesterName: f.requesterName, requesterContact: f.requesterContact, location: f.location }));
            showToast('Request submitted! Our AI is finding the best volunteer.', 'success');
        } catch (err) {
            showToast('Failed to submit request: ' + (err.response?.data?.error || err.message), 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const sidebarItems = TABS.map(tab => ({
        id: tab.id,
        label: tab.label,
        icon: tab.icon,
        onClick: () => setActiveTab(tab.id),
    }));

    const renderContent = () => {
        switch (activeTab) {
            case 'new':
                return (
                    <CommunityNewRequest
                        form={form}
                        setForm={setForm}
                        submitting={submitting}
                        submitted={submitted}
                        onSubmit={handleSubmit}
                        onViewRequests={() => { setSubmitted(null); setActiveTab('my'); }}
                    />
                );
            case 'my':
                return (
                    <CommunityMyRequests
                        requests={myRequests}
                        loading={loadingRequests}
                        onRefresh={fetchMyRequests}
                        onNew={() => setActiveTab('new')}
                    />
                );
            default:
                return null;
        }
    };

    return (
        <AppLayout sidebarItems={sidebarItems} activeTab={activeTab} user={user}>
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
