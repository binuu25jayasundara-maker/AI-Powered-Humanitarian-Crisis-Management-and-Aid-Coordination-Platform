import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Shield, Users, Key, Building2, FileText, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const SystemAdminDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
      {/* Top Banner / Title */}
      <div style={{ marginBottom: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
          <span className="badge badge-blue">
            <Shield size={13} /> Administration Console
          </span>
          <span className="badge badge-green">
            Full Governance
          </span>
        </div>
        <h1 style={{ fontSize: '26px', fontWeight: 800, color: 'var(--color-navy)', letterSpacing: '-0.02em' }}>
          System Administrator Dashboard
        </h1>
        <p style={{ fontSize: '14px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
          Welcome back, <strong>{user?.fullName || 'Administrator'}</strong>! Central administration hub for user security, RBAC policies, multi-agency organizations, and audit trails.
        </p>
      </div>

      {/* Main Content Area: Base Interface Structure */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
        {/* Left Column: Primary Management Cards */}
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
              <Shield size={22} />
            </div>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-navy)' }}>
                System Administration Workspace
              </h2>
              <p style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                Role: System Administrator · Central Governance Interface
              </p>
            </div>
          </div>

          <div style={{
            padding: '24px',
            backgroundColor: '#f8fafc',
            borderRadius: 'var(--radius-md)',
            border: '1px dashed var(--color-border)',
            marginBottom: '20px'
          }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
              Administration Quick Navigation
            </h3>
            <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '16px', lineHeight: '1.5' }}>
              Select an administrative module below or use the sidebar navigation to manage security, users, and audit records.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <button
                onClick={() => navigate('/admin/users')}
                style={{
                  backgroundColor: '#ffffff',
                  border: '1px solid var(--color-border)',
                  color: 'var(--color-navy)',
                  padding: '12px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: '13px',
                  textAlign: 'left'
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Users size={16} color="var(--color-blue-primary)" /> User Management
                </span>
                <ArrowRight size={14} color="#94a3b8" />
              </button>

              <button
                onClick={() => navigate('/admin/roles')}
                style={{
                  backgroundColor: '#ffffff',
                  border: '1px solid var(--color-border)',
                  color: 'var(--color-navy)',
                  padding: '12px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: '13px',
                  textAlign: 'left'
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Key size={16} color="var(--color-blue-primary)" /> Roles & Permissions
                </span>
                <ArrowRight size={14} color="#94a3b8" />
              </button>

              <button
                onClick={() => navigate('/admin/organizations')}
                style={{
                  backgroundColor: '#ffffff',
                  border: '1px solid var(--color-border)',
                  color: 'var(--color-navy)',
                  padding: '12px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: '13px',
                  textAlign: 'left'
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Building2 size={16} color="var(--color-blue-primary)" /> Organizations
                </span>
                <ArrowRight size={14} color="#94a3b8" />
              </button>

              <button
                onClick={() => navigate('/admin/audit')}
                style={{
                  backgroundColor: '#ffffff',
                  border: '1px solid var(--color-border)',
                  color: 'var(--color-navy)',
                  padding: '12px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: '13px',
                  textAlign: 'left'
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FileText size={16} color="var(--color-blue-primary)" /> Audit Log Viewer
                </span>
                <ArrowRight size={14} color="#94a3b8" />
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Status & Security Overview */}
        <div className="card">
          <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-navy)', marginBottom: '16px' }}>
            System Authority & Status
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid #f1f5f9' }}>
              <span style={{ color: 'var(--color-text-muted)' }}>Administrator:</span>
              <strong style={{ color: 'var(--color-navy)' }}>{user?.fullName || 'Admin User'}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid #f1f5f9' }}>
              <span style={{ color: 'var(--color-text-muted)' }}>System Role:</span>
              <span className="badge badge-blue">SystemAdmin</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid #f1f5f9' }}>
              <span style={{ color: 'var(--color-text-muted)' }}>Privilege Level:</span>
              <span className="badge badge-green">Super Administrator</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--color-text-muted)' }}>RBAC Policy:</span>
              <strong style={{ color: 'var(--color-blue-brand)' }}>Active (Zero Trust)</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
