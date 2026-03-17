import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
    Eye, EyeOff, UserPlus, User, Heart, Mail, Lock,
    Phone, MapPin, Briefcase, Calendar, CheckCircle2, ArrowRight
} from 'lucide-react';

const SKILLS = [
    'Food Delivery', 'Medical Assistance', 'Transportation', 'Elder Care',
    'Home Repair', 'Pet Care', 'Technical Support', 'Tutoring',
    'Counseling', 'Community Outreach', 'Childcare', 'Shopping Assistance'
];

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const ROLES = [
    {
        id: 'user',
        label: 'Community Member',
        icon: User,
        desc: 'I need help or want to request services',
        bg: '#F0FAF4',
        border: 'var(--mint-light)',
        activeBg: '#D8F3DC',
        activeBorder: 'var(--mint)',
        activeColor: 'var(--mint-dark)',
        emoji: '🏘️',
    },
    {
        id: 'volunteer',
        label: 'Volunteer',
        icon: Heart,
        desc: 'I want to offer my skills and help others',
        bg: '#FFF0E8',
        border: 'var(--coral-light)',
        activeBg: '#FFE8DE',
        activeBorder: 'var(--coral)',
        activeColor: 'var(--coral-dark)',
        emoji: '🙋',
    },
];

export default function RegisterPage() {
    const navigate = useNavigate();
    const { register } = useAuth();

    const [step, setStep] = useState(1);
    const [role, setRole] = useState('user');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [skills, setSkills] = useState([]);
    const [days, setDays] = useState([]);

    const [form, setForm] = useState({
        name: '', email: '', password: '', confirmPassword: '',
        contactNumber: '', location: ''
    });

    const totalSteps = role === 'volunteer' ? 3 : 2;

    const toggleSkill = (s) => setSkills(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
    const toggleDay  = (d) => setDays(prev  => prev.includes(d)  ? prev.filter(x => x !== d)  : [...prev, d]);

    const handleNext = () => {
        setError('');
        if (step === 1) { setStep(2); return; }
        if (step === 2) {
            if (!form.name || !form.email || !form.password) { setError('Please fill all required fields'); return; }
            if (form.password !== form.confirmPassword) { setError('Passwords do not match'); return; }
            if (form.password.length < 6) { setError('Password must be at least 6 characters'); return; }
            if (role === 'volunteer') { setStep(3); return; }
            handleSubmit();
        }
        if (step === 3) handleSubmit();
    };

    const handleSubmit = async () => {
        setLoading(true);
        setError('');
        try {
            const user = await register({
                name: form.name,
                email: form.email,
                password: form.password,
                contactNumber: form.contactNumber,
                location: form.location,
                role,
                skills: role === 'volunteer' ? skills : [],
                availableDays: role === 'volunteer' ? days : [],
            });
            if (user.role === 'volunteer') navigate('/volunteer');
            else navigate('/user');
        } catch (err) {
            setError(err.response?.data?.error || 'Registration failed. Please try again.');
            setStep(2);
        } finally {
            setLoading(false);
        }
    };

    /* ─── Step labels ─── */
    const stepLabel =
        step === 1 ? 'Select Your Role' :
        step === 2 ? 'Account Details' :
        'Volunteer Profile';

    /* ─── Shared input style ─── */
    const inputStyle = (hasError) => ({
        width: '100%', padding: '11px 14px 11px 40px',
        background: 'var(--bg-input)',
        border: `1.5px solid ${hasError ? 'var(--rose)' : 'var(--border)'}`,
        borderRadius: 'var(--radius-md)', fontSize: 14,
        fontFamily: 'var(--font-body)', color: 'var(--text-primary)',
        transition: 'border-color 0.18s, box-shadow 0.18s', outline: 'none',
        boxSizing: 'border-box',
    });

    return (
        <div style={{
            minHeight: '100vh',
            background: 'linear-gradient(160deg, #FFF4EE 0%, #FFF9F5 50%, #F0FAF4 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '40px 20px',
        }}>
            <div style={{ width: '100%', maxWidth: 640 }}>

                {/* ── Header ── */}
                <div style={{ textAlign: 'center', marginBottom: 28 }}>
                    <div style={{
                        width: 64, height: 64, margin: '0 auto 16px',
                        background: 'linear-gradient(135deg, var(--coral), var(--peach))',
                        borderRadius: 'var(--radius-lg)', display: 'flex',
                        alignItems: 'center', justifyContent: 'center',
                        boxShadow: 'var(--shadow-coral)',
                    }}>
                        <UserPlus size={28} color="white" />
                    </div>
                    <h1 style={{ fontSize: 28, fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '-0.5px', marginBottom: 4 }}>
                        Join VolunAI
                    </h1>
                    <p style={{ fontSize: 14, color: 'var(--text-muted)', fontWeight: 600 }}>
                        Step {step} of {totalSteps}: {stepLabel}
                    </p>
                </div>

                {/* ── Progress bar ── */}
                <div style={{ display: 'flex', gap: 8, marginBottom: 24, padding: '0 4px' }}>
                    {Array.from({ length: totalSteps }, (_, i) => i + 1).map(s => (
                        <div key={s} style={{
                            flex: 1, height: 6, borderRadius: 99,
                            background: s <= step ? 'var(--coral)' : 'var(--border)',
                            boxShadow: s <= step ? '0 0 8px rgba(255,140,105,0.4)' : 'none',
                            transition: 'all 0.4s ease',
                        }} />
                    ))}
                </div>

                {/* ── Card ── */}
                <div style={{
                    background: 'white', borderRadius: 'var(--radius-2xl)',
                    border: '1px solid var(--border-card)',
                    boxShadow: '0 8px 40px rgba(180,120,80,0.10)',
                    overflow: 'hidden',
                }}>
                    {/* Card body — scrollable so buttons never get cut off */}
                    <div style={{ padding: '36px 40px', overflowY: 'auto', maxHeight: '72vh' }}>

                        {/* ── STEP 1: ROLE SELECTION ── */}
                        {step === 1 && (
                            <div className="animate-fadeIn">
                                <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 20 }}>
                                    How would you like to participate?
                                </h2>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                                    {ROLES.map(r => {
                                        const isActive = role === r.id;
                                        return (
                                            <button
                                                key={r.id}
                                                type="button"
                                                onClick={() => setRole(r.id)}
                                                style={{
                                                    display: 'flex', alignItems: 'center', gap: 18,
                                                    padding: '20px 24px', borderRadius: 'var(--radius-xl)',
                                                    border: `2px solid ${isActive ? r.activeBorder : r.border}`,
                                                    background: isActive ? r.activeBg : r.bg,
                                                    cursor: 'pointer', textAlign: 'left',
                                                    transition: 'all 0.2s ease',
                                                    boxShadow: isActive ? 'var(--shadow-sm)' : 'none',
                                                    fontFamily: 'var(--font-body)',
                                                }}
                                            >
                                                <div style={{
                                                    width: 52, height: 52, borderRadius: 'var(--radius-lg)', flexShrink: 0,
                                                    background: isActive ? r.activeBorder : 'white',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    fontSize: 26,
                                                    boxShadow: 'var(--shadow-xs)',
                                                    transition: 'all 0.2s ease',
                                                }}>
                                                    {r.emoji}
                                                </div>
                                                <div style={{ flex: 1 }}>
                                                    <div style={{
                                                        fontSize: 16, fontWeight: 800,
                                                        color: isActive ? r.activeColor : 'var(--text-primary)',
                                                        marginBottom: 3, transition: 'color 0.2s',
                                                    }}>
                                                        {r.label}
                                                    </div>
                                                    <div style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>
                                                        {r.desc}
                                                    </div>
                                                </div>
                                                <div style={{
                                                    width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                                                    border: `2px solid ${isActive ? r.activeBorder : 'var(--border)'}`,
                                                    background: isActive ? r.activeBorder : 'transparent',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    transition: 'all 0.2s',
                                                }}>
                                                    {isActive && <div style={{ width: 8, height: 8, background: 'white', borderRadius: '50%' }} />}
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* ── STEP 2: ACCOUNT DETAILS ── */}
                        {step === 2 && (
                            <div className="animate-fadeIn">
                                <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 20 }}>
                                    Create your account
                                </h2>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                    {/* Full Name */}
                                    <div style={{ gridColumn: '1 / -1' }}>
                                        <label className="form-label" style={{ marginBottom: 6, display: 'block' }}>
                                            <User size={13} /> Full Name <span className="required">*</span>
                                        </label>
                                        <div style={{ position: 'relative' }}>
                                            <User size={15} style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                                            <input type="text" className="form-input with-icon" placeholder="Jane Doe" value={form.name}
                                                onChange={e => setForm({ ...form, name: e.target.value })} required />
                                        </div>
                                    </div>

                                    {/* Email */}
                                    <div style={{ gridColumn: '1 / -1' }}>
                                        <label className="form-label" style={{ marginBottom: 6, display: 'block' }}>
                                            <Mail size={13} /> Email Address <span className="required">*</span>
                                        </label>
                                        <div style={{ position: 'relative' }}>
                                            <Mail size={15} style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                                            <input type="email" className="form-input with-icon" placeholder="jane@example.com" value={form.email}
                                                onChange={e => setForm({ ...form, email: e.target.value })} required />
                                        </div>
                                    </div>

                                    {/* Password */}
                                    <div>
                                        <label className="form-label" style={{ marginBottom: 6, display: 'block' }}>
                                            <Lock size={13} /> Password <span className="required">*</span>
                                        </label>
                                        <div style={{ position: 'relative' }}>
                                            <Lock size={15} style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                                            <input
                                                type={showPassword ? 'text' : 'password'}
                                                className="form-input with-icon"
                                                placeholder="Min. 6 characters"
                                                value={form.password}
                                                onChange={e => setForm({ ...form, password: e.target.value })}
                                                required
                                                style={{ paddingRight: 42 }}
                                            />
                                            <button type="button" onClick={() => setShowPassword(v => !v)}
                                                style={{ position: 'absolute', right: 13, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 0 }}
                                                onMouseEnter={e => e.currentTarget.style.color = 'var(--coral)'}
                                                onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
                                            >
                                                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Confirm Password */}
                                    <div>
                                        <label className="form-label" style={{ marginBottom: 6, display: 'block' }}>
                                            <Lock size={13} /> Confirm Password <span className="required">*</span>
                                        </label>
                                        <div style={{ position: 'relative' }}>
                                            <Lock size={15} style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                                            <input type="password" className="form-input with-icon" placeholder="Repeat password" value={form.confirmPassword}
                                                onChange={e => setForm({ ...form, confirmPassword: e.target.value })} required />
                                        </div>
                                    </div>

                                    {/* Phone */}
                                    <div>
                                        <label className="form-label" style={{ marginBottom: 6, display: 'block' }}>
                                            <Phone size={13} /> Phone Number
                                        </label>
                                        <div style={{ position: 'relative' }}>
                                            <Phone size={15} style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                                            <input type="tel" className="form-input with-icon" placeholder="+1 234 567 890" value={form.contactNumber}
                                                onChange={e => setForm({ ...form, contactNumber: e.target.value })} />
                                        </div>
                                    </div>

                                    {/* Location */}
                                    <div>
                                        <label className="form-label" style={{ marginBottom: 6, display: 'block' }}>
                                            <MapPin size={13} /> Location / City
                                        </label>
                                        <div style={{ position: 'relative' }}>
                                            <MapPin size={15} style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                                            <input type="text" className="form-input with-icon" placeholder="e.g. San Francisco" value={form.location}
                                                onChange={e => setForm({ ...form, location: e.target.value })} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ── STEP 3: VOLUNTEER EXTRAS ── */}
                        {step === 3 && (
                            <div className="animate-fadeIn">
                                <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 20 }}>
                                    Your skills &amp; availability
                                </h2>

                                <div style={{ marginBottom: 28 }}>
                                    <label style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--text-muted)', display: 'block', marginBottom: 12 }}>
                                        <Briefcase size={12} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />
                                        Your Skills &amp; Services <span style={{ fontWeight: 500, textTransform: 'none', letterSpacing: 0 }}>(select all that apply)</span>
                                    </label>
                                    <div className="chip-group">
                                        {SKILLS.map(s => (
                                            <span
                                                key={s}
                                                className={`chip ${skills.includes(s) ? 'active' : ''}`}
                                                onClick={() => toggleSkill(s)}
                                                style={{ cursor: 'pointer' }}
                                            >
                                                {s}
                                            </span>
                                        ))}
                                    </div>
                                    {skills.length > 0 && (
                                        <p style={{ fontSize: 12, color: 'var(--coral-dark)', marginTop: 8, fontWeight: 600 }}>
                                            ✓ {skills.length} skill{skills.length > 1 ? 's' : ''} selected
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--text-muted)', display: 'block', marginBottom: 12 }}>
                                        <Calendar size={12} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />
                                        Regular Availability <span style={{ fontWeight: 500, textTransform: 'none', letterSpacing: 0 }}>(select all that apply)</span>
                                    </label>
                                    <div className="chip-group">
                                        {DAYS.map(d => (
                                            <span
                                                key={d}
                                                className={`chip ${days.includes(d) ? 'active' : ''}`}
                                                onClick={() => toggleDay(d)}
                                                style={{ cursor: 'pointer' }}
                                            >
                                                {d.slice(0, 3)}
                                            </span>
                                        ))}
                                    </div>
                                    {days.length > 0 && (
                                        <p style={{ fontSize: 12, color: 'var(--mint-dark)', marginTop: 8, fontWeight: 600 }}>
                                            ✓ {days.length} day{days.length > 1 ? 's' : ''} selected
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* ── Error message ── */}
                        {error && (
                            <div className="animate-shake" style={{
                                marginTop: 20,
                                background: '#FFF0F0', border: '1.5px solid #FFCECE',
                                borderRadius: 'var(--radius-md)', padding: '12px 16px',
                                fontSize: 14, color: '#C05050', fontWeight: 600,
                                display: 'flex', alignItems: 'center', gap: 8,
                            }}>
                                ⚠️ {error}
                            </div>
                        )}

                        {/* ── Action buttons ── */}
                        <div style={{ display: 'flex', gap: 12, marginTop: 28 }}>
                            {step > 1 && (
                                <button
                                    type="button"
                                    className="btn btn-ghost"
                                    style={{ flex: 1, justifyContent: 'center', padding: '14px 24px' }}
                                    onClick={() => { setError(''); setStep(s => s - 1); }}
                                >
                                    Back
                                </button>
                            )}
                            <button
                                type="button"
                                className="btn btn-primary"
                                style={{ flex: 1, justifyContent: 'center', padding: '14px 24px' }}
                                onClick={handleNext}
                                disabled={loading}
                            >
                                {loading ? (
                                    <>⏳ Creating account…</>
                                ) : step < totalSteps ? (
                                    <>Continue <ArrowRight size={16} /></>
                                ) : (
                                    <><UserPlus size={16} /> Complete Registration</>
                                )}
                            </button>
                        </div>

                        {/* ── Already have account ── */}
                        <div style={{ textAlign: 'center', marginTop: 24, paddingTop: 24, borderTop: '1px solid var(--border)' }}>
                            <p style={{ fontSize: 14, color: 'var(--text-muted)', fontWeight: 500 }}>
                                Already have an account?{' '}
                                <Link to="/login" style={{ color: 'var(--coral-dark)', fontWeight: 800, textDecoration: 'none' }}>
                                    Sign In
                                </Link>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
