import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Header } from './Header';
import { Sidebar } from './Sidebar';

interface ProtectedRouteProps {
  allowedRoles?: string[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles }) => {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Header />
        <div style={{ display: 'flex', flex: 1 }}>
          <Sidebar />
          <main style={{ flex: 1, padding: '40px', textAlign: 'center' }}>
            <div className="card" style={{ maxWidth: '500px', margin: '40px auto' }}>
              <h2 style={{ color: 'var(--color-red-danger)' }}>Access Restricted (403)</h2>
              <p style={{ color: 'var(--color-text-muted)', margin: '12px 0 24px' }}>
                Your current role (<strong>{user.role}</strong>) does not hold authorization permissions for this administrative resource.
              </p>
              <button
                onClick={() => window.location.href = '/login'}
                style={{ backgroundColor: 'var(--color-blue-primary)', color: '#fff', padding: '10px 20px' }}
              >
                Switch Account
              </button>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header />
      <div style={{ display: 'flex', flex: 1 }}>
        <Sidebar />
        <main style={{ flex: 1, padding: '32px', backgroundColor: 'var(--color-bg-page)', overflowY: 'auto' }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};
