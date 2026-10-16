export interface User {
  id: string;
  fullName: string;
  email: string;
  role: string;
  organizationId?: string | null;
  organizationName?: string | null;
  isActive: boolean;
  createdAt: string;
  lastLoginAt?: string | null;
}

export interface AuthResponse {
  token: string;
  refreshToken: string;
  expiresAt: string;
  user: User;
}

export interface Organization {
  id: string;
  name: string;
  code: string;
  type: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  isVerified: boolean;
  memberCount: number;
}

export interface Role {
  id: string;
  name: string;
  description: string;
  isSystemRole: boolean;
  permissions: string[];
}

export interface Permission {
  id: string;
  code: string;
  description: string;
  category: string;
}

export interface AuditEvent {
  id: string;
  actorId: string;
  actorEmail: string;
  action: string;
  entityName: string;
  entityId?: string | null;
  detailsJson: string;
  ipAddress?: string | null;
  status: string;
  createdAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  errors: string[];
}
