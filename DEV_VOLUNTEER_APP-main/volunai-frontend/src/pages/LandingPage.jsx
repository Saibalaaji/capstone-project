import { Link, useNavigate } from 'react-router-dom';
import { Heart, ShieldCheck, Users, MessageSquare, UserPlus, LogIn,
         Brain, Zap, Target, Star, ArrowRight, CheckCircle2, Handshake } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const FEATURES = [
    { emoji: '🤖', title: 'AI-Powered Matching', desc: 'Smart volunteer matching using NLP and multi-factor scoring for the best fit every time.' },
    { emoji: '⚡', title: 'Instant Response',    desc: 'Automated notifications and real-time updates keep volunteers and requesters in sync.' },
    { emoji: '📊', title: 'Live Analytics',      desc: 'Rich dashboards with charts, heatmaps, and performance insights for admins.' },
    { emoji: '🔒', title: 'Trusted & Verified',  desc: 'Rating system, reliability scores, and transparent volunteer profiles build community trust.' },
    { emoji: '💬', title: 'Built-in Chat',        desc: 'In-app messaging between volunteers and community members for seamless coordination.' },
    { emoji: '🌍', title: 'Community-First',      desc: 'Designed around human warmth — not cold corporate efficiency. People over processes.' },
];

const IMPACT_STATS = [
    { value: '1,284', label: 'Active Volunteers', icon: '🙋' },
    { value: '8,940', label: 'Requests Fulfilled', icon: '✅' },
    { value: '4.8★', label: 'Average Rating',      icon: '⭐' },
    { value: '42',   label: 'Communities',          icon: '🌍' },
];

const HOW_IT_WORKS = [
    { step: '1', emoji: '📝', title: 'Submit a Request', desc: 'Describe what help you need — our AI understands natural language.' },
    { step: '2', emoji: '🤝', title: 'AI Finds a Match',  desc: 'The system scores all available volunteers and selects the best fit.' },
    { step: '3', emoji: '🚀', title: 'Help Arrives',      desc: 'Your volunteer is notified, accepts, and arrives. Track everything in real-time.' },
];

