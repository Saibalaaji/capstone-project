import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    LayoutDashboard, PlusCircle, Users, ClipboardList, BarChart3,
    Brain, MessageSquare, Home, Heart
} from 'lucide-react';
import { getVolunteers, getRequests } from '../services/api';
import { getAdaptiveSuggestions } from '../services/aiEngine';

import AppLayout from '../components/layout/AppLayout';
import AdminOverview from './admin/AdminOverview';
import AdminRequests from './admin/AdminRequests';
import AdminVolunteers from './admin/AdminVolunteers';
import AdminMatching from './admin/AdminMatching';
import AdminAnalytics from './admin/AdminAnalytics';
import AdminCreateRequest from './admin/AdminCreateRequest';

const TABS = [
    { id: 'overview',    label: 'Overview',       icon: LayoutDashboard },
    { id: 'create',      label: 'New Request',     icon: PlusCircle },
    { id: 'requests',    label: 'All Requests',    icon: ClipboardList },
    { id: 'matching',    label: 'AI Matching',     icon: Brain },
    { id: 'volunteers',  label: 'Volunteers',      icon: Users },
    { id: 'analytics',   label: 'Analytics',       icon: BarChart3 },
];

export default function AdminDashboard() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('overview');
    const [volunteers, setVolunteers] = useState([]);
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState(null);

    const loadData = async () => {
        try {
            const [vRes, rRes] = await Promise.all([getVolunteers(), getRequests()]);
            setVolunteers(vRes.data || []);
            setRequests(rRes.data || []);
        } catch (err) {
            showToast('Could not load data — check your connection', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadData(); }, []);

    const showToast = (msg, type = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 4000);
    };

    const adaptiveData = getAdaptiveSuggestions();

    if (loading) return (
        <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-page)' }}>
            <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>🌻</div>
                <p style={{ color: 'var(--text-muted)', fontWeight: 700, fontSize: 14 }}>Loading your dashboard…</p>
            </div>
        </div>
    );

    const sidebarItems = [
        ...TABS.map(tab => ({ id: tab.id, label: tab.label, icon: tab.icon, onClick: () => setActiveTab(tab.id) })),
        { id: 'chat', label: 'Public Chat', icon: MessageSquare, onClick: () => window.open('/chat', '_blank') },
        { id: 'home', label: 'Home',        icon: Home,          onClick: () => navigate('/') },
    ];

    const renderContent = () => {
        switch (activeTab) {
            case 'overview':   return <AdminOverview requests={requests} volunteers={volunteers} adaptiveData={adaptiveData} />;
            case 'create':     return <AdminCreateRequest volunteers={volunteers} onCreated={loadData} showToast={showToast} />;
            case 'requests':   return <AdminRequests />;
            case 'matching':   return <AdminMatching />;
            case 'volunteers': return <AdminVolunteers />;
            case 'analytics':  return <AdminAnalytics requests={requests} volunteers={volunteers} adaptiveData={adaptiveData} />;
            default:           return <AdminOverview />;
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
