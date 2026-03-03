/**
 * Lightweight CSS-only loading spinner used as the Suspense fallback
 * for lazy-loaded routes. Zero external dependencies.
 */
export default function LoadingSpinner() {
    return (
        <div
            role="status"
            aria-label="Loading page"
            style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '100vh',
                background: 'var(--bg-primary, #0f172a)',
            }}
        >
            <div style={{ textAlign: 'center' }}>
                <div
                    style={{
                        width: 48,
                        height: 48,
                        border: '4px solid rgba(139,92,246,0.2)',
                        borderTop: '4px solid #8b5cf6',
                        borderRadius: '50%',
                        animation: 'spin 0.8s linear infinite',
                        margin: '0 auto 16px',
                    }}
                />
                <p style={{ color: '#94a3b8', fontSize: 14, margin: 0 }}>Loading…</p>
            </div>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );
}
