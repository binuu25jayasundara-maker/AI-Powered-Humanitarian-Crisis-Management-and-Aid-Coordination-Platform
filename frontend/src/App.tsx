import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { UsersAdminPage } from './pages/UsersAdminPage';
import { RolesAdminPage } from './pages/RolesAdminPage';
import { OrganizationsPage } from './pages/OrganizationsPage';
import { AuditLogsPage } from './pages/AuditLogsPage';
import { EmergencyHelpPage } from './pages/EmergencyHelpPage';

// Six Separate Role-Based Dashboards
import { CitizenDashboardPage } from './pages/CitizenDashboardPage';
import { SystemAdminDashboardPage } from './pages/SystemAdminDashboardPage';
import { EmergencyCoordinatorDashboardPage } from './pages/EmergencyCoordinatorDashboardPage';
import { CaseManagerDashboardPage } from './pages/CaseManagerDashboardPage';
import { VolunteerCoordinatorDashboardPage } from './pages/VolunteerCoordinatorDashboardPage';
import { DonorOfficerDashboardPage } from './pages/DonorOfficerDashboardPage';

const RoleBasedRedirect: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }
  switch (user.role) {
    case 'Citizen':
      return <Navigate to="/dashboard/citizen" replace />;
    case 'SystemAdmin':
      return <Navigate to="/dashboard/admin" replace />;
    case 'EmergencyCoordinator':
      return <Navigate to="/dashboard/emergency-coordinator" replace />;
    case 'CaseManager':
      return <Navigate to="/dashboard/case-manager" replace />;
    case 'VolunteerCoordinator':
      return <Navigate to="/dashboard/volunteer-coordinator" replace />;
    case 'DonorOfficer':
      return <Navigate to="/dashboard/donor-officer" replace />;
    default:
      return <Navigate to="/dashboard/citizen" replace />;
  }
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/emergency-help" element={<EmergencyHelpPage />} />

          {/* Role-Specific Dashboard Routes */}
          <Route element={<ProtectedRoute allowedRoles={['Citizen', 'SystemAdmin']} />}>
            <Route path="/dashboard/citizen" element={<CitizenDashboardPage />} />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={['SystemAdmin']} />}>
            <Route path="/dashboard/admin" element={<SystemAdminDashboardPage />} />
            {/* Administration Sub-Modules */}
            <Route path="/admin/users" element={<UsersAdminPage />} />
            <Route path="/admin/roles" element={<RolesAdminPage />} />
            <Route path="/admin/organizations" element={<OrganizationsPage />} />
            <Route path="/admin/audit" element={<AuditLogsPage />} />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={['EmergencyCoordinator', 'SystemAdmin']} />}>
            <Route path="/dashboard/emergency-coordinator" element={<EmergencyCoordinatorDashboardPage />} />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={['CaseManager', 'SystemAdmin']} />}>
            <Route path="/dashboard/case-manager" element={<CaseManagerDashboardPage />} />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={['VolunteerCoordinator', 'SystemAdmin']} />}>
            <Route path="/dashboard/volunteer-coordinator" element={<VolunteerCoordinatorDashboardPage />} />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={['DonorOfficer', 'SystemAdmin']} />}>
            <Route path="/dashboard/donor-officer" element={<DonorOfficerDashboardPage />} />
          </Route>

          {/* Root and Dashboard Redirects */}
          <Route path="/dashboard" element={<RoleBasedRedirect />} />
          <Route path="/" element={<RoleBasedRedirect />} />

          {/* Fallback Redirection */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
