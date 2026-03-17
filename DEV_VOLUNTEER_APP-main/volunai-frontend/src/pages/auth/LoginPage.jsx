import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, Heart, ArrowRight, Users, CheckCircle2, Star, Handshake } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { authLogin as loginApi } from '../../services/api';

const COMMUNITY_STATS = [
    { emoji: '🤝', label: 'Active Volunteers', value: '1,284' },
    { emoji: '✅', label: 'Requests Fulfilled', value: '8,940+' },
    { emoji: '⭐', label: 'Average Rating',     value: '4.8 / 5' },
    { emoji: '🌍', label: 'Communities Served', value: '42' },
];

const TESTIMONIALS = [
    { name: 'Priya S.',     role: 'Community Member', text: 'Got groceries delivered during my recovery. Amazing service! 🧡', avatar: 'P' },
    { name: 'Carlos M.',    role: 'Volunteer',         text: 'Helping my neighbors through VolunAI has been deeply fulfilling.', avatar: 'C' },
    { name: 'Aisha K.',     role: 'Community Member', text: 'Response was so fast — a volunteer was with me within the hour.', avatar: 'A' },
    { name: 'Tom B.',       role: 'Admin',             text: 'The AI matching makes volunteer coordination effortless.', avatar: 'T' },
];

export default function LoginPage() {
    const navigate = useNavigate();
    const { login: authLogin } = useAuth();
    const [form, setForm] = useState({ email: '', password: '' });
    const [showPw, setShowPw] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [errorShake, setErrorShake] = useState(false);
    const [testimonialIdx, setTestimonialIdx] = useState(0);

    useEffect(() => {
        const t = setInterval(() => setTestimonialIdx(i => (i + 1) % TESTIMONIALS.length), 4500);
        return () => clearInterval(t);
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const res = await loginApi({ email: form.email, password: form.password });
            const { user, token } = res.data;
            authLogin(user, token);
            if (user.role === 'admin')          navigate('/admin');
            else if (user.role === 'volunteer') navigate('/volunteer');
            else                               navigate('/user');
        } catch (err) {
            const msg = err.response?.data?.message || 'Incorrect email or password';
            setError(msg);
            setErrorShake(true);
            setTimeout(() => setErrorShake(false), 500);
        } finally {
            setLoading(false);
        }
    };

    const t = TESTIMONIALS[testimonialIdx];

    return (
        <div className="auth-split">
            {/* ── Left Panel: Community story ── */}
            <div className="auth-split-left">
                {/* Brand */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 48, zIndex: 1 }}>
                    <div style={{
                        width: 44, height: 44, borderRadius: 12,
                        background: 'linear-gradient(135deg, #FF8C69, #FFB7A5)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 4px 16px rgba(255,140,105,0.3)',
                    }}>
                        <Heart size={22} fill="white" color="white" />
                    </div>
                    <div>
                        <div style={{ fontSize: 18, fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>VolunAI</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Community Volunteer System</div>
                    </div>
                </div>

                {/* Headline */}
                <div style={{ zIndex: 1, width: '100%', maxWidth: 400 }}>
                    <h1 style={{ fontSize: 38, fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '-0.8px', lineHeight: 1.15, marginBottom: 14 }}>
                        Connecting communities<br />
                        <span style={{ color: 'var(--coral)' }}>one act</span> of kindness at a time 🌻
                    </h1>
                    <p style={{ fontSize: 15, color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 36, fontWeight: 500 }}>
                        Join thousands of volunteers and community members making real impact every day.
                    </p>
                </div>

                {/* Community stats */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, width: '100%', maxWidth: 400, marginBottom: 36, zIndex: 1 }}>
                    {COMMUNITY_STATS.map((s, i) => (
                        <div key={i} className="comm-stat">
                            <div style={{ fontSize: 28 }}>{s.emoji}</div>
                            <div>
                                <div style={{ fontSize: 17, fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>{s.value}</div>
                                <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700 }}>{s.label}</div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Animated testimonial */}
                <div style={{
                    background: 'white', borderRadius: 16, padding: '20px 24px',
                    border: '1px solid var(--border-card)', boxShadow: 'var(--shadow-sm)',
                    width: '100%', maxWidth: 400, zIndex: 1,
                    transition: 'all 0.4s ease',
                }}>
                    <p style={{ fontSize: 14, color: 'var(--text-secondary)', fontStyle: 'italic', lineHeight: 1.6, marginBottom: 14 }}>
                        "{t.text}"
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div className="avatar avatar-sm" style={{ background: `hsl(${testimonialIdx * 80 + 10}deg 65% 72%)` }}>
                            {t.avatar}
                        </div>
                        <div>
                            <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-primary)' }}>{t.name}</div>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{t.role}</div>
                        </div>
                        <div style={{ marginLeft: 'auto', display: 'flex', gap: 2 }}>
                            {[...Array(5)].map((_, i) => (
                                <Star key={i} size={12} fill="#FFB000" color="#FFB000" />
                            ))}
                        </div>
                    </div>

                    {/* Progress dots */}
                    <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginTop: 14 }}>
                        {TESTIMONIALS.map((_, i) => (
                            <div key={i} style={{
                                width: i === testimonialIdx ? 20 : 6,
                                height: 6, borderRadius: 99,
                                background: i === testimonialIdx ? 'var(--coral)' : 'var(--border)',
                                transition: 'all 0.3s ease',
                            }} />
                        ))}
                    </div>
                </div>
            </div>

            {/* ── Right Panel: Login form ── */}
            <div className="auth-split-right">
                <div className="auth-split-card animate-fadeIn">
                    <div style={{ marginBottom: 36 }}>
                        <h2 style={{ fontSize: 26, fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '-0.4px', marginBottom: 6 }}>
                            Welcome back 👋
                        </h2>
                        <p style={{ fontSize: 14, color: 'var(--text-muted)', fontWeight: 500 }}>
                            Sign in to your community account to continue
                        </p>
                    </div>

                    {error && (
                        <div className={errorShake ? 'shake' : ''} style={{
                            background: '#FFF0F0', border: '1.5px solid #FFCECE',
                            borderRadius: 10, padding: '12px 16px', marginBottom: 22,
                            fontSize: 14, color: '#C05050', fontWeight: 600,
                            display: 'flex', alignItems: 'center', gap: 8,
                        }}>
                            ⚠️ {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        {/* Email */}
                        <div className="form-group">
                            <label className="form-label">
                                <Mail size={13} /> Email address <span className="required">*</span>
                            </label>
                            <div style={{ position: 'relative' }}>
                                <Mail size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                                <input
                                    type="email"
                                    className="form-input with-icon"
                                    placeholder="you@example.com"
                                    value={form.email}
                                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                                    required
                                    autoComplete="email"
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div className="form-group">
                            <label className="form-label">
                                <Lock size={13} /> Password <span className="required">*</span>
                            </label>
                            <div style={{ position: 'relative' }}>
                                <Lock size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                                <input
                                    type={showPw ? 'text' : 'password'}
                                    className="form-input with-icon"
                                    placeholder="Your password"
                                    value={form.password}
                                    onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                                    required
                                    autoComplete="current-password"
                                    style={{ paddingRight: 44 }}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPw(v => !v)}
                                    style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 0, transition: 'color 0.15s' }}
                                    onMouseEnter={e => e.currentTarget.style.color = 'var(--coral)'}
                                    onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
                                >
                                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>

                        {/* Remember + Forgot */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>
                                <input type="checkbox" style={{ accentColor: 'var(--coral)', width: 15, height: 15 }} />
                                Remember me
                            </label>
                            <Link to="/forgot-password" style={{ fontSize: 13, fontWeight: 700, color: 'var(--coral-dark)', textDecoration: 'none' }}>
                                Forgot password?
                            </Link>
                        </div>

                        {/* Loading bar */}
                        {loading && (
                            <div className="progress-bar-wrap" style={{ marginBottom: 16 }}>
                                <div className="progress-bar-fill indeterminate" />
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="btn btn-primary btn-xl"
                            style={{ width: '100%', justifyContent: 'center', gap: 10, position: 'relative', overflow: 'hidden' }}
                        >
                            {loading ? 'Signing in…' : <><span>Sign In</span> <ArrowRight size={18} /></>}
                        </button>
                    </form>

                    <div style={{ textAlign: 'center', marginTop: 28 }}>
                        <hr className="divider" />
                        <p style={{ fontSize: 14, color: 'var(--text-muted)', fontWeight: 500 }}>
                            Don't have an account?{' '}
                            <Link to="/register" style={{ color: 'var(--coral-dark)', fontWeight: 800, textDecoration: 'none' }}>
                                Join the community
                            </Link>
                        </p>
                    </div>

                    {/* Role hint pills */}
                    <div style={{ marginTop: 28, padding: '16px 20px', background: 'var(--bg-page)', borderRadius: 12, border: '1px solid var(--border)' }}>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10, textAlign: 'center' }}>
                            Who's signing in?
                        </div>
                        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
                            {[
                                { label: '🛡️ Admin',     bg: '#FFF0E8', color: 'var(--coral-dark)',  border: 'var(--coral-light)' },
                                { label: '🙋 Volunteer', bg: '#F0FAF4', color: 'var(--mint-dark)',   border: 'var(--mint-light)' },
                                { label: '🏘️ Community', bg: '#FFF8E8', color: '#996600',            border: '#FFE080' },
                            ].map((r, i) => (
                                <span key={i} style={{ fontSize: 12, fontWeight: 700, padding: '5px 14px', borderRadius: 99, background: r.bg, color: r.color, border: `1.5px solid ${r.border}` }}>
                                    {r.label}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
