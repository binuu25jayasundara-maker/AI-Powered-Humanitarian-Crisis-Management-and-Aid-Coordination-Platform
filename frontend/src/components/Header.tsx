import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Shield, LogOut, Globe } from 'lucide-react';

interface HeaderProps {
  title?: string;
  tagline?: string;
  roleBadge?: string;
}

export const Header: React.FC<HeaderProps> = ({
  title = "ResQnet.AI Administration",
  tagline = "SECURITY · RBAC · AUDIT TRAILS · MULTI-AGENCY GOVERNANCE",
  roleBadge
}) => {
  const { user, logout } = useAuth();

  return (
    <header style={{
      backgroundColor: 'var(--color-navy)',
      color: '#ffffff',
      padding: '16px 28px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderBottom: '1px solid #1e293b'
    }}>
      <div>
        <h1 style={{ fontSize: '20px', fontWeight: 800, margin: 0, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Shield size={22} color="#3b82f6" /> {title}
        </h1>
        <p style={{ fontSize: '11px', color: '#94a3b8', margin: '3px 0 0', letterSpacing: '0.05em', fontWeight: 600 }}>
          {tagline}
        </p>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {/* System online indicator */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '12px',
          color: '#86efac',
          fontWeight: 600,
          background: 'rgba(16, 185, 129, 0.1)',
          padding: '6px 12px',
          borderRadius: 'var(--radius-full)',
          border: '1px solid rgba(16, 185, 129, 0.2)'
        }}>
          <span style={{
            width: '8px',
            height: '8px',
            backgroundColor: 'var(--color-green-success)',
            borderRadius: '50%',
            display: 'inline-block',
            boxShadow: '0 0 8px #10b981'
          }}></span>
          System online
        </div>

        {/* Language selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#cbd5e1', cursor: 'pointer' }}>
          <Globe size={14} />
          <span>EN ▾</span>
        </div>

        {/* Role Pill */}
        <div style={{
          backgroundColor: '#1e3a8a',
          color: '#93c5fd',
          fontSize: '11px',
          fontWeight: 800,
          padding: '6px 14px',
          borderRadius: 'var(--radius-full)',
          letterSpacing: '0.05em'
        }}>
          {roleBadge || (user ? user.role.toUpperCase() : 'PUBLIC')}
        </div>

        {user && (
          <button
            onClick={logout}
            title="Sign out"
            style={{
              background: 'transparent',
              color: '#94a3b8',
              padding: '6px 10px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '12px',
              borderRadius: 'var(--radius-md)'
            }}
          >
            <LogOut size={16} /> Logout
          </button>
        )}
      </div>
    </header>
  );
};
