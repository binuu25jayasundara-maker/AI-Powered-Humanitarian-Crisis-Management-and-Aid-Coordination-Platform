import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  Users,
  Key,
  Building2,
  FileText,
  AlertTriangle,
  ShieldCheck,
  LayoutDashboard,
  HeartHandshake,
  DollarSign,
  Radio,
  ClipboardList,
  User as UserIcon,
  MessageSquare,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  CalendarClock,
  Handshake,
  BarChart3,
  BrainCircuit,
  ScrollText,
  LucideIcon
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface NavItem {
  name: string;
  path: string;
  icon: LucideIcon;
  section?: string;
}

// Coordination & Governance module navigation (shared by EmergencyCoordinator and SystemAdmin)
const coordinationNav = (dashboardPath: string): NavItem[] => [
  { name: 'Coordinator Dashboard', path: dashboardPath, icon: Radio, section: 'Coordination' },
  { name: 'Case Queue', path: '/coordination/cases', icon: ClipboardList },
  { name: 'Crisis Events', path: '/coordination/events', icon: CalendarClock },
  { name: 'Partner Coordination', path: '/coordination/partners', icon: Handshake },
  { name: 'Reports', path: '/coordination/reports', icon: BarChart3 },
  { name: 'AI Review Queue', path: '/governance/ai-review', icon: BrainCircuit, section: 'Governance' },
  { name: 'AI Decision Log', path: '/governance/ai-decisions', icon: ScrollText }
];

