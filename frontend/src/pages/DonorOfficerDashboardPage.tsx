import React from 'react';
import { useAuth } from '../context/AuthContext';
import { DollarSign, ShieldCheck, Heart, TrendingUp } from 'lucide-react';

export const DonorOfficerDashboardPage: React.FC = () => {
  const { user } = useAuth();

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
      {/* Top Banner / Title */}
      <div style={{ marginBottom: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
          <span className="badge badge-green">
            <DollarSign size={13} /> Donor Operations
          </span>
          <span className="badge badge-blue">
            <ShieldCheck size={13} /> Financial Oversight
          </span>
        </div>
        <h1 style={{ fontSize: '26px', fontWeight: 800, color: 'var(--color-navy)', letterSpacing: '-0.02em' }}>
          Donation and Volunteering Dashboard
        </h1>
        <p style={{ fontSize: '14px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
          Welcome back, <strong>{user?.fullName || 'Donation and Volunteering'}</strong>! Dedicated workspace for donation intake, relief campaign tracking, in-kind supply verification, and donor communications.
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
              backgroundColor: 'var(--color-green-soft)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--color-green-dark)'
            }}>
              <DollarSign size={22} />
            </div>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-navy)' }}>
                Donor & Campaign Operations
              </h2>
              <p style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                Role: Donation and Volunteering · Interface Structure Placeholder
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
              Donor Relations Content Area
            </h3>
            <p style={{ fontSize: '13px', color: '#64748b', maxWidth: '480px', margin: '0 auto 20px', lineHeight: '1.6' }}>
              This is the dedicated dashboard interface structure established for the Donation and Volunteering role. Financial campaign metrics, in-kind supplies tracking, and donor receipting modules will be integrated here.
            </p>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--color-green-dark)', fontWeight: 600 }}>
              <TrendingUp size={16} /> Base Structure Ready for Donor Features
            </div>
          </div>
        </div>

        {/* Right Column: Donor Scope */}
        <div className="card">
          <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-navy)', marginBottom: '16px' }}>
            Officer Profile
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid #f1f5f9' }}>
              <span style={{ color: 'var(--color-text-muted)' }}>Officer:</span>
              <strong style={{ color: 'var(--color-navy)' }}>{user?.fullName || 'Donation and Volunteering'}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid #f1f5f9' }}>
              <span style={{ color: 'var(--color-text-muted)' }}>Organization:</span>
              <span style={{ color: 'var(--color-navy)' }}>{user?.organizationName || 'Sri Lanka Red Cross Society'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid #f1f5f9' }}>
              <span style={{ color: 'var(--color-text-muted)' }}>Role Authority:</span>
              <span className="badge badge-green">DonorOfficer</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--color-text-muted)' }}>Campaign Pipeline:</span>
              <span className="badge badge-green">Ready</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
