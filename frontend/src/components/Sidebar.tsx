import React from 'react';
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
  Gift
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Sidebar: React.FC = () => {
  const { user } = useAuth();

  const getNavItemsForRole = (role?: string) => {
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
          { name: 'Public Emergency Help', path: '/emergency-help', icon: AlertTriangle }
        ];
      case 'DonorOfficer':
        return [
          { name: 'Donation and Volunteering Dashboard', path: '/dashboard/donor-officer', icon: DollarSign },
          { name: 'Emergency Help Hub', path: '/emergency-help', icon: AlertTriangle }
        ];
      case 'VolunteerCoordinator':
        return [
          { name: 'Volunteer & Donation Coordinator Dashboard', path: '/dashboard/volunteer-coordinator', icon: HeartHandshake },
          { name: 'Volunteer Roster & Tasks', path: '/volunteers', icon: Users },
          { name: 'Communication Center', path: '/communications', icon: MessageSquare },
          { name: 'Emergency Help Hub', path: '/emergency-help', icon: AlertTriangle }
        ];
      case 'EmergencyCoordinator':
        return [
          { name: 'Coordinator Dashboard', path: '/dashboard/emergency-coordinator', icon: Radio },
          { name: 'Emergency Distress Hub', path: '/emergency-help', icon: AlertTriangle }
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
      width: '240px',
      backgroundColor: '#ffffff',
      borderRight: '1px solid var(--color-border)',
      minHeight: 'calc(100vh - 65px)',
      padding: '24px 16px',
      display: 'flex',
      flexDirection: 'column',
      gap: '8px'
    }}>
      <div style={{ padding: '0 8px 16px', borderBottom: '1px solid #f1f5f9', marginBottom: '8px' }}>
        <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Logged In As
        </div>
        <div style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a', marginTop: '4px' }}>
          {user?.fullName || 'Guest User'}
        </div>
        <div style={{ fontSize: '12px', color: '#3b82f6', fontWeight: 600 }}>
          {user?.role || 'Citizen'}
        </div>
      </div>

      <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 14px',
                borderRadius: 'var(--radius-md)',
                color: isActive ? '#1d4ed8' : '#475569',
                backgroundColor: isActive ? '#eff6ff' : 'transparent',
                fontWeight: isActive ? 700 : 500,
                fontSize: '13px',
                textDecoration: 'none',
                borderLeft: isActive ? '4px solid #2563eb' : '4px solid transparent',
                transition: 'all 0.15s ease'
              })}
            >
              <Icon size={18} />
              <span>{item.name}</span>
            </NavLink>
          );
        })}
      </nav>

      <div style={{ marginTop: 'auto', padding: '16px 12px', background: '#f8fafc', borderRadius: 'var(--radius-md)', border: '1px solid #e2e8f0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#0f172a', fontWeight: 700, fontSize: '12px' }}>
          <ShieldCheck size={16} color="#10b981" /> RBAC Policy Active
        </div>
        <p style={{ fontSize: '11px', color: '#64748b', margin: '4px 0 0' }}>
          Unified Member 1 + Member 6 Platform.
        </p>
      </div>
    </aside>
  );
};
