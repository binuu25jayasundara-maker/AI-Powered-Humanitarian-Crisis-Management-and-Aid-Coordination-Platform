import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Radio, AlertTriangle, ShieldCheck, MapPin, Package, Home, Map } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const EmergencyCoordinatorDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
      {/* Top Banner / Title */}
      <div style={{ marginBottom: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
          <span className="badge badge-amber">
            <Radio size={13} /> Crisis Command
          </span>
          <span className="badge badge-green">
            <ShieldCheck size={13} /> Coordinator Access
          </span>
        </div>
        <h1 style={{ fontSize: '26px', fontWeight: 800, color: 'var(--color-navy)', letterSpacing: '-0.02em' }}>
          Emergency Coordinator Dashboard
        </h1>
        <p style={{ fontSize: '14px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
          Welcome back, <strong>{user?.fullName || 'Emergency Coordinator'}</strong>! Crisis operations command center for high-level disaster triage, inter-agency escalation, and emergency dispatch.
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
              backgroundColor: 'var(--color-amber-soft)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--color-amber-dark)'
            }}>
              <Radio size={22} />
            </div>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-navy)' }}>
                Emergency Operations Workspace
              </h2>
              <p style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                Role: Emergency Coordinator · Interface Structure Placeholder
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
              Emergency Operations Content Area
            </h3>
            <p style={{ fontSize: '13px', color: '#64748b', maxWidth: '480px', margin: '0 auto 20px', lineHeight: '1.6' }}>
              This is the dedicated dashboard interface structure established for the Emergency Coordinator role. Multi-agency dispatch, live crisis maps, and high-level incident triage modules can be developed here.
            </p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                onClick={() => navigate('/resources')}
                style={{
                  backgroundColor: 'var(--color-primary-blue, #0866C6)',
                  color: '#ffffff',
                  padding: '9px 16px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '13px',
                  fontWeight: 700
                }}
              >
                <Package size={15} /> Resources &amp; Logistics
              </button>
              <button
                onClick={() => navigate('/shelters')}
                style={{
                  backgroundColor: 'var(--color-teal, #0d9488)',
                  color: '#ffffff',
                  padding: '9px 16px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '13px',
                  fontWeight: 700
                }}
              >
                <Home size={15} /> Shelter Management
              </button>
              <button
                onClick={() => navigate('/operational-map')}
                style={{
                  backgroundColor: '#7c3aed',
                  color: '#ffffff',
                  padding: '9px 16px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '13px',
                  fontWeight: 700
                }}
              >
                <Map size={15} /> Operational Map
              </button>
              <button
                onClick={() => navigate('/emergency-help')}
                style={{
                  backgroundColor: 'var(--color-red-danger)',
                  color: '#ffffff',
                  padding: '9px 16px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '13px',
                  fontWeight: 700
                }}
              >
                <AlertTriangle size={15} /> SOS Alerts
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Coordination Scope */}
        <div className="card">
          <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-navy)', marginBottom: '16px' }}>
            Operations Summary
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid #f1f5f9' }}>
              <span style={{ color: 'var(--color-text-muted)' }}>Coordinator:</span>
              <strong style={{ color: 'var(--color-navy)' }}>{user?.fullName || 'Coordinator'}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid #f1f5f9' }}>
              <span style={{ color: 'var(--color-text-muted)' }}>Agency:</span>
              <span style={{ color: 'var(--color-navy)' }}>{user?.organizationName || 'National Disaster Management Centre'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid #f1f5f9' }}>
              <span style={{ color: 'var(--color-text-muted)' }}>Role Authority:</span>
              <span className="badge badge-amber">EmergencyCoordinator</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--color-text-muted)' }}>Command Status:</span>
              <span className="badge badge-green">Operational</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
