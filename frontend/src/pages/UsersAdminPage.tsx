import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { User, DeletedUserRecord } from '../types';
import { useAuth } from '../context/AuthContext';

const ROLES = [
  { value: '', label: 'All Roles' },
  { value: 'SystemAdmin', label: 'System Administrator' },
  { value: 'EmergencyCoordinator', label: 'Emergency Coordinator' },
  { value: 'CaseManager', label: 'Incident/Case Manager' },
  { value: 'VolunteerCoordinator', label: 'Volunteer and Donation Coordinator' },
  { value: 'DonorOfficer', label: 'Donation and Volunteering' },
  { value: 'Citizen', label: 'Citizen' },
];

function roleLabel(role: string) {
  return ROLES.find(r => r.value === role)?.label || role;
}

function roleBadgeColor(role: string) {
  const map: Record<string, string> = {
    SystemAdmin: '#dc2626',
    EmergencyCoordinator: '#ea580c',
    CaseManager: '#d97706',
    VolunteerCoordinator: '#16a34a',
    DonorOfficer: '#2563eb',
    Citizen: '#6b7280',
  };
  return map[role] || '#6b7280';
}

interface EditForm {
  fullName: string;
  email: string;
  phoneNumber: string;
  role: string;
}

const UsersAdminPage: React.FC = () => {
  const { user: currentUser } = useAuth();

  const [users, setUsers] = useState<User[]>([]);
  const [deletedHistory, setDeletedHistory] = useState<DeletedUserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Edit modal
  const [editTarget, setEditTarget] = useState<User | null>(null);
  const [editForm, setEditForm] = useState<EditForm>({ fullName: '', email: '', phoneNumber: '', role: '' });
  const [editError, setEditError] = useState('');
  const [editSaving, setEditSaving] = useState(false);

  // Delete dialog
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  const [deleteError, setDeleteError] = useState('');
  const [deleteInProgress, setDeleteInProgress] = useState(false);

  // Restore dialog
  const [restoreTarget, setRestoreTarget] = useState<DeletedUserRecord | null>(null);
  const [restoreError, setRestoreError] = useState('');
  const [restoreInProgress, setRestoreInProgress] = useState(false);

  // Section toggle
  const [showHistory, setShowHistory] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [usersData, historyData] = await Promise.all([api.getUsers(), api.getDeletedUsers()]);
      setUsers(usersData);
      setDeletedHistory(historyData);
    } catch {
      setError('Failed to load user data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filtered active users
  const filteredUsers = users.filter(u => {
    if (roleFilter && u.role !== roleFilter) return false;
    if (statusFilter === 'active' && !u.isActive) return false;
    if (statusFilter === 'inactive' && u.isActive) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return u.fullName.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
    }
    return true;
  });

  // --- Edit ---
  const openEdit = (u: User) => {
    setEditTarget(u);
    setEditForm({ fullName: u.fullName, email: u.email, phoneNumber: u.phoneNumber || '', role: u.role });
    setEditError('');
  };
  const closeEdit = () => { setEditTarget(null); setEditError(''); };
  const handleEditSave = async () => {
    if (!editTarget) return;
    setEditError('');
    if (!editForm.fullName.trim()) { setEditError('Full name is required.'); return; }
    if (!editForm.email.trim()) { setEditError('Email is required.'); return; }
    if (!editForm.role) { setEditError('Role is required.'); return; }
    setEditSaving(true);
    try {
      await api.editUser(editTarget.id, { fullName: editForm.fullName.trim(), email: editForm.email.trim(), phoneNumber: editForm.phoneNumber.trim() || undefined, role: editForm.role });
      closeEdit();
      await loadData();
    } catch (e: unknown) {
      setEditError(e instanceof Error ? e.message : 'Failed to save changes.');
    } finally {
      setEditSaving(false);
    }
  };

  // --- Delete ---
  const openDelete = (u: User) => {
    if (u.id === currentUser?.id) { alert('You cannot delete your own account.'); return; }
    setDeleteTarget(u);
    setDeleteError('');
  };
  const closeDelete = () => { setDeleteTarget(null); setDeleteError(''); };
  const handleDeleteConfirm = async () => {
    if (!deleteTarget || !currentUser) return;
    setDeleteInProgress(true);
    setDeleteError('');
    try {
      await api.deleteUser(deleteTarget.id, currentUser.email);
      closeDelete();
      await loadData();
    } catch (e: unknown) {
      setDeleteError(e instanceof Error ? e.message : 'Failed to delete user.');
    } finally {
      setDeleteInProgress(false);
    }
  };

  // --- Restore ---
  const openRestore = (r: DeletedUserRecord) => { setRestoreTarget(r); setRestoreError(''); };
  const closeRestore = () => { setRestoreTarget(null); setRestoreError(''); };
  const handleRestoreConfirm = async () => {
    if (!restoreTarget || !currentUser) return;
    setRestoreInProgress(true);
    setRestoreError('');
    try {
      await api.restoreUser(restoreTarget.userId, currentUser.email);
      closeRestore();
      await loadData();
    } catch (e: unknown) {
      setRestoreError(e instanceof Error ? e.message : 'Failed to restore user.');
    } finally {
      setRestoreInProgress(false);
    }
  };

  // --- Toggle Active ---
  const handleToggleStatus = async (id: string) => {
    await api.toggleUserStatus(id);
    await loadData();
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '1.6rem', fontWeight: 700, marginBottom: '8px', color: '#1e293b' }}>
        👥 User Management
      </h1>
      <p style={{ color: '#64748b', marginBottom: '24px' }}>
        Manage registered users — edit profiles, manage account status, and view deletion history.
      </p>

      {error && (
        <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '8px', padding: '12px 16px', color: '#dc2626', marginBottom: '16px' }}>
          {error}
        </div>
      )}

      {/* Filters */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '20px', background: '#f8fafc', padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
        <input
          type="text"
          placeholder="Search by name or email..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          style={{ flex: 1, minWidth: '200px', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.875rem' }}
        />
        <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)}
          style={{ padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.875rem' }}>
          {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          style={{ padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.875rem' }}>
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {/* Active Users Table */}
      <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden', marginBottom: '28px' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 600, color: '#1e293b', margin: 0 }}>
            Active Users ({filteredUsers.length})
          </h2>
        </div>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>Loading users…</div>
        ) : filteredUsers.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>No users match the current filters.</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  {['Full Name', 'Email', 'Role', 'Organization', 'Status', 'Joined', 'Actions'].map(h => (
                    <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 600, color: '#475569', borderBottom: '1px solid #e2e8f0', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u, i) => (
                  <tr key={u.id} style={{ background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                    <td style={{ padding: '12px 16px', fontWeight: 600, color: '#1e293b' }}>{u.fullName}</td>
                    <td style={{ padding: '12px 16px', color: '#475569' }}>{u.email}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ background: roleBadgeColor(u.role), color: '#fff', borderRadius: '4px', padding: '2px 8px', fontSize: '0.75rem', fontWeight: 600 }}>
                        {roleLabel(u.role)}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', color: '#64748b' }}>{u.organizationName || '—'}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <button
                        onClick={() => handleToggleStatus(u.id)}
                        disabled={u.id === currentUser?.id}
                        title={u.id === currentUser?.id ? 'Cannot change your own status' : 'Toggle status'}
                        style={{
                          background: u.isActive ? '#dcfce7' : '#fee2e2',
                          color: u.isActive ? '#16a34a' : '#dc2626',
                          border: 'none', borderRadius: '20px', padding: '3px 10px', fontSize: '0.75rem', fontWeight: 600, cursor: u.id === currentUser?.id ? 'not-allowed' : 'pointer'
                        }}>
                        {u.isActive ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td style={{ padding: '12px 16px', color: '#94a3b8', whiteSpace: 'nowrap' }}>
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          onClick={() => openEdit(u)}
                          style={{ background: '#dbeafe', color: '#1d4ed8', border: 'none', borderRadius: '6px', padding: '5px 12px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}>
                          ✏️ Edit
                        </button>
                        <button
                          onClick={() => openDelete(u)}
                          disabled={u.id === currentUser?.id}
                          title={u.id === currentUser?.id ? 'Cannot delete your own account' : 'Delete user'}
                          style={{
                            background: u.id === currentUser?.id ? '#f1f5f9' : '#fee2e2',
                            color: u.id === currentUser?.id ? '#94a3b8' : '#dc2626',
                            border: 'none', borderRadius: '6px', padding: '5px 12px', fontSize: '0.8rem', fontWeight: 600,
                            cursor: u.id === currentUser?.id ? 'not-allowed' : 'pointer'
                          }}>
                          🗑️ Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Deleted Users History */}
      <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <div
          style={{ padding: '16px 20px', borderBottom: showHistory ? '1px solid #e2e8f0' : 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
          onClick={() => setShowHistory(h => !h)}>
          <h2 style={{ fontSize: '1rem', fontWeight: 600, color: '#1e293b', margin: 0 }}>
            🗂️ Deleted Users History ({deletedHistory.length})
          </h2>
          <span style={{ fontSize: '0.85rem', color: '#64748b' }}>{showHistory ? '▲ Collapse' : '▼ Expand'}</span>
        </div>

        {showHistory && (
          deletedHistory.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>No deletion history recorded yet.</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ background: '#fef2f2' }}>
                    {['Name', 'Email', 'Role', 'Organization', 'Deleted At', 'Deleted By', 'Status', 'Restored At', 'Restored By', 'Action'].map(h => (
                      <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 600, color: '#7f1d1d', borderBottom: '1px solid #fecaca', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {deletedHistory.map((r, i) => (
                    <tr key={r.id} style={{ background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                      <td style={{ padding: '11px 16px', fontWeight: 600, color: '#1e293b' }}>{r.fullName}</td>
                      <td style={{ padding: '11px 16px', color: '#475569' }}>{r.email}</td>
                      <td style={{ padding: '11px 16px' }}>
                        <span style={{ background: roleBadgeColor(r.role), color: '#fff', borderRadius: '4px', padding: '2px 8px', fontSize: '0.72rem', fontWeight: 600 }}>
                          {roleLabel(r.role)}
                        </span>
                      </td>
                      <td style={{ padding: '11px 16px', color: '#64748b' }}>{r.organizationName || '—'}</td>
                      <td style={{ padding: '11px 16px', color: '#94a3b8', whiteSpace: 'nowrap' }}>
                        {new Date(r.deletedAt).toLocaleString()}
                      </td>
                      <td style={{ padding: '11px 16px', color: '#64748b' }}>{r.deletedBy}</td>
                      <td style={{ padding: '11px 16px' }}>
                        <span style={{
                          background: r.restorationStatus === 'Restored' ? '#dcfce7' : '#fee2e2',
                          color: r.restorationStatus === 'Restored' ? '#15803d' : '#dc2626',
                          borderRadius: '20px', padding: '2px 10px', fontSize: '0.75rem', fontWeight: 600
                        }}>
                          {r.restorationStatus}
                        </span>
                      </td>
                      <td style={{ padding: '11px 16px', color: '#94a3b8', whiteSpace: 'nowrap' }}>
                        {r.restoredAt ? new Date(r.restoredAt).toLocaleString() : '—'}
                      </td>
                      <td style={{ padding: '11px 16px', color: '#64748b' }}>{r.restoredBy || '—'}</td>
                      <td style={{ padding: '11px 16px' }}>
                        {r.restorationStatus === 'Deleted' && (
                          <button
                            onClick={() => openRestore(r)}
                            style={{ background: '#dcfce7', color: '#15803d', border: 'none', borderRadius: '6px', padding: '5px 12px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}>
                            ♻️ Restore
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}
      </div>

      {/* ---- Edit Modal ---- */}
      {editTarget && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', borderRadius: '14px', padding: '32px', width: '480px', maxWidth: '95vw', boxShadow: '0 25px 50px rgba(0,0,0,0.25)' }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#1e293b', marginBottom: '20px' }}>✏️ Edit User</h2>

            <label style={labelStyle}>Full Name <span style={{ color: '#dc2626' }}>*</span></label>
            <input value={editForm.fullName} onChange={e => setEditForm(f => ({ ...f, fullName: e.target.value }))} style={inputStyle} placeholder="Full name" />

            <label style={labelStyle}>Email Address <span style={{ color: '#dc2626' }}>*</span></label>
            <input value={editForm.email} onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))} style={inputStyle} placeholder="Email address" type="email" />

            <label style={labelStyle}>Phone Number</label>
            <input value={editForm.phoneNumber} onChange={e => setEditForm(f => ({ ...f, phoneNumber: e.target.value }))} style={inputStyle} placeholder="Optional phone number" />

            <label style={labelStyle}>Role <span style={{ color: '#dc2626' }}>*</span></label>
            <select value={editForm.role} onChange={e => setEditForm(f => ({ ...f, role: e.target.value }))} style={{ ...inputStyle, background: '#f8fafc' }}>
              {ROLES.filter(r => r.value).map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>

            {editError && <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '6px', padding: '10px 12px', color: '#dc2626', fontSize: '0.85rem', marginTop: '8px' }}>{editError}</div>}

            <div style={{ display: 'flex', gap: '10px', marginTop: '20px', justifyContent: 'flex-end' }}>
              <button onClick={closeEdit} style={cancelBtnStyle} disabled={editSaving}>Cancel</button>
              <button onClick={handleEditSave} style={saveBtnStyle} disabled={editSaving}>
                {editSaving ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---- Delete Confirmation Dialog ---- */}
      {deleteTarget && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', borderRadius: '14px', padding: '32px', width: '440px', maxWidth: '95vw', boxShadow: '0 25px 50px rgba(0,0,0,0.25)' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '12px', textAlign: 'center' }}>⚠️</div>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#1e293b', textAlign: 'center', marginBottom: '12px' }}>Delete User</h2>
            <p style={{ color: '#475569', textAlign: 'center', marginBottom: '8px' }}>
              Are you sure you want to delete <strong>{deleteTarget.fullName}</strong>?
            </p>
            <p style={{ color: '#64748b', textAlign: 'center', fontSize: '0.85rem', marginBottom: '20px' }}>
              This user will be deactivated and cannot log in. The deletion is reversible — you can restore this account from the Deleted Users History.
            </p>
            {deleteError && <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '6px', padding: '10px 12px', color: '#dc2626', fontSize: '0.85rem', marginBottom: '12px' }}>{deleteError}</div>}
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button onClick={closeDelete} style={cancelBtnStyle} disabled={deleteInProgress}>Cancel</button>
              <button onClick={handleDeleteConfirm} disabled={deleteInProgress}
                style={{ background: '#dc2626', color: '#fff', border: 'none', borderRadius: '8px', padding: '9px 22px', fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer' }}>
                {deleteInProgress ? 'Deleting…' : '🗑️ Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---- Restore Confirmation Dialog ---- */}
      {restoreTarget && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', borderRadius: '14px', padding: '32px', width: '440px', maxWidth: '95vw', boxShadow: '0 25px 50px rgba(0,0,0,0.25)' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '12px', textAlign: 'center' }}>♻️</div>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#1e293b', textAlign: 'center', marginBottom: '12px' }}>Restore User</h2>
            <p style={{ color: '#475569', textAlign: 'center', marginBottom: '8px' }}>
              Restore account for <strong>{restoreTarget.fullName}</strong>?
            </p>
            <p style={{ color: '#64748b', textAlign: 'center', fontSize: '0.85rem', marginBottom: '20px' }}>
              This user will be reactivated and can log in again with their original credentials.
            </p>
            {restoreError && <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '6px', padding: '10px 12px', color: '#dc2626', fontSize: '0.85rem', marginBottom: '12px' }}>{restoreError}</div>}
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button onClick={closeRestore} style={cancelBtnStyle} disabled={restoreInProgress}>Cancel</button>
              <button onClick={handleRestoreConfirm} disabled={restoreInProgress}
                style={{ background: '#16a34a', color: '#fff', border: 'none', borderRadius: '8px', padding: '9px 22px', fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer' }}>
                {restoreInProgress ? 'Restoring…' : '♻️ Confirm Restore'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Shared inline style helpers
const labelStyle: React.CSSProperties = {
  display: 'block', fontWeight: 600, color: '#374151', fontSize: '0.85rem', marginBottom: '5px', marginTop: '14px'
};
const inputStyle: React.CSSProperties = {
  width: '100%', padding: '9px 12px', border: '1px solid #cbd5e1', borderRadius: '7px', fontSize: '0.9rem', boxSizing: 'border-box'
};
const cancelBtnStyle: React.CSSProperties = {
  background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '8px', padding: '9px 22px', fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer'
};
const saveBtnStyle: React.CSSProperties = {
  background: '#1d4ed8', color: '#fff', border: 'none', borderRadius: '8px', padding: '9px 22px', fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer'
};

export { UsersAdminPage };
export default UsersAdminPage;
