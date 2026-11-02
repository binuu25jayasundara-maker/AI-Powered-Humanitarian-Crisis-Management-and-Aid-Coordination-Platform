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

// Six Separate Role-Based Dashboards (Preserved from Phase 1)
import { CitizenDashboardPage } from './pages/CitizenDashboardPage';
import { SystemAdminDashboardPage } from './pages/SystemAdminDashboardPage';
import { EmergencyCoordinatorDashboardPage } from './pages/EmergencyCoordinatorDashboardPage';
import { CaseManagerDashboardPage } from './pages/CaseManagerDashboardPage';
import { VolunteerCoordinatorDashboardPage } from './pages/VolunteerCoordinatorDashboardPage';
import { DonorOfficerDashboardPage } from './pages/DonorOfficerDashboardPage';

// Member 3 Coordination & Governance Module
import { CoordinatorDashboard } from './pages/coordination/CoordinatorDashboard';
import { CaseQueuePage } from './pages/coordination/CaseQueuePage';
import { CaseDetailPage } from './pages/coordination/CaseDetailPage';
import { CrisisEventsPage } from './pages/coordination/CrisisEventsPage';
import { PartnerCoordinationPage } from './pages/coordination/PartnerCoordinationPage';
import { ReportsPage } from './pages/coordination/ReportsPage';
import { AIReviewQueuePage } from './pages/coordination/AIReviewQueuePage';
import { AIDecisionLogPage } from './pages/coordination/AIDecisionLogPage';

// Member 6 Integrated Modules
import { DonorsCampaignsPage } from './pages/DonorsCampaignsPage';
import { VolunteerManagementPage } from './pages/VolunteerManagementPage';
import { CommunicationCenterPage } from './pages/CommunicationCenterPage';

// Resources, Shelters & Maps Integrated Modules
import { ResourcesPage } from './pages/ResourcesPage';
import { AllocationsPage } from './pages/AllocationsPage';
import { SheltersPage } from './pages/SheltersPage';
import { MapSheltersPage } from './pages/MapSheltersPage';
import { OperationalMapPage } from './pages/OperationalMapPage';

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

          {/* Six Separate Role Dashboard Landing Routes */}
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

          {/* Member 3 Coordination & Governance Routes */}
          <Route element={<ProtectedRoute allowedRoles={['EmergencyCoordinator', 'SystemAdmin']} />}>
            <Route path="/dashboard/emergency-coordinator" element={<CoordinatorDashboard />} />
            <Route path="/coordination/operations" element={<EmergencyCoordinatorDashboardPage />} />
            <Route path="/coordination/events" element={<CrisisEventsPage />} />
            <Route path="/coordination/partners" element={<PartnerCoordinationPage />} />
            <Route path="/coordination/reports" element={<ReportsPage />} />
            {/* Governance */}
            <Route path="/governance/ai-review" element={<AIReviewQueuePage />} />
            <Route path="/governance/ai-decisions" element={<AIDecisionLogPage />} />
          </Route>

          {/* Case Queue Accessible to Emergency Coordinator, Case Manager & Admin */}
          <Route element={<ProtectedRoute allowedRoles={['EmergencyCoordinator', 'CaseManager', 'SystemAdmin']} />}>
            <Route path="/coordination/cases" element={<CaseQueuePage />} />
            <Route path="/coordination/cases/:caseId" element={<CaseDetailPage />} />
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

          {/* Member 6 Integrated Modules */}
          <Route element={<ProtectedRoute allowedRoles={['DonorOfficer', 'SystemAdmin']} />}>
            <Route path="/campaigns" element={<DonorsCampaignsPage />} />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={['VolunteerCoordinator', 'SystemAdmin']} />}>
            <Route path="/volunteers" element={<VolunteerManagementPage />} />
            <Route path="/communications" element={<CommunicationCenterPage />} />
          </Route>

          {/* Resources, Shelters & Maps Routes */}
          <Route element={<ProtectedRoute allowedRoles={['EmergencyCoordinator', 'SystemAdmin']} />}>
            <Route path="/resources" element={<ResourcesPage />} />
            <Route path="/resources/allocations" element={<AllocationsPage />} />
            <Route path="/operational-map" element={<OperationalMapPage />} />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={['EmergencyCoordinator', 'CaseManager', 'SystemAdmin']} />}>
            <Route path="/shelters" element={<SheltersPage />} />
          </Route>

          {/* Interactive Map & Shelters accessible to Citizens, Coordinators & Staff */}
          <Route element={<ProtectedRoute />}>
            <Route path="/map/shelters" element={<MapSheltersPage />} />
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
