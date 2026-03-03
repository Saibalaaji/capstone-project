import { Link } from 'react-router-dom';
import { Brain, Zap, BarChart3, Target, LogIn, UserPlus } from 'lucide-react';

const FEATURES = [
    { icon: <Brain size={14} aria-hidden="true" />, label: 'NLP Request Understanding' },
    { icon: <Target size={14} aria-hidden="true" />, label: 'Multi-Factor Matching' },
    { icon: <Zap size={14} aria-hidden="true" />, label: 'Acceptance Prediction' },
    { icon: <BarChart3 size={14} aria-hidden="true" />, label: 'Adaptive Learning' },
];

export default function LandingPage() {
    return (
        <main className="landing-page">
            <div className="landing-content">
                {/* Hero */}
                <div className="landing-logo" aria-hidden="true">🤖</div>
                <h1>VolunAI</h1>
                <p className="subtitle">
                    Autonomous Volunteer Coordination System — Powered by AI-driven
                    decision intelligence for optimal volunteer matching, acceptance
                    prediction, and adaptive learning.
                </p>

                {/* Feature tags */}
                <section aria-label="Key features">
                    <ul
                        style={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            justifyContent: 'center',
                            gap: 12,
                            marginBottom: 48,
                            padding: 0,
                            listStyle: 'none',
                        }}
                    >
                        {FEATURES.map((f) => (
                            <li key={f.label}>
                                <span className="nlp-tag">{f.icon} {f.label}</span>
                            </li>
                        ))}
                    </ul>
                </section>

                {/* CTA buttons — Login & Register only */}
                <nav
                    aria-label="Primary actions"
                    style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}
                >
                    <Link
                        to="/login"
                        className="btn btn-primary btn-lg"
                        style={{ textDecoration: 'none', minWidth: 160, justifyContent: 'center' }}
                    >
                        <LogIn size={18} aria-hidden="true" /> Sign In
                    </Link>
                    <Link
                        to="/register"
                        className="btn btn-lg"
                        style={{
                            textDecoration: 'none',
                            minWidth: 160,
                            justifyContent: 'center',
                            background: 'var(--gradient-secondary)',
                            color: 'white',
                            boxShadow: '0 2px 12px rgba(6,182,212,0.3)',
                        }}
                    >
                        <UserPlus size={18} aria-hidden="true" /> Register
                    </Link>
                </nav>

                <p style={{ marginTop: 48, fontSize: 12, color: 'var(--text-muted)' }}>
                    AI-powered volunteer coordination — register or sign in to get started
                </p>
            </div>
        </main>
    );
}
