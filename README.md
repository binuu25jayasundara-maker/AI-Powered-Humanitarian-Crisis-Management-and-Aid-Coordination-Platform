# ResQnet.AI — Humanitarian Crisis Management & Aid Coordination Platform

ResQnet.AI is an integrated humanitarian crisis management and aid coordination platform that connects affected citizens, emergency coordinators, case triage officers, resource managers, and volunteer/donor networks into a cohesive, secure disaster-response workflow. The platform coordinates public emergency assistance dispatch, AI-assisted case analysis and duplicate triage, real-time resource and shelter occupancy allocation with strict concurrency guards, multi-channel notification dispatch, and public donations and volunteering. The default demo data is set in Sri Lanka (featuring Disaster Management Centre and Sri Lanka Red Cross operational contexts).

---

## 1. Architecture Overview

The system follows a distributed microservices-style architecture composed of five ASP.NET Core backend services and a single-page React frontend.

```
123456/
├── backend/
│   ├── ResQnet.Merged.slnx          # Solution compiling all 19 projects across all modules
│   ├── ResQnet.Member1.Api/         # Auth, RBAC, Users, Organizations & Central Audit Trail
│   ├── ResQnet.Member4.Api/         # AI Decision Support, Duplicate Detection & Case Forecasting
│   ├── ResQnet.Member5.Api/         # Resource Inventory, Shelter Allocation & Tactical Maps
│   ├── ResQnet.Member6.Api/         # Volunteers, Donors, Campaigns & Notification Factory
│   └── ResQnet.UnifiedApi/          # Core Citizen Assistance Requests & Crisis Events
├── frontend/                        # Unified React 18 + TypeScript + Vite Single-Page Application
├── database/                        # SQL Server schema and initial seed scripts
└── docs/                            # Integration notes and technical specifications
```

### Services, Ports & Documentation

| Service | Project | Port | Local URL | Swagger / OpenAPI URL |
|---|---|:---:|---|---|
| **Member 1: Auth & Governance** | `ResQnet.Member1.Api` | `5016` | http://localhost:5016 | http://localhost:5016/swagger |
| **Member 4: AI Decision Support** | `ResQnet.Member4.Api` | `5157` | http://localhost:5157 | http://localhost:5157/swagger |
| **Member 5: Resources & Shelters** | `ResQnet.Member5.Api` | `5126` | http://localhost:5126 | http://localhost:5126/swagger |
| **Member 6: Volunteers & Donors** | `ResQnet.Member6.Api` | `5006` | http://localhost:5006 | http://localhost:5006/ *(root)* |
| **Core API: Requests & Events** | `ResQnet.UnifiedApi` | `5200` | http://localhost:5200 | http://localhost:5200/swagger |
| **Frontend UI** | `frontend/` | `5173` | http://localhost:5173 | *(Web Application)* |

---

## 2. Prerequisites

- **.NET 10 SDK** (v10.0.x or higher)
- **Node.js 20+** and **npm**
- **PowerShell 7+** or Windows PowerShell

---

## 3. How to Run on Windows PowerShell

### Step 1: Frontend Environment Setup
From the repository root, copy the environment template to `frontend/.env`:
```powershell
Copy-Item frontend\.env.example frontend\.env
```
*(If `frontend/.env` is omitted, the frontend automatically falls back to default localhost ports).*

### Step 2: Start All 5 Backend APIs
Open **five separate PowerShell windows** (or terminal tabs) from the repository root and run each service with the `http` launch profile:

```powershell
# Terminal 1 — Member 1: Auth & Governance (Port 5016)
dotnet run --project backend/ResQnet.Member1.Api --launch-profile http

# Terminal 2 — Member 4: AI Decision Support (Port 5157)
dotnet run --project backend/ResQnet.Member4.Api --launch-profile http

# Terminal 3 — Member 5: Resources & Shelters (Port 5126)
dotnet run --project backend/ResQnet.Member5.Api --launch-profile http

# Terminal 4 — Member 6: Volunteers & Donors (Port 5006)
dotnet run --project backend/ResQnet.Member6.Api --launch-profile http

# Terminal 5 — Core API: Requests & Events (Port 5200)
dotnet run --project backend/ResQnet.UnifiedApi --launch-profile http
```

### Step 3: Start the React Frontend
In a **sixth PowerShell window**, install dependencies and launch Vite:
```powershell
cd frontend
npm install
npm run dev
```

> **PowerShell Execution Policy Tip**: If PowerShell blocks `npm` with a script execution error (`PSSecurityException`), use `npm.cmd` instead:
> ```powershell
> npm.cmd install
> npm.cmd run dev
> ```

Open http://localhost:5173 in your browser to access the application.

---

## 4. Automated Test Suite

Run all tests across the solution using the .NET CLI:
```powershell
dotnet test backend/ResQnet.Merged.slnx
```

### Verified Test Project Results

