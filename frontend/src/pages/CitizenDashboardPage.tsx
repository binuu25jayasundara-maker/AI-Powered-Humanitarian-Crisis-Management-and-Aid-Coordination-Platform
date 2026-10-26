import React from 'react';
import { useAuth } from '../context/AuthContext';
import { User, AlertTriangle, ShieldCheck, Heart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const CitizenDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
      {/* Top Banner / Title */}
      <div style={{ marginBottom: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
          <span className="badge badge-blue">
            <User size={13} /> Citizen Portal
          </span>
          <span className="badge badge-green">
            <ShieldCheck size={13} /> Active Session
          </span>
        </div>
        <h1 style={{ fontSize: '26px', fontWeight: 800, color: 'var(--color-navy)', letterSpacing: '-0.02em' }}>
          Citizen Dashboard
        </h1>
        <p style={{ fontSize: '14px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
          Welcome back, <strong>{user?.fullName || 'Citizen'}</strong>! Access community disaster alerts, request emergency relief, and track aid assistance status.
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
              <Heart size={22} />
            </div>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-navy)' }}>
                Citizen Services & Relief Portal
              </h2>
              <p style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                Role: Citizen · Interface Structure Placeholder
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
              Citizen Content Area
            </h3>
            <p style={{ fontSize: '13px', color: '#64748b', maxWidth: '480px', margin: '0 auto 20px', lineHeight: '1.6' }}>
              This is the dedicated dashboard interface structure established for the Citizen role. Citizen assistance modules, aid requests, and relief delivery tracking will be integrated here.
            </p>
            <button
              onClick={() => navigate('/emergency-help')}
              style={{
                backgroundColor: 'var(--color-red-danger)',
                color: '#ffffff',
                padding: '10px 20px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '13px',
                fontWeight: 700
              }}
            >
              <AlertTriangle size={16} /> Request Emergency Assistance
            </button>
          </div>
        </div>

        {/* Right Column: Account Status Placeholder */}
        <div className="card">
          <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-navy)', marginBottom: '16px' }}>
            Profile & Session Info
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid #f1f5f9' }}>
              <span style={{ color: 'var(--color-text-muted)' }}>Account Name:</span>
              <strong style={{ color: 'var(--color-navy)' }}>{user?.fullName || 'Citizen User'}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid #f1f5f9' }}>
              <span style={{ color: 'var(--color-text-muted)' }}>Email:</span>
              <span style={{ color: 'var(--color-navy)' }}>{user?.email || 'citizen@resqnet.org'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid #f1f5f9' }}>
              <span style={{ color: 'var(--color-text-muted)' }}>System Role:</span>
              <span className="badge badge-blue">Citizen</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--color-text-muted)' }}>Status:</span>
              <span className="badge badge-green">Verified</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
