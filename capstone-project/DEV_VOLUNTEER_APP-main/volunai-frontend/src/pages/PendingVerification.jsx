import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, LogOut, ArrowRight, CircleCheck } from 'lucide-react';

export default function PendingVerification() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // If somehow they get here but are verified, let them proceed
  if (user?.verification_status === 'VERIFIED') {
    return (
      <div style={{
          minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'linear-gradient(160deg, #F0FAF4 0%, #FFF 100%)', padding: '20px',
      }}>
        <div style={{ textAlign: 'center', background: 'white', padding: '40px', borderRadius: 'var(--radius-2xl)', boxShadow: 'var(--shadow-md)', maxWidth: 400 }}>
          <CircleCheck size={64} color="var(--mint)" style={{ margin: '0 auto 20px' }} />
          <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 12 }}>You're Verified!</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: 24 }}>Your account has been approved.</p>
          <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={() => navigate('/')}>
            Go to Dashboard <ArrowRight size={16} />
          </button>
        </div>
      </div>
    );
  }

  // If rejected
  if (user?.verification_status === 'REJECTED') {
      return (
        <div style={{
            minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'linear-gradient(160deg, #FFF0F0 0%, #FFF 100%)', padding: '20px',
        }}>
          <div style={{ textAlign: 'center', background: 'white', padding: '40px', borderRadius: 'var(--radius-2xl)', boxShadow: 'var(--shadow-md)', maxWidth: 460 }}>
            <div style={{ 
                width: 80, height: 80, borderRadius: '50%', background: '#FFF0F0', 
                display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' 
            }}>
                <ShieldAlert size={40} color="var(--rose)" />
            </div>
            <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 12, color: 'var(--text-primary)' }}>Verification Rejected</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: 20, fontSize: 15, lineHeight: 1.5 }}>
              Unfortunately, we could not verify your identity with the provided document.
            </p>
            {user?.rejection_reason && (
                <div style={{ background: '#FFF8F8', border: '1px solid #FFCECE', padding: '16px', borderRadius: 'var(--radius-md)', marginBottom: 24, textAlign: 'left' }}>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#C05050', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Reason:</p>
                    <p style={{ margin: 0, fontSize: 14, color: 'var(--text-primary)' }}>{user.rejection_reason}</p>
                </div>
            )}
            <div style={{ display: 'flex', gap: 12 }}>
                <button className="btn btn-ghost" style={{ flex: 1, justifyContent: 'center' }} onClick={handleLogout}>
                    <LogOut size={16} /> Sign Out
                </button>
                <button className="btn btn-primary" style={{ flex: 1, justifyContent: 'center', background: 'var(--rose)', borderColor: 'var(--rose)' }} onClick={() => navigate('/support')}>
                    Contact Support
                </button>
            </div>
          </div>
        </div>
      );
  }

  // Pending State (Default)
  return (
    <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(160deg, #F0F7FF 0%, #FFF 100%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '20px',
    }}>
      <div style={{
          background: 'white', borderRadius: 'var(--radius-2xl)',
          border: '1px solid var(--border-card)',
          boxShadow: '0 12px 48px rgba(0, 71, 171, 0.08)',
          maxWidth: 480, width: '100%',
          padding: '40px', textAlign: 'center',
      }}>
        
        <div style={{ 
            width: 88, height: 88, borderRadius: '50%', background: '#F0F7FF', 
            display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px',
            border: '8px solid white', boxShadow: '0 0 0 1px #CDE2FF'
        }}>
            <div className="animate-pulse">
                <ShieldAlert size={40} color="#0047AB" />
            </div>
        </div>

        <h1 style={{ fontSize: 26, fontWeight: 900, color: 'var(--text-primary)', marginBottom: 12, letterSpacing: '-0.5px' }}>
            Verification Pending
        </h1>
        
        <p style={{ fontSize: 15, color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: 32 }}>
            Thank you for registering! To ensure the safety of our community, an administrator is currently reviewing your government ID. 
            <br/><br/>
            This usually takes <strong>1–2 business days</strong>. We will notify you via email once you are approved.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <button className="btn btn-ghost" style={{ justifyContent: 'center', padding: '14px' }} onClick={() => window.location.reload()}>
                Recalculate Status
            </button>
            <button className="btn btn-ghost" style={{ justifyContent: 'center', padding: '14px', color: 'var(--text-muted)' }} onClick={handleLogout}>
                <LogOut size={16} /> Sign Out
            </button>
        </div>
      </div>
    </div>
  );
}
