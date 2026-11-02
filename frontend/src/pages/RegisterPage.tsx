import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Check, Shield } from 'lucide-react';

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) { setError('Passwords do not match.'); return; }
    setError(null);
    setLoading(true);
    try {
      const authUser = await register(fullName, email, password, role);
      const targetRole = authUser?.role || role;
      navigate(getDashboardPath(targetRole));
    } catch (err: any) {
      setError(err?.message || 'Registration failed.');
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
        }}>PUBLIC</div>
      </div>

      {/* Main Card */}
      <div style={{
        width: '100%',
        maxWidth: '900px',
        backgroundColor: '#FFFFFF',
        borderRadius: '20px',
        overflow: 'hidden',
        boxShadow: '0 30px 60px -12px rgba(0,0,0,0.4)',
        display: 'grid',
        gridTemplateColumns: '1fr 1.2fr',
        minHeight: '510px'
      }}>
        {/* Left Brand Panel */}
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
              width: '42px', height: '42px', borderRadius: '12px',
              background: 'rgba(255,255,255,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <Shield size={22} color="#FFFFFF" />
            </div>
            <h1 style={{ fontSize: '30px', fontWeight: 800, letterSpacing: '-0.02em', margin: 0 }}>
              ResQnest<span style={{ color: '#12A86B' }}>.AI</span>
            </h1>
          </div>
          <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)', lineHeight: 1.6, margin: '0 0 36px', fontWeight: 500 }}>
            Join the national humanitarian disaster response network.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {['Multi-agency coordination', 'Role-based verified credentials', 'Real-time dispatch and alerts'].map(text => (
              <div key={text} style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '13px', fontWeight: 600 }}>
                <div style={{
                  width: '22px', height: '22px', borderRadius: '50%',
                  background: 'rgba(18,168,107,0.25)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                }}>
                  <Check size={13} color="#12A86B" strokeWidth={3} />
                </div>
                <span style={{ color: 'rgba(255,255,255,0.85)' }}>{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right Form */}
        <div style={{ padding: '44px 48px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#102B5C', margin: '0 0 20px' }}>Register Account</h2>

          {/* Tab Switcher */}
          <div style={{ display: 'flex', gap: '6px', marginBottom: '24px', paddingBottom: '14px', borderBottom: '1px solid #EDF6FF' }}>
            <button type="button" onClick={() => navigate('/login')} style={{
              backgroundColor: 'transparent', color: '#526784', padding: '7px 22px',
              borderRadius: '999px', fontSize: '12px', fontWeight: 600
            }}>Sign in</button>
            <button type="button" style={{
              backgroundColor: '#0866C6', color: '#FFFFFF', padding: '7px 22px',
              borderRadius: '999px', fontSize: '12px', fontWeight: 700
            }}>Register</button>
          </div>

          {error && (
            <div style={{ backgroundColor: '#FFF0F1', color: '#DC3545', border: '1px solid rgba(220,53,69,0.25)', padding: '10px 14px', borderRadius: '10px', fontSize: '13px', marginBottom: '14px' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <input type="text" required placeholder="Full Name" value={fullName} onChange={e => setFullName(e.target.value)} style={{ borderColor: '#D5E4F3' }} />
            <input type="email" required placeholder="Email address" value={email} onChange={e => setEmail(e.target.value)} style={{ borderColor: '#D5E4F3' }} />
            <input type="password" required placeholder="Password (min 6 characters)" value={password} onChange={e => setPassword(e.target.value)} style={{ borderColor: '#D5E4F3' }} />
            <input type="password" required placeholder="Confirm Password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} style={{ borderColor: '#D5E4F3' }} />
            <select value={role} onChange={e => setRole(e.target.value)} style={{ borderColor: '#D5E4F3', color: '#102B5C' }}>
              <option value="Citizen">Role: Citizen</option>
              <option value="VolunteerCoordinator">Role: Volunteer and Donation Coordinator</option>
              <option value="DonorOfficer">Role: Donation and Volunteering</option>
              <option value="CaseManager">Role: Incident / Case Manager</option>
              <option value="EmergencyCoordinator">Role: Emergency Coordinator</option>
              <option value="SystemAdmin">Role: System Administrator</option>
            </select>
            <button type="submit" disabled={loading} style={{
              backgroundColor: '#12A86B', color: '#FFFFFF', padding: '13px',
              fontSize: '14px', fontWeight: 700, borderRadius: '10px',
              boxShadow: '0 4px 14px rgba(18, 168, 107, 0.25)', marginTop: '8px'
            }}>
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
