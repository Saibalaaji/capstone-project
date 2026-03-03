import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { authService } from '../services/authService';
import { LogIn, Mail, Lock, Home } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const user = await authService.login(email, password);

      // If ProtectedRoute redirected here from a specific page, go back there
      const from = location.state?.from?.pathname;
      if (from && from !== '/login') {
        navigate(from, { replace: true });
        return;
      }

      // Otherwise send the user to their role-specific dashboard
      if (user.role === 'admin') navigate('/admin');
      else if (user.role === 'volunteer') navigate('/volunteer');
      else navigate('/user');
    } catch (err) {
      console.error(err);
      setError('Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };


  return (
    <main className="app-layout" style={{ background: 'var(--bg-primary)' }}>
      <div
        className="main-content"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          padding: '40px 20px',
        }}
      >
        <section
          className="glass-card"
          style={{ maxWidth: 460, width: '100%', padding: 40 }}
          aria-labelledby="login-heading"
        >
          {/* Header */}
          <header style={{ textAlign: 'center', marginBottom: 32 }}>
            <div
              style={{
                width: 64,
                height: 64,
                margin: '0 auto 16px',
                background: 'var(--gradient-primary)',
                borderRadius: 'var(--radius-lg)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 28,
              }}
              aria-hidden="true"
            >
              🤖
            </div>
            <h1
              id="login-heading"
              style={{ fontSize: 26, fontWeight: 700, marginBottom: 6 }}
            >
              Welcome Back
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
              Sign in to your VolunAI account
            </p>
          </header>

          {/* Error */}
          {error && (
            <div
              role="alert"
              style={{
                background: 'rgba(244, 63, 94, 0.12)',
                border: '1px solid var(--accent-rose)',
                borderRadius: 'var(--radius-md)',
                padding: '12px 16px',
                marginBottom: 24,
                color: 'var(--accent-rose)',
                fontSize: 13,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              ⚠️ {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} noValidate>
            <div className="form-group">
              <label htmlFor="login-email" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Mail size={14} aria-hidden="true" /> Email Address
              </label>
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="form-input"
                placeholder="your.email@example.com"
                autoComplete="email"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="login-password" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Lock size={14} aria-hidden="true" /> Password
              </label>
              <input
                id="login-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="form-input"
                placeholder="Enter your password"
                autoComplete="current-password"
                required
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'center', marginTop: 8, fontSize: 15 }}
              disabled={loading}
            >
              {loading ? (
                <>⏳ Signing in…</>
              ) : (
                <><LogIn size={16} aria-hidden="true" /> Sign In</>
              )}
            </button>
          </form>

          {/* Footer */}
          <div style={{ marginTop: 28, textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
              Don&apos;t have an account?{' '}
              <Link
                to="/register"
                style={{ color: 'var(--accent-purple-light)', fontWeight: 600 }}
              >
                Register
              </Link>
            </p>
            <Link
              to="/"
              style={{ fontSize: 12, color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}
            >
              <Home size={12} aria-hidden="true" /> Back to Home
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
