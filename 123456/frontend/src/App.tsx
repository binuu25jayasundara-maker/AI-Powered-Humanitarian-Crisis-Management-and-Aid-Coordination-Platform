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
import { RequestPage } from './pages/citizen/RequestPage';
import { TrackerPage } from './pages/citizen/TrackerPage';
import { SheltersPage as CitizenMapSheltersPage } from './pages/citizen/SheltersPage';
import { AlertsPage } from './pages/citizen/AlertsPage';
import { NotificationsPage } from './pages/citizen/NotificationsPage';
import { ProfilePage } from './pages/citizen/ProfilePage';
import { SystemAdminDashboardPage } from './pages/SystemAdminDashboardPage';
import { CaseManagerDashboardPage } from './pages/CaseManagerDashboardPage';
import { VolunteerCoordinatorDashboardPage } from './pages/VolunteerCoordinatorDashboardPage';
import { DonorOfficerDashboardPage } from './pages/DonorOfficerDashboardPage';
import { DonorDashboardPage } from './pages/DonorDashboardPage';
import { VolunteerDashboardPage } from './pages/VolunteerDashboardPage';

// Member 3 Coordination & Governance Module
import { CoordinatorDashboard } from './pages/coordination/CoordinatorDashboard';
import { CaseQueuePage } from './pages/coordination/CaseQueuePage';
import { CaseDetailPage } from './pages/coordination/CaseDetailPage';
import { CrisisEventsPage } from './pages/coordination/CrisisEventsPage';
import { PartnerCoordinationPage } from './pages/coordination/PartnerCoordinationPage';
import { ReportsPage } from './pages/coordination/ReportsPage';
import { AIReviewQueuePage } from './pages/coordination/AIReviewQueuePage';
import { AIDecisionLogPage } from './pages/coordination/AIDecisionLogPage';
import { AiStatusPage } from './pages/AiStatusPage';
import { ForecastingPage } from './pages/ForecastingPage';
import { DuplicatesPage } from './pages/DuplicatesPage';

// Member 4 Standalone Integration (123456 merge)
import { M4CaseReviewPage } from './pages/m4/M4CaseReviewPage';

// Member 6 Integrated Modules
import { DonorsCampaignsPage } from './pages/DonorsCampaignsPage';
import { VolunteerManagementPage } from './pages/VolunteerManagementPage';
import { CommunicationCenterPage } from './pages/CommunicationCenterPage';

// Resources, Shelters & Maps Integrated Modules
import { ResourcesPage } from './pages/ResourcesPage';
import { AllocationsPage } from './pages/AllocationsPage';
import { SheltersPage as ShelterManagementPage } from './pages/SheltersPage';
import { OperationalMapPage } from './pages/OperationalMapPage';

