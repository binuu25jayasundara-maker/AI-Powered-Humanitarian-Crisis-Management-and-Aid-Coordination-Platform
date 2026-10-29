# ResQnet.AI — Member 1: Architecture, Security, RBAC & Administration
**Coursework**: SE205.3 Software Architecture (University Group Project 2026)  
**System**: AI-Powered Humanitarian Crisis Management and Aid Coordination Platform  
**Assigned Vertical Slice**: Foundation, Authentication (JWT), RBAC Security Policies, Password Hashing, Organizations, User Management, and Centralized Audit Trail Services.

---

## 1. Responsibilities & Architecture Overview
Member 1 delivers the structural foundation for the entire multi-agency platform:
- **Clean Layered Architecture**: Strict separation of concerns into Domain, Application, Infrastructure, and API layers.
- **Enterprise Design Patterns**:
  - **Repository Pattern (`IRepository<T>`)**: Decouples domain entities from data access logic.
  - **Unit of Work Pattern (`IUnitOfWork`)**: Encapsulates database transactions across multiple entities.
  - **Dependency Injection**: Registered across all layers with clean interface contracts.
- **Security & Authorization**:
  - Secure password hashing using BCrypt (work factor 11).
  - JWT token generation with claims-based authorization and refresh token rotation.
  - Role-Based Access Control (RBAC) with policies (`AdminOnly`, `StaffOnly`).
  - Immutable audit logging (`IAuditService`) used across the entire platform.
- **Frontend User Experience**:
  - Pixel-accurate reproduction of the official UI design screenshot (`1 · Login / Register`).
  - Split brand card with feature bullet points and responsive sign in form.
  - Role dropdown selector with instant demo auto-fill for testing.
  - Direct public distress dispatch (`Emergency help without login`).
  - Administration dashboards for Users, RBAC Matrix, Organizations, and Audit Trail Viewer.

---

## 2. Solution Structure
```
Member1_Complete_Project/
├── backend/
│   ├── ResQnet.Member1.sln           # Visual Studio 2022/2025 classic solution
│   ├── ResQnet.Member1.slnx          # Modern XML solution
│   ├── ResQnet.Member1.Domain/       # Domain Entities (User, Role, Org, AuditEvent, RefreshToken)
│   ├── ResQnet.Member1.Application/  # DTOs, Interfaces, UnitOfWork, AuthService, UserService, AuditService
│   ├── ResQnet.Member1.Infrastructure/# EF Core ApplicationDbContext, BCrypt Hasher, JWT Generator, Repositories
│   ├── ResQnet.Member1.Api/          # Controllers, Middleware, Swagger, Program.cs
│   └── ResQnet.Member1.Tests/        # xUnit Test Suite (Unit and security tests)
├── frontend/                         # React 18 + TypeScript + Vite UI
│   ├── src/
│   │   ├── components/               # Header, Sidebar, ProtectedRoute
│   │   ├── pages/                    # LoginPage (Exact UI), RegisterPage, UsersAdmin, RolesAdmin, Organizations, AuditLogs, EmergencyHelp
│   │   ├── context/                  # AuthContext
│   │   ├── services/                 # api.ts (REST client with automatic offline demo fallback)
│   │   └── styles/                   # tokens.css, global.css
├── database/
│   ├── 01_Initial_Schema_and_Seed.sql# Production SQL Server setup script
│   └── Database_Setup_Guide.md       # Step-by-step configuration guide
├── docs/                             # Architecture and API specifications
├── .env.example
└── README.md
```

---

## 3. Database Setup (SQL Server)
The database can be configured in two ways:
### Option A: SQL Server (Recommended)
1. Open SQL Server Management Studio (SSMS).
2. Open `database/01_Initial_Schema_and_Seed.sql` and execute (`F5`).
3. The database `ResQnet_Core_Db` is created with all tables, constraints, foreign keys, and seed data.

### Option B: Automatic In-Memory Fallback
If SQL Server is not running on the evaluator's workstation, the API automatically falls back to an in-memory database and seeds all accounts seamlessly upon launch!

---

## 4. Running the Backend (ASP.NET Core Web API)
Using Windows PowerShell:
```powershell
cd backend/ResQnet.Member1.Api
dotnet run
```
The API starts on `http://localhost:5000` (or configured HTTPS port).
- **Swagger Documentation**: Open `http://localhost:5000/swagger` in your browser.

---

## 5. Running the Unit Tests
To run all automated xUnit tests:
```powershell
cd backend
dotnet test ResQnet.Member1.slnx
```
**Test Results**: 6 passed, 0 failed, covering:
- BCrypt password hashing and validation.
- JWT token claim issuance and expiration.
- User authentication with valid/invalid credentials.
- Audit trail record creation and formatting.
- Generic repository CRUD operations.

---

## 6. Running the Frontend (React + Vite + TypeScript)
```powershell
cd frontend
npm.cmd install
npm.cmd run dev
```
Open `http://localhost:5173` in your browser.

---

## 7. Default Seed Test Accounts
All accounts use password: `Password@123`

| Email | Role | Function |
|---|---|---|
| `admin@resqnet.org` | SystemAdmin | Full administrative security control |
| `coordinator@resqnet.org` | EmergencyCoordinator | Crisis operations and case approval |
| `casemanager@resqnet.org` | CaseManager | Case triage and evidence review |
| `volunteer.coord@resqnet.org` | VolunteerCoordinator | Volunteer onboarding and scheduling |
| `donor.officer@resqnet.org` | DonorOfficer | Donor and campaign management |
| `citizen@resqnet.org` | Citizen | Public aid request submission |