| Test Project | Framework | Passed | Failed | Skipped | Total Tests |
|---|---|:---:|:---:|:---:|:---:|
| `ResQnet.Member1.Tests` | net10.0 | 10 | 0 | 0 | **10** |
| `ResQnet.Member4.Tests` | net10.0 | 26 | 0 | 0 | **26** |
| `ResQnet.Member5.Tests` | net10.0 | 43 | 0 | 0 | **43** |
| `ResQnet.Member6.Tests` | net10.0 | 16 | 0 | 0 | **16** |
| `ResQnet.UnifiedApi.Tests` | net10.0 | 98 | 0 | 0 | **98** |
| **All Test Projects** | | **193** | **0** | **0** | **193** |

---

## 5. Seeded Demo Accounts & Roles

All demo accounts are seeded from Member 1's `DbInitializer` and share the same default password: **`Password@123`**

| Email | Full Name | Role | Organization | Primary Responsibilities |
|---|---|---|---|---|
| `admin@resqnet.org` | Platform Administrator | `SystemAdmin` | DMC-LK | Platform configuration, security controls, user management & audit trail |
| `coordinator@resqnet.org` | Chaminda Silva | `EmergencyCoordinator` | DMC-LK | Crisis event oversight, high-level case triage & AI decision approvals |
| `casemanager@resqnet.org` | Nadeesha Perera | `CaseManager` | DMC-LK | Citizen assistance request review, verification & status advancement |
| `volunteer.coord@resqnet.org` | Kasun Jayawardena | `VolunteerCoordinator` | SLRC | Volunteer registration, scheduling & crisis task assignment |
| `donor.officer@resqnet.org` | Anura Fernando | `DonorOfficer` | SLRC | Fundraising campaigns, financial tracking & donation intake |
| `citizen@resqnet.org` | Sunil Weerasinghe | `Citizen` | *(Public / None)* | Submitting emergency aid requests & real-time tracking |
| `logistics@resqnet.org` | Logistics Manager | `LogisticsManager` | DMC-LK | Warehouse inventory management, supplies & logistics dispatch |
| `shelter@resqnet.org` | Shelter Administrator | `ShelterAdmin` | DMC-LK | Shelter capacity, household intake & over-allocation prevention |
| `partner@resqnet.org` | Partner Officer | `PartnerOfficer` | SLRC | Relief agency liaison & external partner coordination |

---

## 6. Security Summary

- **JWT Bearer Authentication**: Centralized symmetric token generation (Member 1) validated across all API microservices (`Member1`, `Member4`, `Member5`, `Member6`, and `UnifiedApi`).
- **Role-Based Access Control (RBAC)**: All sensitive endpoints enforce explicit role requirements using ASP.NET Core `[Authorize(Roles = "...")]` attributes.
- **Strict Separation of Duties**: The `SystemAdmin` role has full administrative authority over users, organizations, and security audit logs, but has **no access** to citizen request content or case triage data. Citizen assistance records are strictly restricted to operational response roles (`Citizen`, `CaseManager`, `EmergencyCoordinator`).
- **PII Protection**: Member 4 applies automatic regex-based masking of phone numbers and email addresses before dispatching prompt payloads to external LLM endpoints.

---

## 7. Known Limitations

1. **In-Memory Storage in Development**: In default Development mode, all APIs use Entity Framework Core's InMemory database provider. All state resets whenever an API process is stopped or restarted.
2. **Co-Restart Requirement for Member 4 & Core API**: AI case linkages and duplicate checks reference numerical sequence identifiers. When clearing or restarting in-memory state, restart `ResQnet.Member4.Api` and `ResQnet.UnifiedApi` together so case numbers remain synchronized.
3. **Simulated AI by Default**: Member 4 operates in an intelligent, rule-based simulated mode unless an external OpenAI-compatible chat-completions endpoint is configured. The relevant keys in `appsettings.json` (or environment variables) are:
   - `AI:ApiKey` (or env var `AI__ApiKey`): API secret key. If empty, the service uses rule-based simulation without network calls.
   - `AI:Endpoint` (or env var `AI__Endpoint`): Defaults to `https://api.openai.com/v1/chat/completions`.
   - `AI:Model` (or env var `AI__Model`): Defaults to `gpt-4o-mini`.
   - `AI:TimeoutSeconds` (or env var `AI__TimeoutSeconds`): HTTP timeout in seconds (default `4`).
4. **Frontend Demo Data & "Offline" Banner**: If any backend API is unreachable or not yet booted, the frontend gracefully falls back to local/demo data and displays a persistent orange "Offline" warning banner at the top of the interface.
5. **Simulated Notification Channels**: SMS, Email, and Push notification channels in Member 6 execute domain event observers and record audit logs to the database, but do not connect to live SMS/Email gateways.
6. **SQL Server Mode Not Executed End-to-End**: The five SQL Server database creation and seed scripts in `database/` have been created to define the full schema and initial data, but have not yet been run against SQL Server end-to-end.
7. **Resources & Shelters Not Connected to Approved Requests**: Member 5's resource inventory and shelter allocation management operate as dedicated modules and are not yet automatically wired to dispatch events from approved assistance requests in `UnifiedApi`.
8. **Donor Donation History**: Donors cannot currently view their personal historical donation records, as donations do not store the donor's email address.
9. **Public Registration Role Scope**: The public registration portal creates accounts only with the `Citizen` or `DonorAndVolunteer` roles. Administrative and coordinator accounts must be seeded or created by a `SystemAdmin`.
