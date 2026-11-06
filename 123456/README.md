# ResQnet.AI — Merged Solution (Members 1, 2, 3, 4, 5 & 6)

**System**: AI-Powered Humanitarian Crisis Management and Aid Coordination Platform  
**Merged Scope**: 
- **Member 1 (Auth & Governance)**: Foundation, JWT Authentication, RBAC Security, User & Organization Management, Centralized Audit Trail, and Role-Based Dashboards.
- **Member 2 (Citizen Portal)**: Public Emergency Request Dispatch, Multi-Category Aid Assistance (Food, Water, Medical, Rescue), Request Status Tracking with Live Stepper, Safety Alerts & Official DMC Advisories, In-App Notifications, Offline Request Queueing with Auto-Flush on Reconnection, Citizen Profile & Accessibility Needs, Rating/Feedback System, and Integrated AI Assistant Trigger.
- **Member 3 (Crisis Coordination)**: Crisis Events, Case Queue Triage, AI Recommendation Review Queue & Decision Auditing, Inter-agency Partner Coordination, and SLA Analytics.
- **Member 4 (AI Services & Decision Support)**: Interactive Slide-Over AI Assistant with Language Detection (English, Sinhala, Tamil) & Offline FAQ Fallback, AI Recommendation Cards with Human-in-the-Loop (HITL) Governance (Approve, Modify, Reject, Defer), Non-Destructive Duplicate Detection Engine, AI Service Health & Telemetry Status Page, and Predictive Aid Demand Forecasting.
- **Member 5 (Resources, Shelters & Maps)**: Real-time Resource Inventory & Logistics, Strict Concurrency Allocation Guards (`SemaphoreSlim`), Shelter Capacity & Household Allocation Over-Allocation Guards, Leaflet-powered Interactive Shelters Map, and Multi-layer Operational Tactical Crisis Map.
- **Member 6 (Donors & Volunteers)**: Volunteers Management, Donors, Campaigns, Notification Factory & Domain Event Observers.

---

## 1. Merged Solution Architecture & Structure

```
Member 12356/
├── backend/
│   ├── ResQnet.Merged.slnx          # Master solution compiling all 12 projects across M1, M5, M6
│   ├── ResQnet.Member1.Api/         # Auth, Admin, User, Org Controllers
│   ├── ResQnet.Member1.Application/ # Member 1 Application logic
│   ├── ResQnet.Member1.Domain/      # Member 1 Entities
│   ├── ResQnet.Member1.Infrastructure/
│   ├── ResQnet.Member1.Tests/       # 6/6 Passing xUnit tests
│   ├── ResQnet.Member5.Api/         # Resources, Shelters, Map, Allocations & Route Controllers (Port 5100)
│   ├── ResQnet.Member5.Tests/       # 37/37 Passing xUnit tests (Over-allocation & Concurrency guards)
│   ├── ResQnet.Member6.Api/         # Campaign, Donation, Volunteer, Notification Controllers
│   ├── ResQnet.Member6.Application/
│   ├── ResQnet.Member6.Domain/
│   ├── ResQnet.Member6.Infrastructure/
│   └── ResQnet.Member6.Tests/       # 5/5 Passing xUnit tests
├── frontend/                        # Unified React 18 + TypeScript + Vite UI
│   ├── src/
│   │   ├── components/              # Header, Sidebar, Toast, ProtectedRoute, coordination & citizen widgets
│   │   │   ├── citizen/             # Member 2: EmergencyRequestForm, ActionCard, Stepper, CapacityBar, etc.
│   │   │   └── coordination/        # Member 3: Coordination UI components
│   │   ├── context/                 # AuthContext
│   │   ├── pages/                   # All Role Dashboards & Integrated Modules
│   │   │   ├── citizen/             # Member 2: RequestPage, TrackerPage, SheltersPage, AlertsPage, NotificationsPage, ProfilePage
│   │   │   ├── coordination/        # Member 3: Crisis events, cases, partner coordination, AI review
│   │   │   ├── ResourcesPage.tsx        # Screen 1: Resources & Logistics (Member 5)
│   │   │   ├── AllocationsPage.tsx      # Allocation History & Audit (Member 5)
│   │   │   ├── SheltersPage.tsx         # Screen 2: Shelter Management & Over-allocation Guard (Member 5)
│   │   │   ├── MapSheltersPage.tsx      # Screen 3: Interactive Shelter Map & Directions (Member 5)
│   │   │   ├── OperationalMapPage.tsx   # Screen 4: Multi-layer Tactical Crisis Map (Member 5)
│   │   │   ├── CitizenDashboardPage.tsx # Integrated Citizen Portal Home (Member 2 + 5 Map integration)
│   │   │   ├── EmergencyHelpPage.tsx    # Public Direct Distress Channel (Member 1 + Member 2 Citizen Sync)
│   │   │   ├── EmergencyCoordinatorDashboardPage.tsx
│   │   │   ├── SystemAdminDashboardPage.tsx
│   │   │   ├── CaseManagerDashboardPage.tsx
│   │   │   ├── VolunteerCoordinatorDashboardPage.tsx
│   │   │   └── DonorOfficerDashboardPage.tsx
│   │   ├── services/
│   │   │   ├── api.ts                   # Member 1 & 6 API Client with mock fallbacks
│   │   │   ├── citizenApi.ts            # Member 2 Citizen API Client with localStorage & offline queueing
│   │   │   ├── coordinationApi.ts       # Member 3 API Client with storage fallbacks
│   │   │   └── resourceShelterApi.ts    # Member 5 API Client with live backend & mock fallbacks
│   │   ├── styles/
│   │   │   ├── tokens.css               # Unified color tokens
│   │   │   ├── global.css               # Global layout, tables, modals, badges, leaflet overrides
│   │   │   ├── coordination.css         # Coordination & governance styling
│   │   │   └── citizen.css              # Citizen portal styling
│   │   └── types/
│   │       ├── index.ts                 # Re-exported root contracts
│   │       ├── citizen.ts               # Member 2 Citizen contracts
│   │       ├── coordination.ts          # Member 3 Coordination contracts
│   │       └── resourcesAndShelters.ts  # Member 5 Resource & Shelter contracts
│   ├── package.json
│   └── vite.config.ts
├── database/
└── README.md
```