const RoleBasedRedirect: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }
  switch (user.role) {
    case 'Citizen':
      return <Navigate to="/dashboard/citizen" replace />;
    case 'DonorAndVolunteer':
      return <Navigate to="/dashboard/donor-volunteer" replace />;
    // Legacy role aliases — map to unified donor-volunteer dashboard
    case 'Donor':
      return <Navigate to="/dashboard/donor-volunteer" replace />;
    case 'Volunteer':
      return <Navigate to="/dashboard/donor-volunteer" replace />;
    case 'DonorOfficer':
      return <Navigate to="/dashboard/donor-volunteer" replace />;
    case 'SystemAdmin':
      return <Navigate to="/dashboard/admin" replace />;
    case 'EmergencyCoordinator':
      return <Navigate to="/dashboard/emergency-coordinator" replace />;
    case 'CaseManager':
      return <Navigate to="/dashboard/case-manager" replace />;
    case 'VolunteerCoordinator':
      return <Navigate to="/dashboard/volunteer-coordinator" replace />;
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
            <Route path="/citizen/request" element={<RequestPage />} />
            <Route path="/citizen/requests" element={<TrackerPage />} />
            <Route path="/citizen/alerts" element={<AlertsPage />} />
            <Route path="/citizen/notifications" element={<NotificationsPage />} />
            <Route path="/citizen/profile" element={<ProfilePage />} />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={['SystemAdmin']} />}>
            <Route path="/dashboard/admin" element={<SystemAdminDashboardPage />} />
            {/* Administration Sub-Modules */}
            <Route path="/admin/users" element={<UsersAdminPage />} />
            <Route path="/admin/roles" element={<RolesAdminPage />} />
            <Route path="/admin/organizations" element={<OrganizationsPage />} />
            <Route path="/admin/audit" element={<AuditLogsPage />} />
            <Route path="/admin/ai-status" element={<AiStatusPage />} />
          </Route>

          {/* Coordination & Governance Routes */}
          <Route element={<ProtectedRoute allowedRoles={['EmergencyCoordinator', 'SystemAdmin']} />}>
            <Route path="/dashboard/emergency-coordinator" element={<CoordinatorDashboard />} />
            <Route path="/coordination/operations" element={<Navigate to="/dashboard/emergency-coordinator" replace />} />
            <Route path="/coordination/events" element={<CrisisEventsPage />} />
            <Route path="/coordination/partners" element={<PartnerCoordinationPage />} />
            <Route path="/coordination/reports" element={<ReportsPage />} />
            {/* Governance */}
            <Route path="/governance/ai-decisions" element={<AIDecisionLogPage />} />
            <Route path="/governance/ai-status" element={<AiStatusPage />} />
            <Route path="/governance/forecasting" element={<ForecastingPage />} />
          </Route>

          {/* AI Review Queue & Duplicates Accessible to Coordinator, Case Manager & Admin */}
          <Route element={<ProtectedRoute allowedRoles={['EmergencyCoordinator', 'CaseManager', 'SystemAdmin']} />}>
            <Route path="/governance/ai-review" element={<AIReviewQueuePage />} />
            <Route path="/governance/duplicates" element={<DuplicatesPage />} />
          </Route>

          {/* Case Queue Accessible to Emergency Coordinator, Case Manager & Admin */}
          <Route element={<ProtectedRoute allowedRoles={['EmergencyCoordinator', 'CaseManager', 'SystemAdmin']} />}>
            <Route path="/coordination/cases" element={<CaseQueuePage />} />
            <Route path="/coordination/cases/:caseId" element={<CaseDetailPage />} />
            {/* Standalone AI Case Review Demo */}
            <Route path="/m4/case-review" element={<M4CaseReviewPage />} />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={['CaseManager', 'SystemAdmin']} />}>
            <Route path="/dashboard/case-manager" element={<CaseManagerDashboardPage />} />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={['VolunteerCoordinator', 'SystemAdmin']} />}>
            <Route path="/dashboard/volunteer-coordinator" element={<VolunteerCoordinatorDashboardPage />} />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={['Volunteer', 'VolunteerCoordinator', 'SystemAdmin']} />}>
            <Route path="/dashboard/volunteer" element={<VolunteerDashboardPage />} />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={['DonorOfficer', 'SystemAdmin']} />}>
            <Route path="/dashboard/donor-officer" element={<DonorOfficerDashboardPage />} />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={['Donor', 'DonorOfficer', 'SystemAdmin']} />}>
            <Route path="/dashboard/donor" element={<DonorDashboardPage />} />
          </Route>

          {/* Unified Donor and Volunteer dashboard for DonorAndVolunteer role */}
          <Route element={<ProtectedRoute allowedRoles={['DonorAndVolunteer', 'Donor', 'Volunteer', 'DonorOfficer', 'SystemAdmin']} />}>
            <Route path="/dashboard/donor-volunteer" element={<DonorDashboardPage />} />
          </Route>

          {/* Member 6 Integrated Modules */}
          <Route element={<ProtectedRoute allowedRoles={['DonorAndVolunteer', 'Donor', 'DonorOfficer', 'SystemAdmin']} />}>
            <Route path="/campaigns" element={<DonorsCampaignsPage />} />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={['Volunteer', 'VolunteerCoordinator', 'SystemAdmin']} />}>
            <Route path="/volunteers" element={<VolunteerManagementPage />} />
            <Route path="/communications" element={<CommunicationCenterPage />} />
          </Route>

          {/* Resources, Shelters & Maps Routes */}
          <Route element={<ProtectedRoute allowedRoles={['EmergencyCoordinator', 'SystemAdmin']} />}>
            <Route path="/resources" element={<ResourcesPage />} />
            <Route path="/resources/allocations" element={<AllocationsPage />} />
            <Route path="/resources/shelters-management" element={<ShelterManagementPage />} />
            <Route path="/operational-map" element={<OperationalMapPage />} />
          </Route>

          {/* Member 2: Map & Shelters (Primary implementation accessible to all authenticated roles) */}
          <Route element={<ProtectedRoute />}>
            <Route path="/citizen/shelters" element={<CitizenMapSheltersPage />} />
            {/* Backward-compatible redirects to Member 2 Map & Shelters */}
            <Route path="/shelters" element={<Navigate to="/citizen/shelters" replace />} />
            <Route path="/map/shelters" element={<Navigate to="/citizen/shelters" replace />} />
            <Route path="/shelters/directory" element={<Navigate to="/citizen/shelters" replace />} />

            {/* Member 4: Case Review & AI Status redirects */}
            <Route path="/case-review" element={<Navigate to="/coordination/cases/c-2341" replace />} />
            <Route path="/ai-status" element={<Navigate to="/governance/ai-status" replace />} />
            <Route path="/forecasting" element={<Navigate to="/governance/forecasting" replace />} />
            <Route path="/duplicates" element={<Navigate to="/governance/duplicates" replace />} />
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
