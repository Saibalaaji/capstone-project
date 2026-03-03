import { Link } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';

export default function NotFound() {
    return (
        <main
            style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '100vh',
                background: 'var(--bg-primary)',
                padding: '40px 20px',
            }}
        >
            <div style={{ textAlign: 'center', maxWidth: 480 }}>
                {/* Big 404 */}
                <div
                    style={{
                        fontSize: 120,
                        fontWeight: 900,
                        lineHeight: 1,
                        background: 'var(--gradient-primary)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text',
                        marginBottom: 8,
                        userSelect: 'none',
                    }}
                    aria-hidden="true"
                >
                    404
                </div>

                <div style={{ fontSize: 40, marginBottom: 16 }} aria-hidden="true">🤖</div>

                <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 12 }}>
                    Page Not Found
                </h1>
                <p style={{ color: 'var(--text-secondary)', fontSize: 15, lineHeight: 1.6, marginBottom: 32 }}>
                    Oops! The page you&apos;re looking for doesn&apos;t exist or has been moved.
                    Let&apos;s get you back on track.
                </p>

                <nav
                    aria-label="Recovery navigation"
                    style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}
                >
                    <Link
                        to="/"
                        className="btn btn-primary"
                        style={{ textDecoration: 'none' }}
                    >
                        <Home size={16} aria-hidden="true" /> Go to Home
                    </Link>
                    <button
                        className="btn btn-ghost"
                        onClick={() => window.history.back()}
                    >
                        <ArrowLeft size={16} aria-hidden="true" /> Go Back
                    </button>
                </nav>
            </div>
        </main>
    );
}
