import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { User, Organization } from '../types';
import { Users, UserPlus, Search, ShieldCheck, CheckCircle2, XCircle } from 'lucide-react';

export const UsersAdminPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    const data = await api.getUsers();
    setUsers(data);
    setLoading(false);
  };

  const handleToggleStatus = async (id: string) => {
    await api.toggleUserStatus(id);
    loadUsers();
  };

  const filtered = users.filter((u) => {
    const matchesSearch = u.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          u.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--color-navy)' }}>
            User Administration & RBAC
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
            Manage authorized platform personnel, roles, status, and multi-agency affiliation.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="card" style={{ padding: '16px 20px', marginBottom: '20px', display: 'flex', gap: '16px', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
          <Search size={18} color="#94a3b8" />
          <input
            type="text"
            placeholder="Search users by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ border: 'none', padding: '8px 0', fontSize: '13px', outline: 'none' }}
          />
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            style={{ width: 'auto', fontSize: '13px', padding: '8px 12px' }}
          >
            <option value="ALL">All Roles</option>
            <option value="SystemAdmin">System Administrator</option>
            <option value="EmergencyCoordinator">Emergency Coordinator</option>
            <option value="CaseManager">Case Manager</option>
            <option value="VolunteerCoordinator">Volunteer Coordinator</option>
            <option value="DonorOfficer">Donor Officer</option>
            <option value="Citizen">Citizen</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
          <thead>
            <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid var(--color-border)' }}>
              <th style={{ padding: '14px 20px', color: '#64748b', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase' }}>User</th>
              <th style={{ padding: '14px 20px', color: '#64748b', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase' }}>Assigned Role</th>
              <th style={{ padding: '14px 20px', color: '#64748b', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase' }}>Organization</th>
              <th style={{ padding: '14px 20px', color: '#64748b', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase' }}>Status</th>
              <th style={{ padding: '14px 20px', color: '#64748b', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase' }}>Last Active</th>
              <th style={{ padding: '14px 20px', color: '#64748b', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} style={{ padding: '30px', textAlign: 'center', color: '#94a3b8' }}>
                  Loading users...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: '30px', textAlign: 'center', color: '#94a3b8' }}>
                  No matching user records found.
                </td>
              </tr>
            ) : (
              filtered.map((u) => (
                <tr key={u.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '16px 20px' }}>
                    <div style={{ fontWeight: 700, color: 'var(--color-navy)' }}>{u.fullName}</div>
                    <div style={{ fontSize: '12px', color: '#64748b' }}>{u.email}</div>
                  </td>
                  <td style={{ padding: '16px 20px' }}>
                    <span className={`badge ${u.role === 'SystemAdmin' ? 'badge-red' : u.role === 'EmergencyCoordinator' ? 'badge-blue' : 'badge-green'}`}>
                      {u.role}
                    </span>
                  </td>
                  <td style={{ padding: '16px 20px', color: '#475569' }}>
                    {u.organizationName || 'Direct / Public'}
                  </td>
                  <td style={{ padding: '16px 20px' }}>
                    {u.isActive ? (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#16a34a', fontWeight: 600, fontSize: '12px' }}>
                        <CheckCircle2 size={14} /> Active
                      </span>
                    ) : (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#dc2626', fontWeight: 600, fontSize: '12px' }}>
                        <XCircle size={14} /> Deactivated
                      </span>
                    )}
                  </td>
                  <td style={{ padding: '16px 20px', color: '#64748b', fontSize: '12px' }}>
                    {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Never'}
                  </td>
                  <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                    <button
                      onClick={() => handleToggleStatus(u.id)}
                      style={{
                        padding: '6px 12px',
                        fontSize: '12px',
                        backgroundColor: u.isActive ? '#fee2e2' : '#dcfce7',
                        color: u.isActive ? '#dc2626' : '#15803d',
                        borderRadius: 'var(--radius-sm)'
                      }}
                    >
                      {u.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
