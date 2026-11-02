# ResQnet.AI — Merged Solution: 136 (Members 1, 3, 5 & 6)

**System**: AI-Powered Humanitarian Crisis Management and Aid Coordination Platform  
**Merged Scope**: 
- **Member 1 (Auth & Governance)**: Foundation, JWT Authentication, RBAC Security, User & Organization Management, Centralized Audit Trail, and Role-Based Dashboards.
- **Member 3 (Crisis Coordination)**: Crisis Events, Case Queue Triage, AI Recommendation Review Queue & Decision Auditing, Inter-agency Partner Coordination, and SLA Analytics.
- **Member 5 (Resources, Shelters & Maps)**: Real-time Resource Inventory & Logistics, Strict Concurrency Allocation Guards (`SemaphoreSlim`), Shelter Capacity & Household Allocation Over-Allocation Guards, Leaflet-powered Interactive Shelters Map, and Multi-layer Operational Crisis Map.
- **Member 6 (Donors & Volunteers)**: Volunteers Management, Donors, Campaigns, Notification Factory & Domain Event Observers.

---

## 1. Merged Solution Architecture & Structure

```
136/
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
│   │   ├── components/              # Header, Sidebar, Toast, ProtectedRoute, coordination widgets
│   │   ├── context/                 # AuthContext
│   │   ├── pages/                   # All Role Dashboards & Integrated Modules
│   │   │   ├── ResourcesPage.tsx        # Screen 1: Resources & Logistics
│   │   │   ├── AllocationsPage.tsx      # Allocation History & Audit
│   │   │   ├── SheltersPage.tsx         # Screen 2: Shelter Management & Over-allocation Guard
│   │   │   ├── MapSheltersPage.tsx      # Screen 3: Interactive Shelter Map & Directions
│   │   │   ├── OperationalMapPage.tsx   # Screen 4: Multi-layer Tactical Crisis Map
│   │   │   ├── CitizenDashboardPage.tsx
│   │   │   ├── EmergencyCoordinatorDashboardPage.tsx
│   │   │   ├── SystemAdminDashboardPage.tsx
│   │   │   ├── CaseManagerDashboardPage.tsx
│   │   │   ├── VolunteerCoordinatorDashboardPage.tsx
│   │   │   ├── DonorOfficerDashboardPage.tsx
│   │   │   └── coordination/            # Crisis events, cases, partner coordination, AI review
│   │   ├── services/
│   │   │   ├── api.ts                   # Member 1 & 6 API Client with mock fallbacks
│   │   │   ├── coordinationApi.ts       # Member 3 API Client with storage fallbacks
│   │   │   └── resourceShelterApi.ts    # Member 5 API Client with live backend & mock fallbacks
│   │   ├── styles/
│   │   │   ├── tokens.css               # Unified color tokens
│   │   │   ├── global.css               # Global layout, tables, modals, badges, leaflet overrides
│   │   │   └── coordination.css
│   │   └── types/
│   │       ├── index.ts                 # Re-exported root contracts
│   │       ├── coordination.ts
│   │       └── resourcesAndShelters.ts  # Resource & Shelter contracts
│   ├── package.json
│   └── vite.config.ts
├── database/
└── README.md
```

---

## 2. Integrated Feature Matrix

| Feature Module | Route | Access Permissions | Backend Service |
|---|---|---|---|
| **Resources & Logistics** | `/resources` | EmergencyCoordinator, SystemAdmin | `ResQnet.Member5.Api/ResourcesController` |
| **Allocation History** | `/resources/allocations` | EmergencyCoordinator, SystemAdmin | `ResQnet.Member5.Api/AllocationsController` |
| **Shelter Management** | `/shelters` | EmergencyCoordinator, CaseManager, SystemAdmin | `ResQnet.Member5.Api/SheltersController` |
| **Map & Shelters** | `/map/shelters` | Citizen, EmergencyCoordinator, CaseManager, Volunteers, Donors, SystemAdmin | `ResQnet.Member5.Api/MapController`, `RoutesController` |
| **Operational Tactical Map** | `/operational-map` | EmergencyCoordinator, SystemAdmin | `ResQnet.Member5.Api/MapController` |
| **Crisis Coordination** | `/coordination/*` | EmergencyCoordinator, CaseManager, SystemAdmin | Coordination API |
| **Volunteers & Campaigns** | `/volunteers`, `/campaigns` | VolunteerCoordinator, DonorOfficer, SystemAdmin | `ResQnet.Member6.Api` |
| **User & Org Administration** | `/admin/*` | SystemAdmin | `ResQnet.Member1.Api` |

---

## 3. How to Run

### Backend (.NET 10 API Solution)
```powershell
cd "136\backend"
# Build all 12 projects:
dotnet build ResQnet.Merged.slnx

# Run all 48 unit tests:
dotnet test ResQnet.Merged.slnx

# Run Member 5 API:
dotnet run --project ResQnet.Member5.Api
```

### Frontend (React + Vite)
```powershell
cd "136\frontend"
npm.cmd run dev
# Accessible at http://localhost:5173
```
