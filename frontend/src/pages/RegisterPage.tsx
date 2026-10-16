import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Check, ArrowLeft } from 'lucide-react';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('Citizen');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setError(null);
    setLoading(true);

    try {
      await register(fullName, email, password, role);
      navigate('/admin/users');
    } catch (err: any) {
      setError(err?.message || 'Registration failed.');
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
      <div style={{
        maxWidth: '920px',
        width: '100%',
        margin: '0 auto 16px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        color: '#ffffff'
      }}>
        <div style={{ fontSize: '15px', fontWeight: 700 }}>
          1 · Login / Register
        </div>
        <div style={{
          backgroundColor: '#334155',
          color: '#cbd5e1',
          fontSize: '11px',
          fontWeight: 800,
          padding: '4px 14px',
          borderRadius: 'var(--radius-full)'
        }}>
          PUBLIC
        </div>
      </div>

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
        {/* Left Side */}
        <div style={{
          background: 'linear-gradient(145deg, #1d4ed8 0%, #1e3a8a 100%)',
          color: '#ffffff',
          padding: '48px 40px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center'
        }}>
          <h1 style={{ fontSize: '34px', fontWeight: 800, margin: '0 0 10px', color: '#ffffff' }}>
            ResQnet.AI
          </h1>
          <p style={{ fontSize: '13px', color: '#bfdbfe', margin: '0 0 36px', fontWeight: 500 }}>
            Join the national humanitarian disaster response network.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '13px', fontWeight: 600 }}>
              <Check size={16} color="#60a5fa" strokeWidth={3} />
              <span>Multi-agency coordination</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '13px', fontWeight: 600 }}>
              <Check size={16} color="#60a5fa" strokeWidth={3} />
              <span>Role-based verified credentials</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '13px', fontWeight: 600 }}>
              <Check size={16} color="#60a5fa" strokeWidth={3} />
              <span>Real-time dispatch and alerts</span>
            </div>
          </div>
        </div>

        {/* Right Side */}
        <div style={{
          padding: '40px 44px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          backgroundColor: '#ffffff'
        }}>
          <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', margin: '0 0 18px' }}>
            Register Account
          </h2>

          <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
            <button
              type="button"
              onClick={() => navigate('/login')}
              style={{
                backgroundColor: 'transparent',
                color: '#64748b',
                padding: '6px 20px',
                borderRadius: 'var(--radius-full)',
                fontSize: '12px',
                fontWeight: 600
              }}
            >
              Sign in
            </button>
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
              Register
            </button>
          </div>

          {error && (
            <div style={{ backgroundColor: '#fef2f2', color: '#b91c1c', padding: '10px 14px', borderRadius: 'var(--radius-md)', fontSize: '12px', marginBottom: '14px' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <input
              type="text"
              required
              placeholder="Full Name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
            <input
              type="email"
              required
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <input
              type="password"
              required
              placeholder="Password (min 6 characters)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <input
              type="password"
              required
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
            >
              <option value="Citizen">Role: Citizen</option>
              <option value="VolunteerCoordinator">Role: Volunteer Coordinator</option>
              <option value="DonorOfficer">Role: Donor Officer</option>
              <option value="CaseManager">Role: Incident / Case Manager</option>
              <option value="EmergencyCoordinator">Role: Emergency Coordinator</option>
              <option value="SystemAdmin">Role: System Administrator</option>
            </select>

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
                marginTop: '8px'
              }}
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
