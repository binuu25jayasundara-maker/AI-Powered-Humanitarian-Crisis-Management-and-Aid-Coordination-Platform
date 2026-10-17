import React from 'react';
import { NavLink } from 'react-router-dom';
import { HeartHandshake, Users, Send, LayoutDashboard, Settings } from 'lucide-react';

export const Sidebar: React.FC = () => {
  const menuItems = [
    { name: 'Dashboard Overview', path: '/overview', icon: LayoutDashboard },
    { name: 'Donors & Campaigns', path: '/campaigns', icon: HeartHandshake, activeMatch: true },
    { name: 'Volunteer Management', path: '/volunteers', icon: Users },
    { name: 'Communication Center', path: '/communications', icon: Send },
    { name: 'Settings & Audit', path: '/settings', icon: Settings }
  ];

  return (
    <aside style={{
      width: '240px',
      backgroundColor: '#0a192f',
      minHeight: 'calc(100vh - 62px)',
      padding: '20px 14px',
      display: 'flex',
      flexDirection: 'column',
      gap: '6px',
      borderRight: '1px solid #1e293b'
    }}>
      <div style={{
        fontSize: '20px',
        fontWeight: 800,
        color: '#ffffff',
        padding: '6px 12px 18px',
        letterSpacing: '-0.02em',
        borderBottom: '1px solid #1e293b',
        marginBottom: '8px'
      }}>
        ResQnet.AI
      </div>

      <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.name}
              to={item.path}
              style={({ isActive }) => {
                const isSelected = isActive || (item.activeMatch && (window.location.pathname === '/' || window.location.pathname.startsWith('/campaigns')));
                return {
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  color: isSelected ? '#ffffff' : '#94a3b8',
                  backgroundColor: isSelected ? '#1d4ed8' : 'transparent',
                  fontWeight: isSelected ? 700 : 500,
                  fontSize: '13px',
                  textDecoration: 'none',
                  transition: 'all 0.15s ease'
                };
              }}
            >
              <Icon size={18} />
              <span>{item.name}</span>
            </NavLink>
          );
        })}
      </nav>

      <div style={{
        marginTop: 'auto',
        padding: '14px',
        background: '#112240',
        borderRadius: '10px',
        border: '1px solid #233554',
        fontSize: '11px',
        color: '#94a3b8'
      }}>
        <div style={{ color: '#38bdf8', fontWeight: 700, marginBottom: '4px' }}>Communication Channels</div>
        <div>Factory Pattern: Email, SMS, Push</div>
        <div style={{ marginTop: '2px', color: '#10b981' }}>Idempotency Outbox: OK</div>
      </div>
    </aside>
  );
};