export const Sidebar: React.FC = () => {
  const { user } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  const getNavItemsForRole = (role?: string): NavItem[] => {
    switch (role) {
      case 'SystemAdmin':
        return [
          { name: 'Admin Dashboard', path: '/dashboard/admin', icon: LayoutDashboard },
          { name: 'User Management', path: '/admin/users', icon: Users },
          { name: 'Roles & Permissions', path: '/admin/roles', icon: Key },
          { name: 'Organizations', path: '/admin/organizations', icon: Building2 },
          { name: 'Audit Log Viewer', path: '/admin/audit', icon: FileText },
          { name: 'Volunteer Management', path: '/volunteers', icon: HeartHandshake },
          { name: 'Communication Center', path: '/communications', icon: MessageSquare },
          { name: 'Emergency Help', path: '/emergency-help', icon: AlertTriangle },
          ...coordinationNav('/dashboard/emergency-coordinator')
        ];
      case 'DonorOfficer':
        return [
          { name: 'Donation & Volunteering', path: '/dashboard/donor-officer', icon: DollarSign },
          { name: 'Donors & Campaigns', path: '/campaigns', icon: BookOpen },
          { name: 'Emergency Help Hub', path: '/emergency-help', icon: AlertTriangle }
        ];
      case 'VolunteerCoordinator':
        return [
          { name: 'Volunteer & Donation Coordinator', path: '/dashboard/volunteer-coordinator', icon: HeartHandshake },
          { name: 'Volunteer Roster & Tasks', path: '/volunteers', icon: Users },
          { name: 'Communication Center', path: '/communications', icon: MessageSquare },
          { name: 'Emergency Help Hub', path: '/emergency-help', icon: AlertTriangle }
        ];
      case 'EmergencyCoordinator':
        return [
          ...coordinationNav('/dashboard/emergency-coordinator'),
          { name: 'Emergency Distress Hub', path: '/emergency-help', icon: AlertTriangle, section: 'Emergency' }
        ];
      case 'CaseManager':
        return [
          { name: 'Case Manager Dashboard', path: '/dashboard/case-manager', icon: ClipboardList },
          { name: 'Emergency Distress Queue', path: '/emergency-help', icon: AlertTriangle }
        ];
      case 'Citizen':
      default:
        return [
          { name: 'Citizen Dashboard', path: '/dashboard/citizen', icon: UserIcon },
          { name: 'Request Emergency Help', path: '/emergency-help', icon: AlertTriangle }
        ];
    }
  };

  const navItems = getNavItemsForRole(user?.role);

  return (
    <aside style={{
      width: collapsed ? '64px' : '250px',
      minWidth: collapsed ? '64px' : '250px',
      backgroundColor: '#0B3B70',
      minHeight: 'calc(100vh - 66px)',
      padding: collapsed ? '20px 8px' : '20px 14px',
      display: 'flex',
      flexDirection: 'column',
      gap: '4px',
      transition: 'width 0.25s ease, min-width 0.25s ease',
      position: 'relative',
      zIndex: 10
    }}>

      {/* Logo */}
      {!collapsed && (
        <div style={{ padding: '4px 8px 18px', borderBottom: '1px solid rgba(255,255,255,0.12)', marginBottom: '10px' }}>
          <div style={{ fontSize: '20px', fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.02em' }}>
            ResQnest<span style={{ color: '#12A86B' }}>.AI</span>
          </div>
          <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.55)', fontWeight: 500, marginTop: '3px' }}>
            Unified Crisis Management Platform
          </div>
        </div>
      )}
      {collapsed && (
        <div style={{ display: 'flex', justifyContent: 'center', paddingBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.12)', marginBottom: '10px' }}>
          <span style={{ fontSize: '18px', fontWeight: 800, color: '#12A86B' }}>R</span>
        </div>
      )}

      {/* User Info */}
      {!collapsed && user && (
        <div style={{ padding: '10px 10px 14px', borderBottom: '1px solid rgba(255,255,255,0.10)', marginBottom: '10px' }}>
          <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Logged In As
          </div>
          <div style={{ fontSize: '13px', fontWeight: 700, color: '#FFFFFF', marginTop: '4px' }}>
            {user?.fullName || 'Guest User'}
          </div>
          <div style={{
            display: 'inline-block', marginTop: '4px', fontSize: '10px', fontWeight: 700,
            color: '#12A86B', background: 'rgba(18,168,107,0.15)', padding: '2px 8px',
            borderRadius: '999px', border: '1px solid rgba(18,168,107,0.3)'
          }}>
            {user?.role || 'Citizen'}
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: '3px', flex: 1 }}>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <React.Fragment key={item.path}>
              {item.section && !collapsed && (
                <div style={{
                  fontSize: '10px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
                  color: 'rgba(255,255,255,0.45)', padding: '12px 12px 4px'
                }}>
                  {item.section}
                </div>
              )}
              {item.section && collapsed && (
                <div style={{ height: '1px', background: 'rgba(255,255,255,0.12)', margin: '8px 6px' }} />
              )}
            <NavLink
              to={item.path}
              title={collapsed ? item.name : undefined}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: collapsed ? '0' : '11px',
                justifyContent: collapsed ? 'center' : 'flex-start',
                padding: collapsed ? '11px 0' : '10px 12px',
                borderRadius: '10px',
                color: isActive ? '#0866C6' : 'rgba(255,255,255,0.75)',
                backgroundColor: isActive ? '#EDF6FF' : 'transparent',
                fontWeight: isActive ? 700 : 500,
                fontSize: '13px',
                textDecoration: 'none',
                transition: 'all 0.15s ease',
                whiteSpace: 'nowrap',
                overflow: 'hidden'
              })}
            >
              {({ isActive }) => (
                <>
                  <Icon size={18} style={{ flexShrink: 0, color: isActive ? '#0866C6' : 'rgba(255,255,255,0.75)' }} />
                  {!collapsed && <span>{item.name}</span>}
                </>
              )}
            </NavLink>
            </React.Fragment>
          );
        })}
      </nav>

      {/* Bottom Status */}
      {!collapsed && (
        <div style={{
          marginTop: 'auto',
          padding: '12px',
          background: 'rgba(255,255,255,0.08)',
          borderRadius: '10px',
          border: '1px solid rgba(255,255,255,0.12)',
          marginBottom: '8px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#FFFFFF', fontWeight: 700, fontSize: '12px' }}>
            <ShieldCheck size={15} color="#12A86B" /> RBAC Policy Active
          </div>
          <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', margin: '4px 0 0', lineHeight: 1.4 }}>
            Unified Member 1 + Member 6 Platform.
          </p>
        </div>
      )}

      {/* Collapse Toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          width: '100%', padding: '8px',
          background: 'rgba(255,255,255,0.08)', borderRadius: '8px',
          color: 'rgba(255,255,255,0.6)', border: 'none', cursor: 'pointer',
          fontSize: '12px', gap: '6px', transition: 'background 0.2s'
        }}
      >
        {collapsed ? <ChevronRight size={16} /> : <><ChevronLeft size={16} /><span>Collapse</span></>}
      </button>
    </aside>
  );
};
