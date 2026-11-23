import React, { createContext, useContext, useState } from 'react';
import { User, AuthResponse } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string, role?: string) => Promise<User>;
  register: (fullName: string, email: string, password: string, role: string, orgId?: string) => Promise<User>;
  logout: () => void;
  isAuthenticated: boolean;
  hasRole: (roles: string[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = 'resqnet_token';
const USER_KEY = 'resqnet_user';

interface StoredSession {
  user: User | null;
  token: string | null;
}

const decodeBase64Url = (value: string): string => {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), '=');
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
};

/** Returns the JWT payload, or null when the value is not a decodable JWT. */
const decodeJwtPayload = (token: string): Record<string, any> | null => {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = JSON.parse(decodeBase64Url(parts[1]));
    return payload && typeof payload === 'object' ? payload : null;
  } catch {
    return null;
  }
};

const clearStoredSession = () => {
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(TOKEN_KEY);
};

/**
 * Reads the persisted session and discards it when it is not usable:
 * - missing / malformed / expired token (including legacy mock tokens)
 * - token role that does not match the stored user role
 *
 * This prevents a stale token from being sent to the API, which used to
 * surface as "Access denied" (HTTP 403) on the dashboards after a refresh.
 */
const readStoredSession = (): StoredSession => {
  const rawUser = localStorage.getItem(USER_KEY);
  const token = localStorage.getItem(TOKEN_KEY);

  if (!rawUser || !token) {
    clearStoredSession();
    return { user: null, token: null };
  }

  let user: User;
  try {
    user = JSON.parse(rawUser) as User;
  } catch {
    clearStoredSession();
    return { user: null, token: null };
  }

  const payload = decodeJwtPayload(token);
  const tokenRole = payload?.role
    ?? payload?.['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];
  const expirySeconds = typeof payload?.exp === 'number' ? payload.exp : null;

  const isUsable =
    payload !== null &&
    expirySeconds !== null &&
    expirySeconds * 1000 > Date.now() &&
    typeof tokenRole === 'string' &&
    tokenRole === user.role;

  if (!isUsable) {
    clearStoredSession();
    return { user: null, token: null };
  }

  return { user, token };
};

const persistSession = (res: AuthResponse): StoredSession => {
  localStorage.setItem(USER_KEY, JSON.stringify(res.user));
  localStorage.setItem(TOKEN_KEY, res.token);
  return { user: res.user, token: res.token };
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<StoredSession>(() => readStoredSession());
  const { user, token } = session;

  const login = async (email: string, password: string, role?: string): Promise<User> => {
    const res: AuthResponse = await api.login(email, password, role);
    setSession(persistSession(res));
    return res.user;
  };

  const register = async (fullName: string, email: string, password: string, role: string, orgId?: string): Promise<User> => {
    const res: AuthResponse = await api.register(fullName, email, password, role, orgId);
    setSession(persistSession(res));
    return res.user;
  };

  const logout = () => {
    clearStoredSession();
    setSession({ user: null, token: null });
  };

  const hasRole = (roles: string[]) => {
    if (!user) return false;
    return roles.includes(user.role);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        register,
        logout,
        isAuthenticated: !!user,
        hasRole
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
