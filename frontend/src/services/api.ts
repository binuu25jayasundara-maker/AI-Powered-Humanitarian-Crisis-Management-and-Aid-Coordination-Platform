import { User, AuthResponse, Organization, Role, Permission, AuditEvent, ApiResponse, DeletedUserRecord } from '../types';

const API_BASE = 'http://localhost:5000/api';
const DELETED_USERS_KEY = 'resqnet_m1_deleted_users';

// In-memory mock storage for standalone evaluation
const MOCK_ORGS: Organization[] = [
  { id: '11111111-1111-1111-1111-111111111111', name: 'National Disaster Management Centre', code: 'DMC-LK', type: 'Government', contactEmail: 'ops@dmc.gov.lk', contactPhone: '+94 11 213 6136', address: 'Vidya Mawatha, Colombo 07', isVerified: true, memberCount: 14 },
  { id: '22222222-2222-2222-2222-222222222222', name: 'Sri Lanka Red Cross Society', code: 'SLRC', type: 'NGO', contactEmail: 'info@redcross.lk', contactPhone: '+94 11 269 1095', address: 'Dharmapala Mawatha, Colombo 07', isVerified: true, memberCount: 28 },
  { id: '33333333-3333-3333-3333-333333333333', name: 'Sarvodaya Shramadana Movement', code: 'SARVODAYA', type: 'NGO', contactEmail: 'relief@sarvodaya.org', contactPhone: '+94 11 265 5255', address: 'Rawatawatte Road, Moratuwa', isVerified: true, memberCount: 42 }
];

const MOCK_USERS: User[] = [
  { id: 'u-1', fullName: 'Platform Administrator', email: 'admin@resqnet.org', role: 'SystemAdmin', organizationName: 'National Disaster Management Centre', isActive: true, createdAt: '2026-10-01T08:00:00Z', lastLoginAt: '2026-10-13T10:15:00Z' },
  { id: 'u-2', fullName: 'Chaminda Silva', email: 'coordinator@resqnet.org', role: 'EmergencyCoordinator', organizationName: 'National Disaster Management Centre', isActive: true, createdAt: '2026-10-02T09:30:00Z', lastLoginAt: '2026-10-13T09:40:00Z' },
  { id: 'u-3', fullName: 'Nadeesha Perera', email: 'casemanager@resqnet.org', role: 'CaseManager', organizationName: 'National Disaster Management Centre', isActive: true, createdAt: '2026-10-03T11:00:00Z', lastLoginAt: '2026-10-13T08:20:00Z' },
  { id: 'u-4', fullName: 'Kasun Jayawardena', email: 'volunteer.coord@resqnet.org', role: 'VolunteerCoordinator', organizationName: 'Sri Lanka Red Cross Society', isActive: true, createdAt: '2026-10-04T12:00:00Z', lastLoginAt: '2026-10-12T17:10:00Z' },
  { id: 'u-5', fullName: 'Anura Fernando', email: 'donor.officer@resqnet.org', role: 'DonorOfficer', organizationName: 'Sri Lanka Red Cross Society', isActive: true, createdAt: '2026-10-05T14:30:00Z', lastLoginAt: '2026-10-13T07:55:00Z' },
  { id: 'u-6', fullName: 'Sunil Weerasinghe', email: 'citizen@resqnet.org', role: 'Citizen', organizationName: null, isActive: true, createdAt: '2026-10-06T15:00:00Z', lastLoginAt: '2026-10-13T11:05:00Z' }
];

const MOCK_AUDIT_LOGS: AuditEvent[] = [
  { id: 'aud-1', actorId: 'u-1', actorEmail: 'admin@resqnet.org', action: 'USER_CREATED', entityName: 'User', entityId: 'u-6', detailsJson: '{"email":"citizen@resqnet.org","role":"Citizen"}', ipAddress: '192.168.1.10', status: 'Success', createdAt: '2026-10-13T10:16:00Z' },
  { id: 'aud-2', actorId: 'u-2', actorEmail: 'coordinator@resqnet.org', action: 'AI_RECOMMENDATION_APPROVED', entityName: 'Case', entityId: 'Case #2341', detailsJson: '{"caseNumber":"#2341","action":"Approved","urgency":"High"}', ipAddress: '192.168.1.25', status: 'Success', createdAt: '2026-10-13T09:42:00Z' },
  { id: 'aud-3', actorId: 'u-4', actorEmail: 'volunteer.coord@resqnet.org', action: 'VOLUNTEER_TASK_ASSIGNED', entityName: 'VolunteerTask', entityId: 'VT-882', detailsJson: '{"volunteer":"Ruwan D.","task":"Distribute meals - Rivagama"}', ipAddress: '192.168.1.44', status: 'Success', createdAt: '2026-10-13T09:15:00Z' },
  { id: 'aud-4', actorId: 'u-5', actorEmail: 'donor.officer@resqnet.org', action: 'DONATION_RECORDED', entityName: 'Donation', entityId: 'DON-1044', detailsJson: '{"donor":"Org X","amount":300000,"flag":"Urgent"}', ipAddress: '192.168.1.60', status: 'Success', createdAt: '2026-10-13T08:30:00Z' },
  { id: 'aud-5', actorId: 'system', actorEmail: 'system@resqnet.org', action: 'SYSTEM_INITIALIZED', entityName: 'System', entityId: 'V1.0', detailsJson: '{"status":"Production baseline seeded"}', ipAddress: '127.0.0.1', status: 'Success', createdAt: '2026-10-13T08:00:00Z' }
];

