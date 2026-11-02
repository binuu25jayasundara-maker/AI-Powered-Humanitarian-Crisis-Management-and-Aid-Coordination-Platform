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
        title: 'ResQnest.AI Citizen Portal',
        tagline: 'PUBLIC CRISIS SUPPORT · RELIEF TRACKING · AID DISPATCH',
        badge: 'CITIZEN'
      };
    case 'SystemAdmin':
      return {
        title: 'ResQnest.AI Administration',
        tagline: 'SECURITY · RBAC · AUDIT TRAILS · MULTI-AGENCY GOVERNANCE',
        badge: 'SYSTEM ADMINISTRATOR'
      };
    case 'EmergencyCoordinator':
      return {
        title: 'ResQnest.AI Emergency Operations',
        tagline: 'DISASTER COORDINATION · COMMAND & CRISIS RESPONSE',
        badge: 'EMERGENCY COORDINATOR'
      };
    case 'CaseManager':
      return {
        title: 'ResQnest.AI Incident & Case Management',
        tagline: 'CASE ASSESSMENT · TRIAGE · ASSISTANCE DISPATCH',
        badge: 'CASE MANAGER'
      };
    case 'VolunteerCoordinator':
      return {
        title: 'ResQnest.AI Volunteer & Donation Coordination',
        tagline: 'VOLUNTEER ROSTER · MOBILIZATION · DEPLOYMENT',
        badge: 'VOLUNTEER & DONATION COORDINATOR'
      };
    case 'DonorOfficer':
      return {
        title: 'ResQnest.AI Donation & Volunteering',
        tagline: 'DONOR ENGAGEMENT · CAMPAIGN AID · CONTRIBUTIONS',
        badge: 'DONOR OFFICER'
      };
    default:
      return {
        title: 'ResQnest.AI',
        tagline: 'AI Powered Crisis Management & Aid Coordination Platform',
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
      backgroundColor: '#0B477F',
      color: '#FFFFFF',
      height: '66px',
      padding: '0 28px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      boxShadow: '0 2px 8px rgba(11, 59, 112, 0.25)'
    }}>
      {/* Left: Logo + Title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <div style={{
          width: '38px',
          height: '38px',
          borderRadius: '10px',
          background: 'rgba(255,255,255,0.15)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0
        }}>
          <Shield size={20} color="#FFFFFF" />
        </div>
        <div>
          <h1 style={{
            fontSize: '16px',
            fontWeight: 800,
            margin: 0,
            color: '#FFFFFF',
            letterSpacing: '-0.01em'
          }}>
            {displayTitle}
          </h1>
          <p style={{
            fontSize: '10px',
            color: 'rgba(255,255,255,0.65)',
            margin: '2px 0 0',
            letterSpacing: '0.05em',
            fontWeight: 600
          }}>
            {displayTagline}
          </p>
        </div>
      </div>

      {/* Right: Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {/* System Online Indicator */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          fontSize: '12px',
          color: 'rgba(255,255,255,0.9)',
          fontWeight: 600,
          background: 'rgba(18, 168, 107, 0.18)',
          padding: '5px 12px',
          borderRadius: '999px',
          border: '1px solid rgba(18, 168, 107, 0.35)'
        }}>
          <span style={{
            width: '7px',
            height: '7px',
            backgroundColor: '#12A86B',
            borderRadius: '50%',
            display: 'inline-block',
            boxShadow: '0 0 6px #12A86B'
          }}></span>
          System online
        </div>

        {/* Language */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          fontSize: '12px',
          color: 'rgba(255,255,255,0.75)',
          cursor: 'pointer'
        }}>
          <Globe size={13} />
          <span>EN ▾</span>
        </div>

        {/* Role Badge */}
        <div style={{
          backgroundColor: '#12A86B',
          color: '#FFFFFF',
          fontSize: '10px',
          fontWeight: 800,
          padding: '5px 13px',
          borderRadius: '999px',
          letterSpacing: '0.04em',
          whiteSpace: 'nowrap'
        }}>
          {displayBadge}
        </div>

        {/* Logout */}
        {user && (
          <button
            onClick={logout}
            title="Sign out"
            style={{
              background: 'rgba(255,255,255,0.12)',
              color: 'rgba(255,255,255,0.85)',
              padding: '6px 12px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '12px',
              borderRadius: '8px',
              border: '1px solid rgba(255,255,255,0.15)',
              fontWeight: 600
            }}
          >
            <LogOut size={14} /> Logout
          </button>
        )}
      </div>
    </header>
  );
};
