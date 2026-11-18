import React from 'react';
import { Shield, Key, Check } from 'lucide-react';

export const RolesAdminPage: React.FC = () => {
  const roles = [
    {
      name: 'SystemAdmin',
      description: 'Super-user access: manage users, system settings, global security policies, audit trails.',
      permissions: ['users.manage', 'roles.manage', 'orgs.manage', 'audit.view', 'cases.all', 'ai.all']
    },
    {
      name: 'EmergencyCoordinator',
      description: 'High-level crisis dispatch command: review, prioritise, escalate, approve AI decisions.',
      permissions: ['cases.manage', 'cases.approve', 'cases.escalate', 'ai.review', 'audit.view']
    },
    {
      name: 'CaseManager',
      description: 'Incident triage and verification: evaluate requests, inspect evidence, flag duplicates.',
      permissions: ['cases.view', 'cases.update', 'ai.review', 'evidence.verify']
    },
    {
      name: 'VolunteerCoordinator',
      description: 'Field workforce management: manage volunteer skill profiles, shifts, and task allocations.',
      permissions: ['volunteers.manage', 'tasks.assign', 'tasks.verify', 'schedule.manage']
    },
    {
      name: 'DonorOfficer',
      description: 'Financial & material aid oversight: track campaigns, record gifts, monitor expenditures.',
      permissions: ['donations.manage', 'campaigns.manage', 'reports.transparency', 'flags.review']
    },
    {
      name: 'Citizen',
      description: 'Public community member: submit aid requests, track status, view verified shelter alerts.',
      permissions: ['requests.submit', 'requests.track', 'alerts.view', 'ai.chat']
    }
  ];

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--color-navy)' }}>
          Roles & Permission Matrix (RBAC)
        </h2>
        <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
          Role-Based Access Control policies ensuring zero unauthorized humanitarian decision execution.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '20px' }}>
        {roles.map((r) => (
          <div key={r.name} className="card" style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Key size={18} color="#2563eb" />
                <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>{r.name}</h3>
              </div>
              <span className="badge badge-blue">System Role</span>
            </div>

            <p style={{ fontSize: '13px', color: '#64748b', lineHeight: 1.5, marginBottom: '20px', flex: 1 }}>
              {r.description}
            </p>

            <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '16px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '8px' }}>
                Granted Permissions
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {r.permissions.map((p) => (
                  <span
                    key={p}
                    style={{
                      backgroundColor: '#f1f5f9',
                      color: '#334155',
                      fontSize: '11px',
                      padding: '4px 8px',
                      borderRadius: 'var(--radius-sm)',
                      fontWeight: 600,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <Check size={12} color="#16a34a" /> {p}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