---

## 2. Integrated Feature Matrix

| Feature Module | Route | Access Permissions | Primary Service |
|---|---|---|---|
| **Citizen Dashboard** | `/dashboard/citizen` | Citizen, SystemAdmin | `citizenApi.ts` |
| **Emergency Help Request** | `/citizen/request` | Citizen, SystemAdmin | `citizenApi.ts` |
| **Request Status Tracker** | `/citizen/requests` | Citizen, SystemAdmin | `citizenApi.ts` |
| **Map & Shelters** | `/citizen/shelters` | All Roles & Public | `citizenApi.ts`, `ShelterApi` |
| **Safety Alerts & DMC** | `/citizen/alerts` | Citizen, SystemAdmin | `citizenApi.ts` |
| **Citizen Notifications** | `/citizen/notifications` | Citizen, SystemAdmin | `citizenApi.ts` |
| **Citizen Profile & Needs** | `/citizen/profile` | Citizen, SystemAdmin | `citizenApi.ts` |
| **Public SOS Distress Hub** | `/emergency-help` | Public / All | `EmergencyHelpPage.tsx` + `citizenApi.ts` |
| **Resources & Logistics** | `/resources` | EmergencyCoordinator, SystemAdmin | `ResQnet.Member5.Api/ResourcesController` |
| **Allocation History** | `/resources/allocations` | EmergencyCoordinator, SystemAdmin | `ResQnet.Member5.Api/AllocationsController` |
| **Shelter Management Guard** | `/shelters` | EmergencyCoordinator, CaseManager, SystemAdmin | `ResQnet.Member5.Api/SheltersController` |
| **Operational Tactical Map** | `/operational-map` | EmergencyCoordinator, SystemAdmin | `ResQnet.Member5.Api/MapController` |
| **Crisis Coordination** | `/coordination/*` | EmergencyCoordinator, CaseManager, SystemAdmin | Coordination API |
| **AI Governance & Review** | `/governance/*` | EmergencyCoordinator, SystemAdmin | Coordination API |
| **Volunteers & Campaigns** | `/volunteers`, `/campaigns` | VolunteerCoordinator, DonorOfficer, SystemAdmin | `ResQnet.Member6.Api` |
| **User & Org Administration** | `/admin/*` | SystemAdmin | `ResQnet.Member1.Api` |

---

## 3. Ports and Configuration

| Service | Project | URL | Swagger |
|---|---|---|---|
| Auth, users, audit | `ResQnet.Member1.Api` | http://localhost:5016 | `/swagger` |
| AI services | `ResQnet.Member4.Api` | http://localhost:5157 | `/swagger` |
| Resources, shelters, map | `ResQnet.Member5.Api` | http://localhost:5126 | `/swagger` |
| Volunteers, donors, campaigns | `ResQnet.Member6.Api` | http://localhost:5006 | `/` |
| Core API (citizen + coordination) | *to be built* | http://localhost:5200 (reserved) | - |
| Frontend | `frontend/` | http://localhost:5173 | - |

The frontend reads its API addresses from `frontend/.env` (copy `frontend/.env.example`). If the file is missing, the defaults above are used.
When an API is not running, parts of the frontend fall back to mock/localStorage data, so always start the APIs before demonstrating.

## 4. How to Run

Requirements: .NET 10 SDK, Node 20+.

```powershell
# 1. Build and test everything
cd backend
dotnet build ResQnet.Merged.slnx
dotnet test ResQnet.Merged.slnx

# 2. Start each API in its own terminal (from the repository root)
dotnet run --project backend/ResQnet.Member1.Api --launch-profile http
dotnet run --project backend/ResQnet.Member4.Api --launch-profile http
dotnet run --project backend/ResQnet.Member5.Api --launch-profile http
dotnet run --project backend/ResQnet.Member6.Api --launch-profile http

# 3. Start the frontend
cd frontend
copy .env.example .env
npm install
npm run dev
```
