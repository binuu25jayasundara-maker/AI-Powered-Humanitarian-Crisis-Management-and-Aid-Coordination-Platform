import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Shield, LogOut, Globe } from 'lucide-react';

interface HeaderProps {
  title?: string;
  tagline?: string;
  roleBadge?: string;
}

const getRoleHeaderInfo = (role?: string) => {
  switch (role) {
    case 'Citizen':
      return {
        title: 'ResQnet.AI Citizen Portal',
        tagline: 'PUBLIC CRISIS SUPPORT · RELIEF TRACKING · AID DISPATCH',
        badge: 'CITIZEN'
      };
    case 'SystemAdmin':
      return {
        title: 'ResQnet.AI Administration',
        tagline: 'SECURITY · RBAC · AUDIT TRAILS · MULTI-AGENCY GOVERNANCE',
        badge: 'SYSTEM ADMINISTRATOR'
      };
    case 'EmergencyCoordinator':
      return {
        title: 'ResQnet.AI Emergency Operations',
        tagline: 'DISASTER COORDINATION · COMMAND & CRISIS RESPONSE',
        badge: 'EMERGENCY COORDINATOR'
      };
    case 'CaseManager':
      return {
        title: 'ResQnet.AI Incident & Case Management',
        tagline: 'CASE ASSESSMENT · TRIAGE · ASSISTANCE DISPATCH',
        badge: 'CASE MANAGER'
      };
    case 'VolunteerCoordinator':
      return {
        title: 'ResQnet.AI Volunteer & Donation Coordination',
        tagline: 'VOLUNTEER ROSTER · DONATION MANAGEMENT · SCHEDULING & DEPLOYMENT',
        badge: 'VOLUNTEER AND DONATION COORDINATOR'
      };
    case 'DonorOfficer':
      return {
        title: 'ResQnet.AI Donation & Volunteering',
        tagline: 'DONATION INTAKE · VOLUNTEER REGISTRATION · AID CONTRIBUTIONS',
        badge: 'DONATION AND VOLUNTEERING'
      };
    default:
      return {
        title: 'ResQnet.AI Administration',
        tagline: 'SECURITY · RBAC · AUDIT TRAILS · MULTI-AGENCY GOVERNANCE',
        badge: 'PUBLIC'
      };
  }
};

export const Header: React.FC<HeaderProps> = ({
  title,
  tagline,
  roleBadge
}) => {
  const { user, logout } = useAuth();
  const roleDefaults = getRoleHeaderInfo(user?.role);

  const displayTitle = title || roleDefaults.title;
  const displayTagline = tagline || roleDefaults.tagline;
  const displayBadge = roleBadge || (user ? roleDefaults.badge : 'PUBLIC');

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
          <Shield size={22} color="#3b82f6" /> {displayTitle}
        </h1>
        <p style={{ fontSize: '11px', color: '#94a3b8', margin: '3px 0 0', letterSpacing: '0.05em', fontWeight: 600 }}>
          {displayTagline}
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
          {displayBadge}
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