export const api = {
  // Authentication
  async login(email: string, password: string, role?: string): Promise<AuthResponse> {
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, role })
      });
      if (res.ok) {
        const json: ApiResponse<AuthResponse> = await res.json();
        return json.data;
      }
    } catch {
      // Backend offline: use mock credentials
    }

    // Mock fallback
    const matched = MOCK_USERS.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (matched) {
      if (matched.isDeleted) {
        throw new Error('This account has been deleted. Please contact an administrator.');
      }
      const effectiveUser = role ? { ...matched, role: role } : matched;
      return {
        token: 'mock-jwt-token-' + matched.id,
        refreshToken: 'mock-refresh-token-' + matched.id,
        expiresAt: new Date(Date.now() + 7200000).toISOString(),
        user: effectiveUser
      };
    }

    // Default mock user if not matched
    const defaultUser: User = {
      id: 'mock-user-id',
      fullName: email.split('@')[0],
      email: email,
      role: role || 'Citizen',
      isActive: true,
      createdAt: new Date().toISOString()
    };
    return {
      token: 'mock-jwt-token-custom',
      refreshToken: 'mock-refresh-token-custom',
      expiresAt: new Date(Date.now() + 7200000).toISOString(),
      user: defaultUser
    };
  },

  async register(fullName: string, email: string, password: string, role: string, organizationId?: string): Promise<AuthResponse> {
    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName, email, password, role, organizationId })
      });
      if (res.ok) {
        const json: ApiResponse<AuthResponse> = await res.json();
        return json.data;
      }
    } catch {
      // Fallback
    }

    const newUser: User = {
      id: 'u-' + (MOCK_USERS.length + 1),
      fullName,
      email,
      role,
      organizationId,
      organizationName: MOCK_ORGS.find(o => o.id === organizationId)?.name,
      isActive: true,
      createdAt: new Date().toISOString()
    };
    MOCK_USERS.push(newUser);

    return {
      token: 'mock-jwt-token-' + newUser.id,
      refreshToken: 'mock-refresh-token-' + newUser.id,
      expiresAt: new Date(Date.now() + 7200000).toISOString(),
      user: newUser
    };
  },

  // Users
  async getUsers(): Promise<User[]> {
    try {
      const token = localStorage.getItem('resqnet_token');
      const res = await fetch(`${API_BASE}/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const json: ApiResponse<User[]> = await res.json();
        return json.data;
      }
    } catch {}
    return [...MOCK_USERS].filter(u => !u.isDeleted);
  },

  async toggleUserStatus(id: string): Promise<boolean> {
    try {
      const token = localStorage.getItem('resqnet_token');
      const res = await fetch(`${API_BASE}/users/${id}/toggle-status`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const json: ApiResponse<boolean> = await res.json();
        return json.data;
      }
    } catch {}
    const user = MOCK_USERS.find(u => u.id === id);
    if (user) {
      user.isActive = !user.isActive;
      return user.isActive;
    }
    return false;
  },

  // Organizations
  async getOrganizations(): Promise<Organization[]> {
    try {
      const res = await fetch(`${API_BASE}/organizations`);
      if (res.ok) {
        const json: ApiResponse<Organization[]> = await res.json();
        return json.data;
      }
    } catch {}
    return [...MOCK_ORGS];
  },

  async createOrganization(org: Partial<Organization>): Promise<Organization> {
    const newOrg: Organization = {
      id: 'org-' + (MOCK_ORGS.length + 1),
      name: org.name || 'New Organization',
      code: org.code || 'ORG',
      type: org.type || 'NGO',
      contactEmail: org.contactEmail || '',
      contactPhone: org.contactPhone || '',
      address: org.address || '',
      isVerified: true,
      memberCount: 1
    };
    MOCK_ORGS.push(newOrg);
    return newOrg;
  },

  // Audit Logs
  async getAuditLogs(): Promise<AuditEvent[]> {
    try {
      const res = await fetch(`${API_BASE}/audit`);
      if (res.ok) {
        const json: ApiResponse<AuditEvent[]> = await res.json();
        return json.data;
      }
    } catch {}
    return [...MOCK_AUDIT_LOGS];
  },

  // Admin User Management (edit, delete, restore)
  async editUser(id: string, updates: { fullName?: string; email?: string; phoneNumber?: string; role?: string }): Promise<User> {
    const user = MOCK_USERS.find(u => u.id === id);
    if (!user) throw new Error('User not found');
    // Check email uniqueness if changing email
    if (updates.email && updates.email.toLowerCase() !== user.email.toLowerCase()) {
      const conflict = MOCK_USERS.find(u => u.id !== id && u.email.toLowerCase() === updates.email!.toLowerCase());
      if (conflict) throw new Error('A user with this email already exists.');
    }
    if (updates.fullName !== undefined) user.fullName = updates.fullName;
    if (updates.email !== undefined) user.email = updates.email;
    if (updates.phoneNumber !== undefined) user.phoneNumber = updates.phoneNumber;
    if (updates.role !== undefined) user.role = updates.role;
    return { ...user };
  },

  async deleteUser(id: string, deletedBy: string): Promise<boolean> {
    const user = MOCK_USERS.find(u => u.id === id);
    if (!user) throw new Error('User not found');
    if (user.isDeleted) throw new Error('User is already deleted');
    // Prevent deleting last active SystemAdmin
    const activeAdmins = MOCK_USERS.filter(u => u.role === 'SystemAdmin' && !u.isDeleted && u.isActive);
    if (user.role === 'SystemAdmin' && activeAdmins.length <= 1) {
      throw new Error('Cannot delete the last active System Administrator.');
    }
    user.isActive = false;
    user.isDeleted = true;
    user.deletedAt = new Date().toISOString();
    user.deletedBy = deletedBy;

    // Persist deletion record to localStorage
    const existing: DeletedUserRecord[] = JSON.parse(localStorage.getItem(DELETED_USERS_KEY) || '[]');
    const record: DeletedUserRecord = {
      id: 'del-' + Date.now(),
      userId: user.id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      organizationName: user.organizationName,
      deletedAt: user.deletedAt!,
      deletedBy: deletedBy,
      restorationStatus: 'Deleted'
    };
    existing.push(record);
    localStorage.setItem(DELETED_USERS_KEY, JSON.stringify(existing));
    return true;
  },

  async restoreUser(id: string, restoredBy: string): Promise<User> {
    const user = MOCK_USERS.find(u => u.id === id);
    if (!user) throw new Error('User not found');
    if (!user.isDeleted) throw new Error('User is not deleted');
    // Check for email conflict with active users
    const conflict = MOCK_USERS.find(u => u.id !== id && !u.isDeleted && u.email.toLowerCase() === user.email.toLowerCase());
    if (conflict) throw new Error('Cannot restore: another active user already has this email address.');
    user.isActive = true;
    user.isDeleted = false;
    user.deletedAt = null;
    user.deletedBy = null;

    // Update deletion record
    const existing: DeletedUserRecord[] = JSON.parse(localStorage.getItem(DELETED_USERS_KEY) || '[]');
    const record = existing.filter(r => r.userId === id).sort((a, b) => b.deletedAt.localeCompare(a.deletedAt))[0];
    if (record) {
      record.restorationStatus = 'Restored';
      record.restoredAt = new Date().toISOString();
      record.restoredBy = restoredBy;
      localStorage.setItem(DELETED_USERS_KEY, JSON.stringify(existing));
    }
    return { ...user };
  },

  async getDeletedUsers(): Promise<DeletedUserRecord[]> {
    const stored: DeletedUserRecord[] = JSON.parse(localStorage.getItem(DELETED_USERS_KEY) || '[]');
    // Also include any in-memory deleted users not yet in localStorage (edge case)
    const inMemoryDeleted = MOCK_USERS.filter(u => u.isDeleted);
    for (const u of inMemoryDeleted) {
      const inStore = stored.some(r => r.userId === u.id && r.restorationStatus === 'Deleted');
      if (!inStore) {
        stored.push({
          id: 'del-mem-' + u.id,
          userId: u.id,
          fullName: u.fullName,
          email: u.email,
          role: u.role,
          organizationName: u.organizationName,
          deletedAt: u.deletedAt || new Date().toISOString(),
          deletedBy: u.deletedBy || 'System',
          restorationStatus: 'Deleted'
        });
      }
    }
    return stored;
  }
};