export default function LandingPage() {
    const { user, logout } = useAuth();

    return (
        <div style={{ fontFamily: 'var(--font-body)', background: 'var(--bg-page)', minHeight: '100vh' }}>
            {/* ── TOP NAV ── */}
            <nav style={{
                position: 'sticky', top: 0, zIndex: 100,
                background: 'rgba(255,249,245,0.92)', backdropFilter: 'blur(12px)',
                borderBottom: '1px solid var(--border)',
                padding: '0 40px', height: 64,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg,#FF8C69,#FFB7A5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Heart size={18} fill="white" color="white" />
                    </div>
                    <span style={{ fontSize: 17, fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>VolunAI</span>
                </div>

                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    {user ? (
                        <>
                            <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600 }}>Hi, {user.name} 👋</span>
                            <Link to={user.role === 'admin' ? '/admin' : user.role === 'volunteer' ? '/volunteer' : '/user'}
                                className="btn btn-primary btn-sm">
                                My Dashboard <ArrowRight size={14} />
                            </Link>
                            <button className="btn btn-ghost btn-sm" onClick={logout}>Sign Out</button>
                        </>
                    ) : (
                        <>
                            <Link to="/login"    className="btn btn-ghost btn-sm"><LogIn size={15} /> Sign In</Link>
                            <Link to="/register" className="btn btn-primary btn-sm"><UserPlus size={15} /> Join Free</Link>
                        </>
                    )}
                </div>
            </nav>

            {/* ── HERO ── */}
            <section className="hero-section">
                <div style={{ position: 'relative', zIndex: 1, maxWidth: 780, width: '100%' }}>
                    {/* Pill badge */}
                    <div style={{
                        display: 'inline-flex', alignItems: 'center', gap: 8,
                        background: '#FFF0E8', border: '1.5px solid var(--coral-light)',
                        borderRadius: 99, padding: '6px 16px', marginBottom: 28,
                        fontSize: 13, fontWeight: 700, color: 'var(--coral-dark)',
                    }}>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--coral)', display: 'inline-block' }} />
                        AI-Powered Community Volunteer System
                    </div>

                    <h1 className="hero-title">
                        Help your neighbors<br />
                        with <span className="accent">kindness</span> + AI 🌻
                    </h1>
                    <p className="hero-subtitle">
                        VolunAI connects people who need help with verified volunteers nearby — instantly, intelligently, and with heart.
                    </p>

                    <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
                        <Link to="/register" className="btn btn-primary btn-xl">
                            <Handshake size={20} /> Get Help Now
                        </Link>
                        <Link to="/register" className="btn btn-mint btn-xl">
                            <Heart size={20} /> Become a Volunteer
                        </Link>
                    </div>

                    {/* Social proof */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16, justifyContent: 'center', marginTop: 40, flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex' }}>
                            {['P','C','A','T','M'].map((c, i) => (
                                <div key={i} className="avatar avatar-sm" style={{
                                    marginLeft: i > 0 ? -10 : 0,
                                    border: '2px solid white',
                                    background: `hsl(${i * 60 + 10}deg 65% 70%)`,
                                    zIndex: 5 - i,
                                }}>
                                    {c}
                                </div>
                            ))}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            {[...Array(5)].map((_, i) => <Star key={i} size={14} fill="#FFB000" color="#FFB000" />)}
                            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)' }}>
                                Trusted by <strong>1,284</strong> volunteers
                            </span>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── IMPACT STATS ── */}
            <section style={{ padding: '60px 40px', background: 'white', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
                <div style={{ maxWidth: 960, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 24 }}>
                    {IMPACT_STATS.map((s, i) => (
                        <div key={i} style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: 40, marginBottom: 8 }}>{s.icon}</div>
                            <div style={{ fontSize: 36, fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '-1px', lineHeight: 1 }}>{s.value}</div>
                            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', marginTop: 6, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{s.label}</div>
                        </div>
                    ))}
                </div>
            </section>

            {/* ── HOW IT WORKS ── */}
            <section style={{ padding: '80px 40px' }}>
                <div style={{ maxWidth: 900, margin: '0 auto' }}>
                    <div style={{ textAlign: 'center', marginBottom: 56 }}>
                        <h2 style={{ fontSize: 34, fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '-0.6px', marginBottom: 12 }}>
                            How it works 🌱
                        </h2>
                        <p style={{ fontSize: 16, color: 'var(--text-secondary)', fontWeight: 500 }}>
                            Three simple steps to get the help you need.
                        </p>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 28 }}>
                        {HOW_IT_WORKS.map((h, i) => (
                            <div key={i} style={{ textAlign: 'center' }}>
                                <div style={{
                                    width: 64, height: 64, borderRadius: 20,
                                    background: i === 0 ? '#FFF0E8' : i === 1 ? '#F0FAF4' : '#E8F4FF',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: 30, margin: '0 auto 20px',
                                    border: `2px solid ${i === 0 ? 'var(--coral-light)' : i === 1 ? 'var(--mint-light)' : 'var(--sky-light)'}`,
                                    boxShadow: 'var(--shadow-sm)',
                                }}>
                                    {h.emoji}
                                </div>
                                <div style={{
                                    display: 'inline-block', background: i === 0 ? 'var(--coral)' : i === 1 ? 'var(--mint)' : 'var(--sky)',
                                    color: 'white', borderRadius: 99, padding: '2px 10px',
                                    fontSize: 11, fontWeight: 800, marginBottom: 12,
                                }}>
                                    Step {h.step}
                                </div>
                                <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 8 }}>{h.title}</h3>
                                <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.65 }}>{h.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── FEATURES ── */}
            <section style={{ padding: '80px 40px', background: 'var(--bg-page)' }}>
                <div style={{ maxWidth: 1040, margin: '0 auto' }}>
                    <div style={{ textAlign: 'center', marginBottom: 56 }}>
                        <h2 style={{ fontSize: 34, fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '-0.6px', marginBottom: 12 }}>
                            Everything you need ✨
                        </h2>
                        <p style={{ fontSize: 16, color: 'var(--text-secondary)', fontWeight: 500 }}>
                            A complete platform built for modern community volunteering.
                        </p>
                    </div>
                    <div className="grid-3">
                        {FEATURES.map((f, i) => (
                            <div key={i} className="feature-card">
                                <div className="feature-icon-wrap" style={{ background: i % 3 === 0 ? '#FFF0E8' : i % 3 === 1 ? '#F0FAF4' : '#E8F4FF' }}>
                                    {f.emoji}
                                </div>
                                <h3 style={{ fontSize: 17, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 10 }}>{f.title}</h3>
                                <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.65 }}>{f.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── ROLE CARDS ── */}
            <section style={{ padding: '80px 40px', background: 'white' }}>
                <div style={{ maxWidth: 960, margin: '0 auto' }}>
                    <div style={{ textAlign: 'center', marginBottom: 48 }}>
                        <h2 style={{ fontSize: 34, fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '-0.6px', marginBottom: 12 }}>
                            Your role in the community 🤝
                        </h2>
                    </div>
                    <div className="grid-3">
                        {[
                            { emoji: '🛡️', title: 'Admin', color: '#FFF0E8', border: 'var(--coral-light)', link: '/login',    desc: 'Manage volunteers, create requests, view AI recommendations, and track community analytics.' },
                            { emoji: '🙋', title: 'Volunteer', color: '#F0FAF4',  border: 'var(--mint-light)',  link: '/register', desc: 'Sign up, set your skills and availability, then receive and accept task assignments.' },
                            { emoji: '🏘️', title: 'Community Member', color: '#FFF8E8', border: '#FFE080',           link: '/register', desc: 'Submit a help request and get matched to a skilled, trusted volunteer near you.' },
                        ].map((r, i) => (
                            <Link key={i} to={r.link} style={{ textDecoration: 'none' }}>
                                <div className="feature-card" style={{ borderColor: r.border, background: r.color }}>
                                    <div style={{ fontSize: 48, marginBottom: 16 }}>{r.emoji}</div>
                                    <h3 style={{ fontSize: 20, fontWeight: 900, color: 'var(--text-primary)', marginBottom: 10 }}>{r.title}</h3>
                                    <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.65 }}>{r.desc}</p>
                                    <div style={{ marginTop: 16, color: 'var(--coral-dark)', fontWeight: 800, fontSize: 13, display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'center' }}>
                                        Get started <ArrowRight size={14} />
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── CTA BANNER ── */}
            <section style={{
                padding: '80px 40px',
                background: 'linear-gradient(135deg, #FFF0E8 0%, #F0FAF4 100%)',
                borderTop: '1px solid var(--border)',
            }}>
                <div style={{ maxWidth: 640, margin: '0 auto', textAlign: 'center' }}>
                    <div style={{ fontSize: 64, marginBottom: 16 }}>🌻</div>
                    <h2 style={{ fontSize: 36, fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '-0.6px', marginBottom: 16 }}>
                        Ready to make a difference?
                    </h2>
                    <p style={{ fontSize: 16, color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 36 }}>
                        Join thousands of volunteers and community members creating real impact every single day.
                    </p>
                    <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
                        <Link to="/register" className="btn btn-primary btn-xl">
                            <Heart size={20} /> Join as Volunteer
                        </Link>
                        <Link to="/register" className="btn btn-outline btn-xl">
                            <ArrowRight size={20} /> Request Help
                        </Link>
                    </div>
                    <p style={{ marginTop: 24, fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>
                        Demo: <code style={{ background: 'var(--bg-hover)', padding: '2px 8px', borderRadius: 4 }}>admin@cvas.com / admin123</code>
                        {' · '}
                        <code style={{ background: 'var(--bg-hover)', padding: '2px 8px', borderRadius: 4 }}>user@cvas.com / user123</code>
                    </p>
                </div>
            </section>

            {/* ── FOOTER ── */}
            <footer style={{ background: '#2D2D2D', padding: '40px', color: 'rgba(255,255,255,0.5)', textAlign: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center', marginBottom: 12 }}>
                    <div style={{ width: 28, height: 28, borderRadius: 8, background: 'var(--coral)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Heart size={14} fill="white" color="white" />
                    </div>
                    <span style={{ color: 'white', fontWeight: 800 }}>VolunAI</span>
                </div>
                <p style={{ fontSize: 13 }}>Community Volunteer Assistance & Coordination System</p>
                <p style={{ fontSize: 12, marginTop: 8 }}>Built with 🧡 for communities everywhere</p>
            </footer>
        </div>
    );
}
