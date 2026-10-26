import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Users, HeartHandshake, ShieldCheck, Calendar } from 'lucide-react';

export const VolunteerCoordinatorDashboardPage: React.FC = () => {
  const { user } = useAuth();

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
      {/* Top Banner / Title */}
      <div style={{ marginBottom: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
          <span className="badge badge-blue">
            <Users size={13} /> Volunteer Operations
          </span>
          <span className="badge badge-green">
            <ShieldCheck size={13} /> Mobilization Coordinator
          </span>
        </div>
        <h1 style={{ fontSize: '26px', fontWeight: 800, color: 'var(--color-navy)', letterSpacing: '-0.02em' }}>
          Volunteer and Donation Coordinator Dashboard
        </h1>
        <p style={{ fontSize: '14px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
          Welcome back, <strong>{user?.fullName || 'Volunteer and Donation Coordinator'}</strong>! Central operational hub for volunteer recruitment, skills assessment, weekly availability schedules, and task mobilization.
        </p>
      </div>

      {/* Main Content Area: Base Interface Structure */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
        {/* Left Column: Primary Interface Container */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--color-blue-soft)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--color-blue-brand)'
            }}>
              <HeartHandshake size={22} />
            </div>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-navy)' }}>
                Volunteer Coordination Workspace
              </h2>
              <p style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                Role: Volunteer and Donation Coordinator · Interface Structure Placeholder
              </p>
            </div>
          </div>

          <div style={{
            padding: '32px 24px',
            backgroundColor: '#f8fafc',
            borderRadius: 'var(--radius-md)',
            border: '1px dashed var(--color-border)',
            textAlign: 'center'
          }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#334155', marginBottom: '8px' }}>
              Volunteer Mobilization Content Area
            </h3>
            <p style={{ fontSize: '13px', color: '#64748b', maxWidth: '480px', margin: '0 auto 20px', lineHeight: '1.6' }}>
              This is the dedicated dashboard interface structure established for the Volunteer and Donation Coordinator role. Volunteer roster management, shift scheduling, and AI-driven skill matching modules will be integrated here.
            </p>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--color-blue-primary)', fontWeight: 600 }}>
              <Calendar size={16} /> Base Structure Ready for Volunteer Features
            </div>
          </div>
        </div>

        {/* Right Column: Coordination Scope */}
        <div className="card">
          <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-navy)', marginBottom: '16px' }}>
            Coordinator Profile
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid #f1f5f9' }}>
              <span style={{ color: 'var(--color-text-muted)' }}>Coordinator:</span>
              <strong style={{ color: 'var(--color-navy)' }}>{user?.fullName || 'Volunteer and Donation Coordinator'}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid #f1f5f9' }}>
              <span style={{ color: 'var(--color-text-muted)' }}>Organization:</span>
              <span style={{ color: 'var(--color-navy)' }}>{user?.organizationName || 'Sri Lanka Red Cross Society'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid #f1f5f9' }}>
              <span style={{ color: 'var(--color-text-muted)' }}>Role Authority:</span>
              <span className="badge badge-blue">VolunteerCoordinator</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--color-text-muted)' }}>Roster Status:</span>
              <span className="badge badge-green">Ready</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
