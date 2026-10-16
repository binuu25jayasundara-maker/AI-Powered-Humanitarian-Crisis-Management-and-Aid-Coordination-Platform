import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Check, AlertTriangle, Shield, Globe } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState('admin@resqnet.org');
  const [password, setPassword] = useState('Password@123');
  const [role, setRole] = useState('Citizen');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleRoleChange = (newRole: string) => {
    setRole(newRole);
    // Auto-fill demo account based on role selection for instant ease of testing!
    switch (newRole) {
      case 'SystemAdmin':
        setEmail('admin@resqnet.org');
        break;
      case 'EmergencyCoordinator':
        setEmail('coordinator@resqnet.org');
        break;
      case 'CaseManager':
        setEmail('casemanager@resqnet.org');
        break;
      case 'VolunteerCoordinator':
        setEmail('volunteer.coord@resqnet.org');
        break;
      case 'DonorOfficer':
        setEmail('donor.officer@resqnet.org');
        break;
      default:
        setEmail('citizen@resqnet.org');
        break;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login(email, password, role);
      navigate('/admin/users');
    } catch (err: any) {
      setError(err?.message || 'Failed to sign in. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#0a192f',
      display: 'flex',
      flexDirection: 'column',
      padding: '24px'
    }}>
      {/* Top Banner Matching Screenshot */}
      <div style={{
        maxWidth: '920px',
        width: '100%',
        margin: '0 auto 16px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        color: '#ffffff'
      }}>
        <div style={{ fontSize: '15px', fontWeight: 700, letterSpacing: '0.02em' }}>
          1 · Login / Register
        </div>
        <div style={{
          backgroundColor: '#334155',
          color: '#cbd5e1',
          fontSize: '11px',
          fontWeight: 800,
          padding: '4px 14px',
          borderRadius: 'var(--radius-full)',
          letterSpacing: '0.05em'
        }}>
          PUBLIC
        </div>
      </div>

      {/* Main Split Authentication Card Matching Screenshot */}
      <div style={{
        maxWidth: '920px',
        width: '100%',
        margin: '0 auto',
        backgroundColor: '#ffffff',
        borderRadius: '20px',
        overflow: 'hidden',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.45)',
        display: 'grid',
        gridTemplateColumns: '1fr 1.15fr',
        minHeight: '520px'
      }}>
        {/* Left Side: Deep Blue Brand Panel */}
        <div style={{
          background: 'linear-gradient(145deg, #1d4ed8 0%, #1e3a8a 100%)',
          color: '#ffffff',
          padding: '48px 40px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center'
        }}>
          <h1 style={{
            fontSize: '34px',
            fontWeight: 800,
            letterSpacing: '-0.02em',
            margin: '0 0 10px',
            color: '#ffffff'
          }}>
            ResQnet.AI
          </h1>
          <p style={{
            fontSize: '13px',
            color: '#bfdbfe',
            lineHeight: 1.5,
            margin: '0 0 36px',
            fontWeight: 500
          }}>
            AI Powered Crisis Management & Aid Coordination Platform
          </p>

          {/* Bullet points with checkmarks */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '13px', fontWeight: 600 }}>
              <Check size={16} color="#60a5fa" strokeWidth={3} />
              <span>Request help in one tap</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '13px', fontWeight: 600 }}>
              <Check size={16} color="#60a5fa" strokeWidth={3} />
              <span>Verified shelters & alerts</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '13px', fontWeight: 600 }}>
              <Check size={16} color="#60a5fa" strokeWidth={3} />
              <span>Multilingual AI assistant</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '13px', fontWeight: 600 }}>
              <Check size={16} color="#60a5fa" strokeWidth={3} />
              <span>Human-reviewed decisions</span>
            </div>
          </div>
        </div>

        {/* Right Side: Sign In Form */}
        <div style={{
          padding: '40px 44px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          backgroundColor: '#ffffff'
        }}>
          <h2 style={{
            fontSize: '24px',
            fontWeight: 800,
            color: '#0f172a',
            margin: '0 0 18px',
            letterSpacing: '-0.01em'
          }}>
            Sign in
          </h2>

          {/* Tab Pill Switcher */}
          <div style={{
            display: 'flex',
            gap: '8px',
            marginBottom: '24px',
            borderBottom: '1px solid #f1f5f9',
            paddingBottom: '12px'
          }}>
            <button
              type="button"
              style={{
                backgroundColor: '#2563eb',
                color: '#ffffff',
                padding: '6px 20px',
                borderRadius: 'var(--radius-full)',
                fontSize: '12px',
                fontWeight: 700
              }}
            >
              Sign in
            </button>
            <button
              type="button"
              onClick={() => navigate('/register')}
              style={{
                backgroundColor: 'transparent',
                color: '#64748b',
                padding: '6px 20px',
                borderRadius: 'var(--radius-full)',
                fontSize: '12px',
                fontWeight: 600
              }}
            >
              Register
            </button>
          </div>

          {error && (
            <div style={{
              backgroundColor: '#fef2f2',
              color: '#b91c1c',
              border: '1px solid #fecaca',
              padding: '10px 14px',
              borderRadius: 'var(--radius-md)',
              fontSize: '12px',
              marginBottom: '16px'
            }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <input
                type="email"
                required
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ padding: '11px 14px', fontSize: '13px' }}
              />
            </div>

            <div>
              <input
                type="password"
                required
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ padding: '11px 14px', fontSize: '13px' }}
              />
            </div>

            <div>
              <select
                value={role}
                onChange={(e) => handleRoleChange(e.target.value)}
                style={{ padding: '11px 14px', fontSize: '13px', color: '#334155' }}
              >
                <option value="Citizen">Role: Citizen</option>
                <option value="SystemAdmin">Role: System Administrator</option>
                <option value="EmergencyCoordinator">Role: Emergency Coordinator</option>
                <option value="CaseManager">Role: Incident / Case Manager</option>
                <option value="VolunteerCoordinator">Role: Volunteer Coordinator</option>
                <option value="DonorOfficer">Role: Donor Officer</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                backgroundColor: '#2563eb',
                color: '#ffffff',
                padding: '12px',
                fontSize: '14px',
                fontWeight: 700,
                borderRadius: 'var(--radius-md)',
                boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)',
                marginTop: '6px'
              }}
            >
              {loading ? 'Authenticating...' : 'Sign in'}
            </button>
          </form>

          {/* Links Row */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '12px',
            color: '#64748b',
            margin: '18px 0 24px'
          }}>
            <a href="#forgot" onClick={(e) => { e.preventDefault(); alert('Please contact system administrator (admin@resqnet.org) to reset credentials.'); }}>
              Forgot password?
            </a>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
              <span>Language: English ▾</span>
            </div>
          </div>

          {/* Emergency SOS Button (Red with Triangle Warning Icon) */}
          <button
            type="button"
            onClick={() => navigate('/emergency-help')}
            style={{
              backgroundColor: '#dc2626',
              color: '#ffffff',
              padding: '13px',
              fontSize: '13px',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              borderRadius: 'var(--radius-md)',
              boxShadow: '0 4px 14px rgba(220, 38, 38, 0.3)'
            }}
          >
            <AlertTriangle size={16} />
            Emergency help without login
          </button>
        </div>
      </div>
    </div>
  );
};
