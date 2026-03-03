import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';

export default function Register() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    contactNumber: '',
    location: '',
    role: 'user'
  });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await authService.register(formData);
      navigate('/login');
    } catch (err) {
      console.error(err);
      setError('Registration failed');
    }
  };

  const update = (field) => (e) => setFormData({ ...formData, [field]: e.target.value });

  return (
    <main className="app-layout">
      <div className="main-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '40px 20px' }}>
        <section className="glass-card" style={{ maxWidth: 500, width: '100%', padding: 40 }} aria-labelledby="register-heading">
          <header style={{ textAlign: 'center', marginBottom: 32 }}>
            <div style={{ width: 64, height: 64, margin: '0 auto 16px', background: 'var(--gradient-primary)', borderRadius: 'var(--radius-lg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }} aria-hidden="true">🤖</div>
            <h1 id="register-heading" style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Create Account</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Join VolunAI community</p>
          </header>

          {error && (
            <div role="alert" style={{ background: 'rgba(244, 63, 94, 0.15)', border: '1px solid var(--accent-rose)', borderRadius: 'var(--radius-md)', padding: '12px 16px', marginBottom: 24, color: 'var(--accent-rose)', fontSize: 13 }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <div className="form-group">
              <label htmlFor="reg-name">Full Name</label>
              <input
                id="reg-name"
                type="text"
                value={formData.name}
                onChange={update('name')}
                className="form-input"
                placeholder="Enter your full name"
                autoComplete="name"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="reg-email">Email Address</label>
              <input
                id="reg-email"
                type="email"
                value={formData.email}
                onChange={update('email')}
                className="form-input"
                placeholder="your.email@example.com"
                autoComplete="email"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="reg-password">Password</label>
              <input
                id="reg-password"
                type="password"
                value={formData.password}
                onChange={update('password')}
                className="form-input"
                placeholder="Create a strong password"
                autoComplete="new-password"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="reg-phone">Contact Number</label>
              <input
                id="reg-phone"
                type="tel"
                value={formData.contactNumber}
                onChange={update('contactNumber')}
                className="form-input"
                placeholder="555-123-4567"
                autoComplete="tel"
              />
            </div>

            <div className="form-group">
              <label htmlFor="reg-location">Location</label>
              <input
                id="reg-location"
                type="text"
                value={formData.location}
                onChange={update('location')}
                className="form-input"
                placeholder="City, State"
                autoComplete="address-level2"
              />
            </div>

            <div className="form-group">
              <label htmlFor="reg-role">Account Role</label>
              <select
                id="reg-role"
                value={formData.role}
                onChange={update('role')}
                className="form-select"
              >
                <option value="user">User (Request Services)</option>
                <option value="volunteer">Volunteer (Provide Services)</option>
              </select>
            </div>

            <button
              type="submit"
              className="btn btn-primary w-full btn-lg"
              style={{ marginTop: 8 }}
            >
              Create Account
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: 24, fontSize: 13, color: 'var(--text-secondary)' }}>
            Already have an account?{' '}
            <button
              onClick={() => navigate('/login')}
              style={{ background: 'none', border: 'none', color: 'var(--accent-purple-light)', cursor: 'pointer', fontWeight: 600, textDecoration: 'underline' }}
            >
              Sign In
            </button>
          </p>
        </section>
      </div>
    </main>
  );
}
