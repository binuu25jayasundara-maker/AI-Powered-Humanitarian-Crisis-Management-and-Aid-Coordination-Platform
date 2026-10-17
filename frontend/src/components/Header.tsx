import React from 'react';
import { Bell, Search, ShieldCheck } from 'lucide-react';

export const Header: React.FC = () => {
  return (
    <header style={{
      height: '62px',
      backgroundColor: '#ffffff',
      borderBottom: '1px solid #e2e8f0',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 28px',
      position: 'sticky',
      top: 0,
      zIndex: 40
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', width: '380px' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          backgroundColor: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: '8px',
          padding: '8px 14px',
          width: '100%'
        }}>
          <Search size={16} color="#64748b" />
          <input
            type="text"
            placeholder="Search campaigns, volunteers, donors..."
            style={{
              border: 'none',
              padding: 0,
              backgroundColor: 'transparent',
              fontSize: '13px',
              outline: 'none',
              boxShadow: 'none'
            }}
          />
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          backgroundColor: '#ecfdf5',
          border: '1px solid #a7f3d0',
          padding: '5px 12px',
          borderRadius: '20px',
          fontSize: '12px',
          fontWeight: 600,
          color: '#065f46'
        }}>
          <ShieldCheck size={15} color="#059669" />
          <span>Outbox & Idempotency Active</span>
        </div>

        <button style={{
          background: 'none',
          position: 'relative',
          padding: '6px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '8px'
        }}>
          <Bell size={20} color="#475569" />
          <span style={{
            position: 'absolute',
            top: '4px',
            right: '4px',
            width: '8px',
            height: '8px',
            backgroundColor: '#ef4444',
            borderRadius: '50%'
          }} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            backgroundColor: '#1d4ed8',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
            fontSize: '14px'
          }}>
            VC
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>Volunteers & Donors</span>
            <span style={{ fontSize: '11px', color: '#64748b' }}>Member 6 Operations</span>
          </div>
        </div>
      </div>
    </header>
  );
};
