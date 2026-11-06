import React, { createContext, useContext, useState, useEffect } from 'react';
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

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('resqnet_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('resqnet_token');
  });

  const login = async (email: string, password: string, role?: string): Promise<User> => {
    const res: AuthResponse = await api.login(email, password, role);
    setUser(res.user);
    setToken(res.token);
    localStorage.setItem('resqnet_user', JSON.stringify(res.user));
    localStorage.setItem('resqnet_token', res.token);
    return res.user;
  };

  const register = async (fullName: string, email: string, password: string, role: string, orgId?: string): Promise<User> => {
    const res: AuthResponse = await api.register(fullName, email, password, role, orgId);
    setUser(res.user);
    setToken(res.token);
    localStorage.setItem('resqnet_user', JSON.stringify(res.user));
    localStorage.setItem('resqnet_token', res.token);
    return res.user;
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('resqnet_user');
    localStorage.removeItem('resqnet_token');
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
