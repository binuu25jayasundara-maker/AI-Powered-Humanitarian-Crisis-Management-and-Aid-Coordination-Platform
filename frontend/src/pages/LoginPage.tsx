import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Check, AlertTriangle, Shield } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState('citizen@resqnet.org');
  const [password, setPassword] = useState('Password@123');
  const [role, setRole] = useState('Citizen');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const getDashboardPath = (userRole?: string): string => {
    switch (userRole) {
      case 'Citizen': return '/dashboard/citizen';
      case 'SystemAdmin': return '/dashboard/admin';
      case 'EmergencyCoordinator': return '/dashboard/emergency-coordinator';
      case 'CaseManager': return '/dashboard/case-manager';
      case 'VolunteerCoordinator': return '/dashboard/volunteer-coordinator';
      case 'DonorOfficer': return '/dashboard/donor-officer';
      default: return '/dashboard/citizen';
    }
  };

  const handleRoleChange = (newRole: string) => {
    setRole(newRole);
    switch (newRole) {
      case 'SystemAdmin': setEmail('admin@resqnet.org'); break;
      case 'EmergencyCoordinator': setEmail('coordinator@resqnet.org'); break;
      case 'CaseManager': setEmail('casemanager@resqnet.org'); break;
      case 'VolunteerCoordinator': setEmail('volunteer.coord@resqnet.org'); break;
      case 'DonorOfficer': setEmail('donor.officer@resqnet.org'); break;
      default: setEmail('citizen@resqnet.org'); break;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const authUser = await login(email, password, role);
      const targetRole = authUser?.role || role;
      navigate(getDashboardPath(targetRole));
    } catch (err: any) {
      setError(err?.message || 'Failed to sign in. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#0B3B70',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px'
    }}>
      {/* Top Label Banner */}
      <div style={{
        width: '100%',
        maxWidth: '900px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        color: '#FFFFFF',
        marginBottom: '16px'
      }}>
        <div style={{ fontSize: '14px', fontWeight: 700 }}>1 · Login / Register</div>
        <div style={{
          backgroundColor: 'rgba(255,255,255,0.15)',
          color: '#FFFFFF',
          fontSize: '10px',
          fontWeight: 800,
          padding: '4px 14px',
          borderRadius: '999px',
          letterSpacing: '0.08em'
        }}>
          PUBLIC
        </div>
      </div>

      {/* Main Card */}
      <div style={{
        width: '100%',
        maxWidth: '900px',
        backgroundColor: '#FFFFFF',
        borderRadius: '20px',
        overflow: 'hidden',
        boxShadow: '0 30px 60px -12px rgba(0, 0, 0, 0.4)',
        display: 'grid',
        gridTemplateColumns: '1fr 1.2fr',
        minHeight: '510px'
      }}>
        {/* Left — Brand Panel */}
        <div style={{
          background: 'linear-gradient(145deg, #0B477F 0%, #0B3B70 100%)',
          color: '#FFFFFF',
          padding: '48px 40px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              background: 'rgba(255,255,255,0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Shield size={22} color="#FFFFFF" />
            </div>
            <h1 style={{ fontSize: '30px', fontWeight: 800, letterSpacing: '-0.02em', margin: 0, color: '#FFFFFF' }}>
              ResQnest<span style={{ color: '#12A86B' }}>.AI</span>
            </h1>
          </div>
          <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)', lineHeight: 1.6, margin: '0 0 36px', fontWeight: 500 }}>
            AI Powered Crisis Management &amp; Aid Coordination Platform
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {[
              'Request help in one tap',
              'Verified shelters & alerts',
              'Multilingual AI assistant',
              'Human-reviewed decisions'
            ].map((text) => (
              <div key={text} style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '13px', fontWeight: 600 }}>
                <div style={{
                  width: '22px',
                  height: '22px',
                  borderRadius: '50%',
                  background: 'rgba(18, 168, 107, 0.25)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <Check size={13} color="#12A86B" strokeWidth={3} />
                </div>
                <span style={{ color: 'rgba(255,255,255,0.85)' }}>{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right — Sign In Form */}
        <div style={{
          padding: '44px 48px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          backgroundColor: '#FFFFFF'
        }}>
          <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#102B5C', margin: '0 0 20px', letterSpacing: '-0.01em' }}>
            Sign in
          </h2>

          {/* Tab Switcher */}
          <div style={{ display: 'flex', gap: '6px', marginBottom: '26px', paddingBottom: '14px', borderBottom: '1px solid #EDF6FF' }}>
            <button
              type="button"
              style={{
                backgroundColor: '#0866C6',
                color: '#FFFFFF',
                padding: '7px 22px',
                borderRadius: '999px',
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
                color: '#526784',
                padding: '7px 22px',
                borderRadius: '999px',
                fontSize: '12px',
                fontWeight: 600
              }}
            >
              Register
            </button>
          </div>

          {error && (
            <div style={{
              backgroundColor: '#FFF0F1',
              color: '#DC3545',
              border: '1px solid rgba(220,53,69,0.25)',
              padding: '10px 14px',
              borderRadius: '10px',
              fontSize: '13px',
              marginBottom: '16px'
            }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <input
              type="email"
              required
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ padding: '11px 14px', fontSize: '13px', borderColor: '#D5E4F3' }}
            />
            <input
              type="password"
              required
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ padding: '11px 14px', fontSize: '13px', borderColor: '#D5E4F3' }}
            />
            <select
              value={role}
              onChange={(e) => handleRoleChange(e.target.value)}
              style={{ padding: '11px 14px', fontSize: '13px', color: '#102B5C', borderColor: '#D5E4F3' }}
            >
              <option value="Citizen">Role: Citizen</option>
              <option value="SystemAdmin">Role: System Administrator</option>
              <option value="EmergencyCoordinator">Role: Emergency Coordinator</option>
              <option value="CaseManager">Role: Incident / Case Manager</option>
              <option value="VolunteerCoordinator">Role: Volunteer and Donation Coordinator</option>
              <option value="DonorOfficer">Role: Donation and Volunteering</option>
            </select>

            <button
              type="submit"
              disabled={loading}
              style={{
                backgroundColor: '#0866C6',
                color: '#FFFFFF',
                padding: '13px',
                fontSize: '14px',
                fontWeight: 700,
                borderRadius: '10px',
                boxShadow: '0 4px 14px rgba(8, 102, 198, 0.25)',
                marginTop: '4px'
              }}
            >
              {loading ? 'Authenticating...' : 'Sign in'}
            </button>
          </form>

          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '12px',
            color: '#526784',
            margin: '16px 0 22px'
          }}>
            <a
              href="#forgot"
              style={{ color: '#0866C6' }}
              onClick={(e) => { e.preventDefault(); alert('Please contact system administrator (admin@resqnet.org) to reset credentials.'); }}
            >
              Forgot password?
            </a>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
              <span>Language: English ▾</span>
            </div>
          </div>

          {/* Emergency SOS */}
          <button
            type="button"
            onClick={() => navigate('/emergency-help')}
            style={{
              backgroundColor: '#DC3545',
              color: '#FFFFFF',
              padding: '13px',
              fontSize: '13px',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              borderRadius: '10px',
              boxShadow: '0 4px 14px rgba(220, 53, 69, 0.28)'
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
