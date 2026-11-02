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
  LucideIcon,
  Package,
  ShieldAlert,
  Home,
  MapPin,
  Map
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

// Resources, Shelters & Maps module navigation
const resourcesSheltersNav: NavItem[] = [
  { name: 'Resources & Logistics', path: '/resources', icon: Package, section: 'Resources & Shelters' },
  { name: 'Allocation History', path: '/resources/allocations', icon: ShieldAlert },
  { name: 'Shelter Management', path: '/shelters', icon: Home },
  { name: 'Map & Shelters', path: '/map/shelters', icon: MapPin },
  { name: 'Operational Map', path: '/operational-map', icon: Map },
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
          ...resourcesSheltersNav,
          ...coordinationNav('/dashboard/emergency-coordinator')
        ];
      case 'DonorOfficer':
        return [
          { name: 'Donation & Volunteering', path: '/dashboard/donor-officer', icon: DollarSign },
          { name: 'Donors & Campaigns', path: '/campaigns', icon: BookOpen },
          { name: 'Map & Shelters', path: '/map/shelters', icon: MapPin },
          { name: 'Emergency Help Hub', path: '/emergency-help', icon: AlertTriangle }
        ];
      case 'VolunteerCoordinator':
        return [
          { name: 'Volunteer & Donation Coordinator', path: '/dashboard/volunteer-coordinator', icon: HeartHandshake },
          { name: 'Volunteer Roster & Tasks', path: '/volunteers', icon: Users },
          { name: 'Communication Center', path: '/communications', icon: MessageSquare },
          { name: 'Map & Shelters', path: '/map/shelters', icon: MapPin },
          { name: 'Emergency Help Hub', path: '/emergency-help', icon: AlertTriangle }
        ];
      case 'EmergencyCoordinator':
        return [
          ...resourcesSheltersNav,
          ...coordinationNav('/dashboard/emergency-coordinator'),
          { name: 'Emergency Distress Hub', path: '/emergency-help', icon: AlertTriangle, section: 'Emergency' }
        ];
      case 'CaseManager':
        return [
          { name: 'Case Manager Dashboard', path: '/dashboard/case-manager', icon: ClipboardList },
          { name: 'Case Queue', path: '/coordination/cases', icon: Radio },
          { name: 'Shelter Management', path: '/shelters', icon: Home, section: 'Resources & Shelters' },
          { name: 'Map & Shelters', path: '/map/shelters', icon: MapPin },
          { name: 'Emergency Distress Queue', path: '/emergency-help', icon: AlertTriangle }
        ];
      case 'Citizen':
      default:
        return [
          { name: 'Citizen Dashboard', path: '/dashboard/citizen', icon: UserIcon },
          { name: 'Map & Shelters', path: '/map/shelters', icon: MapPin },
          { name: 'Request Emergency Help', path: '/emergency-help', icon: AlertTriangle }
        ];
    }
  };

  const navItems = getNavItemsForRole(user?.role);

  return (
    <aside style={{
      width: collapsed ? '70px' : '260px',
      backgroundColor: 'var(--color-navy)',
      color: '#ffffff',
      display: 'flex',
      flexDirection: 'column',
      transition: 'width 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
      borderRight: '1px solid rgba(255, 255, 255, 0.08)',
      position: 'relative',
      flexShrink: 0
    }}>
      {/* Sidebar Header */}
      <div style={{
        padding: collapsed ? '16px 12px' : '20px 16px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: collapsed ? 'center' : 'space-between'
      }}>
        {!collapsed && (
          <div>
            <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'rgba(255, 255, 255, 0.5)', fontWeight: 600, letterSpacing: '0.05em' }}>
              Portal Workspace
            </div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-sky-ice)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ShieldCheck size={14} />
              <span>{user?.role || 'Guest'}</span>
            </div>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          style={{
            background: 'rgba(255, 255, 255, 0.1)',
            border: 'none',
            color: '#ffffff',
            padding: '6px',
            borderRadius: 'var(--radius-sm)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer'
          }}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      {/* Navigation Links */}
      <nav style={{
        padding: '12px 8px',
        flex: 1,
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '4px'
      }}>
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
                gap: '12px',
                padding: collapsed ? '10px' : '10px 12px',
                borderRadius: 'var(--radius-md)',
                color: isActive ? '#ffffff' : 'rgba(255, 255, 255, 0.7)',
                backgroundColor: isActive ? 'var(--color-blue-brand)' : 'transparent',
                fontWeight: isActive ? 600 : 500,
                fontSize: '13px',
                textDecoration: 'none',
                transition: 'all 0.15s ease',
                justifyContent: collapsed ? 'center' : 'flex-start'
              })}
            >
              <Icon size={18} style={{ flexShrink: 0 }} />
              {!collapsed && (
                <>
                  <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {item.name}
                  </span>
                </>
              )}
            </NavLink>
            </React.Fragment>
          );
        })}
      </nav>

      {/* Collapsed Footer Profile pill */}
      <div style={{
        padding: '12px',
        borderTop: '1px solid rgba(255, 255, 255, 0.08)',
        fontSize: '11px',
        color: 'rgba(255, 255, 255, 0.5)',
        textAlign: collapsed ? 'center' : 'left'
      }}>
        {collapsed ? (
          <span title={user?.fullName || 'User'}>●</span>
        ) : (
          <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            <div style={{ fontWeight: 600, color: '#ffffff' }}>{user?.fullName || 'Active Session'}</div>
            <div style={{ fontSize: '10px', color: 'rgba(255, 255, 255, 0.4)' }}>{user?.organizationName || 'ResQnet Platform'}</div>
          </div>
        )}
      </div>
    </aside>
  );
};
