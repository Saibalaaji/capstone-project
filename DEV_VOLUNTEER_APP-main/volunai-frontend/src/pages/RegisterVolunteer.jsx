import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Phone, MapPin, Briefcase, Calendar, Home, CheckCircle2, XCircle, UserPlus } from 'lucide-react';
import { createVolunteer } from '../services/api';

const SERVICE_TYPES = [
    'Food Delivery', 'Medical Assistance', 'Transportation',
    'Elder Care', 'Home Repair', 'Pet Care', 'Technical Support',
    'Tutoring', 'Counseling', 'Community Outreach'
];

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function RegisterVolunteer() {
    const navigate = useNavigate();
    const [toast, setToast] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);

    const [form, setForm] = useState({
        name: '',
        email: '',
        phone: '',
        location: '',
        serviceType: [],
        availableDays: [],
    });

    const [errors, setErrors] = useState({});

    function showToast(msg, type = 'info') {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 4000);
    }

    function validate() {
        const errs = {};
        if (!form.name.trim()) errs.name = 'Full name is required';
        if (!form.email.trim()) errs.email = 'Email is required';
        else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Enter a valid email address';
        if (!form.phone.trim()) errs.phone = 'Phone number is required';
        else if (!/^[\d\s\-+()]{7,15}$/.test(form.phone)) errs.phone = 'Enter a valid phone number';
        if (!form.location.trim()) errs.location = 'Location is required';
        if (form.serviceType.length === 0) errs.serviceType = 'Select at least one service type';
        if (form.availableDays.length === 0) errs.availableDays = 'Select at least one available day';
        setErrors(errs);
        return Object.keys(errs).length === 0;
    }

    function toggleService(service) {
        setForm(prev => ({
            ...prev,
            serviceType: prev.serviceType.includes(service)
                ? prev.serviceType.filter(s => s !== service)
                : [...prev.serviceType, service]
        }));
    }

    function toggleDay(day) {
        setForm(prev => ({
            ...prev,
            availableDays: prev.availableDays.includes(day)
                ? prev.availableDays.filter(d => d !== day)
                : [...prev.availableDays, day]
        }));
    }

    async function handleSubmit(e) {
        e.preventDefault();
        if (!validate()) return;

        setSubmitting(true);
        try {
            const payload = {
                name: form.name.trim(),
                email: form.email.trim(),
                phone: form.phone.trim(),
                location: form.location.trim(),
                serviceType: form.serviceType,
                availableDays: form.availableDays,
                rating: 0.0,
                active: true,
            };
            const res = await createVolunteer(payload);
            setSuccess(true);
            showToast(`Welcome, ${res.data.name}! Your volunteer ID is #${res.data.id}`, 'success');
        } catch (err) {
            console.error('Registration failed:', err);
            showToast('Registration failed. Please try again.', 'error');
        } finally {
            setSubmitting(false);
        }
    }

    if (success) {
        return (
            <div className="app-layout">
                <div className="main-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
                    <div className="glass-card" style={{ textAlign: 'center', padding: 48, maxWidth: 500 }}>
                        <div style={{ fontSize: 56, marginBottom: 16 }}>🎉</div>
                        <h2 style={{ marginBottom: 8 }}>Registration Successful!</h2>
                        <p style={{ color: 'var(--text-muted)', marginBottom: 24, lineHeight: 1.6 }}>
                            Your volunteer profile has been created and saved to the database.
                            You can now log in to the Volunteer Dashboard to manage your tasks.
                        </p>
                        <div className="flex gap-8" style={{ justifyContent: 'center', flexWrap: 'wrap' }}>
                            <Link to="/volunteer" className="btn btn-primary" style={{ textDecoration: 'none' }}>
                                <User size={16} /> Go to Dashboard
                            </Link>
                            <Link to="/" className="btn btn-ghost" style={{ textDecoration: 'none' }}>
                                <Home size={16} /> Back to Home
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="app-layout">
            <div className="main-content" style={{ padding: '40px 24px', maxWidth: 800, margin: '0 auto' }}>
                <div className="page-header" style={{ textAlign: 'center', marginBottom: 32 }}>
                    <Link to="/" style={{ color: 'var(--text-muted)', fontSize: 13, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4, marginBottom: 16 }}>
                        <Home size={14} /> Back to Home
                    </Link>
                    <h2 style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
                        <UserPlus size={28} /> Volunteer Registration
                    </h2>
                    <p>Join our volunteer network and make a difference in your community</p>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="grid-2" style={{ gap: 20 }}>
                        {/* Personal Information */}
                        <div className="glass-card">
                            <div className="card-title"><User size={18} /> Personal Information</div>

                            <div style={{ marginBottom: 16 }}>
                                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1, display: 'block', marginBottom: 6 }}>
                                    Full Name *
                                </label>
                                <div style={{ position: 'relative' }}>
                                    <User size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                    <input
                                        type="text"
                                        value={form.name}
                                        onChange={e => setForm({ ...form, name: e.target.value })}
                                        placeholder="e.g. John Smith"
                                        style={{
                                            width: '100%', padding: '10px 12px 10px 36px', borderRadius: 8,
                                            background: 'var(--bg-glass)', color: 'var(--text-primary)',
                                            border: errors.name ? '1px solid var(--accent-rose)' : '1px solid var(--border-glass)',
                                            fontSize: 14, outline: 'none', boxSizing: 'border-box'
                                        }}
                                    />
                                </div>
                                {errors.name && <span style={{ fontSize: 11, color: 'var(--accent-rose)', marginTop: 4, display: 'block' }}>{errors.name}</span>}
                            </div>

                            <div style={{ marginBottom: 16 }}>
                                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1, display: 'block', marginBottom: 6 }}>
                                    Email Address *
                                </label>
                                <div style={{ position: 'relative' }}>
                                    <Mail size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                    <input
                                        type="email"
                                        value={form.email}
                                        onChange={e => setForm({ ...form, email: e.target.value })}
                                        placeholder="e.g. john.smith@email.com"
                                        style={{
                                            width: '100%', padding: '10px 12px 10px 36px', borderRadius: 8,
                                            background: 'var(--bg-glass)', color: 'var(--text-primary)',
                                            border: errors.email ? '1px solid var(--accent-rose)' : '1px solid var(--border-glass)',
                                            fontSize: 14, outline: 'none', boxSizing: 'border-box'
                                        }}
                                    />
                                </div>
                                {errors.email && <span style={{ fontSize: 11, color: 'var(--accent-rose)', marginTop: 4, display: 'block' }}>{errors.email}</span>}
                            </div>

                            <div style={{ marginBottom: 16 }}>
                                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1, display: 'block', marginBottom: 6 }}>
                                    Phone Number *
                                </label>
                                <div style={{ position: 'relative' }}>
                                    <Phone size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                    <input
                                        type="tel"
                                        value={form.phone}
                                        onChange={e => setForm({ ...form, phone: e.target.value })}
                                        placeholder="e.g. 555-123-4567"
                                        style={{
                                            width: '100%', padding: '10px 12px 10px 36px', borderRadius: 8,
                                            background: 'var(--bg-glass)', color: 'var(--text-primary)',
                                            border: errors.phone ? '1px solid var(--accent-rose)' : '1px solid var(--border-glass)',
                                            fontSize: 14, outline: 'none', boxSizing: 'border-box'
                                        }}
                                    />
                                </div>
                                {errors.phone && <span style={{ fontSize: 11, color: 'var(--accent-rose)', marginTop: 4, display: 'block' }}>{errors.phone}</span>}
                            </div>

                            <div>
                                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1, display: 'block', marginBottom: 6 }}>
                                    Location / City *
                                </label>
                                <div style={{ position: 'relative' }}>
                                    <MapPin size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                    <input
                                        type="text"
                                        value={form.location}
                                        onChange={e => setForm({ ...form, location: e.target.value })}
                                        placeholder="e.g. New York"
                                        style={{
                                            width: '100%', padding: '10px 12px 10px 36px', borderRadius: 8,
                                            background: 'var(--bg-glass)', color: 'var(--text-primary)',
                                            border: errors.location ? '1px solid var(--accent-rose)' : '1px solid var(--border-glass)',
                                            fontSize: 14, outline: 'none', boxSizing: 'border-box'
                                        }}
                                    />
                                </div>
                                {errors.location && <span style={{ fontSize: 11, color: 'var(--accent-rose)', marginTop: 4, display: 'block' }}>{errors.location}</span>}
                            </div>
                        </div>

                        {/* Skills & Availability */}
                        <div className="glass-card">
                            <div className="card-title"><Briefcase size={18} /> Skills & Availability</div>

                            <div style={{ marginBottom: 24 }}>
                                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1, display: 'block', marginBottom: 10 }}>
                                    Service Types * <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(select all that apply)</span>
                                </label>
                                <div className="chip-group">
                                    {SERVICE_TYPES.map(s => (
                                        <span key={s}
                                            className={`chip ${form.serviceType.includes(s) ? 'active' : ''}`}
                                            onClick={() => toggleService(s)}
                                            style={{ cursor: 'pointer' }}>
                                            <Briefcase size={12} /> {s}
                                        </span>
                                    ))}
                                </div>
                                {errors.serviceType && <span style={{ fontSize: 11, color: 'var(--accent-rose)', marginTop: 6, display: 'block' }}>{errors.serviceType}</span>}
                            </div>

                            <div>
                                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1, display: 'block', marginBottom: 10 }}>
                                    Available Days * <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(select all that apply)</span>
                                </label>
                                <div className="chip-group">
                                    {DAYS.map(day => (
                                        <span key={day}
                                            className={`chip ${form.availableDays.includes(day) ? 'active' : ''}`}
                                            onClick={() => toggleDay(day)}
                                            style={{ cursor: 'pointer' }}>
                                            <Calendar size={12} /> {day.slice(0, 3)}
                                        </span>
                                    ))}
                                </div>
                                {errors.availableDays && <span style={{ fontSize: 11, color: 'var(--accent-rose)', marginTop: 6, display: 'block' }}>{errors.availableDays}</span>}
                            </div>

                            {/* Summary Preview */}
                            {(form.name || form.serviceType.length > 0) && (
                                <div style={{ marginTop: 24, padding: 16, borderRadius: 10, background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.15)' }}>
                                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--accent-purple-light)', marginBottom: 8 }}>
                                        📋 Registration Preview
                                    </div>
                                    {form.name && <div style={{ fontSize: 13, marginBottom: 4 }}>👤 <strong>{form.name}</strong></div>}
                                    {form.location && <div style={{ fontSize: 13, marginBottom: 4 }}>📍 {form.location}</div>}
                                    {form.serviceType.length > 0 && (
                                        <div style={{ fontSize: 13, marginBottom: 4 }}>🔧 {form.serviceType.join(', ')}</div>
                                    )}
                                    {form.availableDays.length > 0 && (
                                        <div style={{ fontSize: 13 }}>📅 {form.availableDays.map(d => d.slice(0, 3)).join(', ')}</div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Submit Button */}
                    <div style={{ marginTop: 24, textAlign: 'center' }}>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="btn btn-primary"
                            style={{ padding: '14px 48px', fontSize: 16, borderRadius: 12, minWidth: 240 }}>
                            {submitting ? (
                                <>⏳ Registering...</>
                            ) : (
                                <><UserPlus size={18} /> Register as Volunteer</>
                            )}
                        </button>
                        <p style={{ marginTop: 12, fontSize: 12, color: 'var(--text-muted)' }}>
                            Your profile will be stored in the SQLite database and available to admins immediately
                        </p>
                    </div>
                </form>

                {/* Toast */}
                {toast && (
                    <div className={`toast ${toast.type}`}>
                        {toast.type === 'success' && <CheckCircle2 size={18} color="var(--accent-green)" />}
                        {toast.type === 'error' && <XCircle size={18} color="var(--accent-rose)" />}
                        <span style={{ fontSize: 14 }}>{toast.msg}</span>
                    </div>
                )}
            </div>
        </div>
    );
}
