# ResQnet.AI — Merged Solution: Member 1 & Member 6

**System**: AI-Powered Humanitarian Crisis Management and Aid Coordination Platform  
**Integration Slice**: 
- **Member 1**: Foundation, Authentication (JWT), RBAC Security Policies, Password Hashing, Organizations, User Management, Centralized Audit Trail Services, and Six Role-Based Dashboard Interfaces.
- **Member 6**: Volunteers Management, Donors, Campaigns, Factory Pattern Communication Services & Observer Pattern Domain Events.

---

## 1. Merged Solution Architecture & Structure

```
Member 1 Member 6 Merge/
├── backend/
│   ├── ResQnet.Merged.slnx          # Unified master solution compiling all 10 projects
│   ├── ResQnet.Member1.sln          # Member 1 classic solution
│   ├── ResQnet.Member1.Domain/      # User, Role, Org, AuditEvent, RefreshToken entities
│   ├── ResQnet.Member1.Application/ # AuthService, UserService, AuditService, UnitOfWork
│   ├── ResQnet.Member1.Infrastructure/ # ApplicationDbContext, BCrypt, JWT, Repositories
│   ├── ResQnet.Member1.Api/         # Auth, Admin, User, Organization Controllers (Port 5000)
│   ├── ResQnet.Member1.Tests/       # 6/6 Passing Member 1 xUnit tests
│   ├── ResQnet.Member6.sln          # Member 6 classic solution
│   ├── ResQnet.Member6.Domain/      # Campaign, Donation, Volunteer, Notification entities & Events
│   ├── ResQnet.Member6.Application/ # CampaignService, DonationService, VolunteerService, NotificationService
│   ├── ResQnet.Member6.Infrastructure/ # Channel Factory, Observers, UnitOfWork, Idempotency
│   ├── ResQnet.Member6.Api/         # Campaign, Donation, Volunteer, Notification Controllers
│   └── ResQnet.Member6.Tests/       # 5/5 Passing Member 6 xUnit tests
├── frontend/                        # Unified React 18 + TypeScript + Vite UI
│   ├── src/
│   │   ├── components/              # Dynamic Role-Based Header, Sidebar & ProtectedRoute
│   │   ├── context/                 # AuthContext
│   │   ├── pages/                   # Six Role Dashboards + Member 1 Admin Pages + Member 6 Feature Pages
│   │   │   ├── CitizenDashboardPage.tsx
│   │   │   ├── SystemAdminDashboardPage.tsx
│   │   │   ├── EmergencyCoordinatorDashboardPage.tsx
│   │   │   ├── CaseManagerDashboardPage.tsx
│   │   │   ├── VolunteerCoordinatorDashboardPage.tsx
│   │   │   ├── DonorOfficerDashboardPage.tsx
│   │   │   ├── UsersAdminPage.tsx
│   │   │   ├── RolesAdminPage.tsx
│   │   │   ├── OrganizationsPage.tsx
│   │   │   ├── AuditLogsPage.tsx
│   │   │   ├── DonorsCampaignsPage.tsx
│   │   │   ├── VolunteerManagementPage.tsx
│   │   │   ├── CommunicationCenterPage.tsx
│   │   │   ├── LoginPage.tsx
│   │   │   ├── RegisterPage.tsx
│   │   │   └── EmergencyHelpPage.tsx
│   │   ├── services/                # api.ts (Merged REST client with offline demo fallbacks)
│   │   ├── styles/                  # tokens.css, global.css
│   │   └── types/                   # Unified index.ts
│   ├── package.json
│   └── vite.config.ts
├── database/
│   ├── 01_Initial_Schema_and_Seed.sql # Member 1 SQL Server DDL & Seed
│   └── 01_Member6_Schema_and_Seed.sql # Member 6 SQL Server DDL & Seed
└── README.md
```

---

## 2. Six Role-Based Dashboards Supported

All six roles are routed to their own separate, dedicated dashboard interface structures:

| # | Role | Email | Dashboard Route | Interface Title |
|---|------|-------|-----------------|-----------------|
| 1 | **Citizen** | `citizen@resqnet.org` | `/dashboard/citizen` | Citizen Dashboard |
| 2 | **System Administrator** | `admin@resqnet.org` | `/dashboard/admin` | System Administrator Dashboard |
| 3 | **Emergency Coordinator** | `coordinator@resqnet.org` | `/dashboard/emergency-coordinator` | Emergency Coordinator Dashboard |
| 4 | **Incident / Case Manager** | `casemanager@resqnet.org` | `/dashboard/case-manager` | Incident / Case Manager Dashboard |
| 5 | **Volunteer Coordinator** | `volunteer.coord@resqnet.org` | `/dashboard/volunteer-coordinator` | Volunteer Coordinator Dashboard |
| 6 | **Donor Officer** | `donor.officer@resqnet.org` | `/dashboard/donor-officer` | Donor Officer Dashboard |

Default Password for all seeded accounts: `Password@123`

---

## 3. Preserved Member 6 Features

1. **Donors & Campaigns Dashboard** (`/campaigns`): KPI metric cards, active campaign progress, donation recording modal, and donation history.
2. **Volunteer Management Dashboard** (`/volunteers`): Volunteer roster table, 7-day weekly availability matrix, AI task matching recommendation card, task assignment workflow, and volunteer registration modal.
3. **Communication Center** (`/communications`): Multi-channel dispatcher (Email, SMS, Push) verifying the Factory Pattern and idempotency key duplicate suppression.

---

## 4. Running Backend Unit Tests

Run all 11 unit tests across Member 1 and Member 6 simultaneously:
```powershell
cd backend
dotnet test ResQnet.Merged.slnx
```
**Test Results**: 11 passed, 0 failed.

---

## 5. Running the Frontend

```powershell
cd frontend
npm.cmd install
npm.cmd run dev
```
Open `http://localhost:5173` to sign in as any of the six roles.
