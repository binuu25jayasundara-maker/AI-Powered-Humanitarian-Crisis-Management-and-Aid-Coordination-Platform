import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { UsersAdminPage } from './pages/UsersAdminPage';
import { RolesAdminPage } from './pages/RolesAdminPage';
import { OrganizationsPage } from './pages/OrganizationsPage';
import { AuditLogsPage } from './pages/AuditLogsPage';
import { EmergencyHelpPage } from './pages/EmergencyHelpPage';

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/emergency-help" element={<EmergencyHelpPage />} />

          {/* Protected Administration Routes */}
          <Route element={<ProtectedRoute allowedRoles={['SystemAdmin', 'EmergencyCoordinator', 'CaseManager', 'VolunteerCoordinator', 'DonorOfficer']} />}>
            <Route path="/admin/users" element={<UsersAdminPage />} />
            <Route path="/admin/roles" element={<RolesAdminPage />} />
            <Route path="/admin/organizations" element={<OrganizationsPage />} />
            <Route path="/admin/audit" element={<AuditLogsPage />} />
          </Route>

          {/* Default Redirection */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};
