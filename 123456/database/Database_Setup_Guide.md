# ResQnet.AI - Database Configuration & Setup Guide

This guide provides complete instructions for provisioning and configuring Microsoft SQL Server databases for all ResQnet.AI backend services.

> **Note on Current Status**: The SQL scripts listed below have been created to define the complete schema and initial baseline seed data for all five databases. However, they have not yet been run against SQL Server end-to-end. In the default `Development` environment, all five APIs use EF Core's InMemory provider (`"DefaultConnection": "InMemory"`).

---

### 1. Prerequisites
- **Microsoft SQL Server**: SQL Server 2019 / 2022, SQL Server Express, or LocalDB (`(localdb)\mssqllocaldb`).
- **SQL Server Management Studio (SSMS)** or **Azure Data Studio**.
- Alternatively: `sqlcmd` command line utility.

---

### 2. Databases & API Mapping

The platform partitions data across five independent domain databases:

| Database Name | SQL Script File | Backend API Service | Description |
|---|---|---|---|
| `[ResQnet_Identity]` | `01_Initial_Schema_and_Seed.sql` | `ResQnet.Member1.Api` (Port 5016) | Users, roles, organizations, and central audit log |
| `[ResQnet_AI]` | `01_Member4_AI_Schema_and_Seed.sql` | `ResQnet.Member4.Api` (Port 5157) | AI cases, recommendations, triage feedback, and forecast cache |
| `[ResQnet_Resources]` | `01_Member5_Resources_Schema_and_Seed.sql` | `ResQnet.Member5.Api` (Port 5126) | Resource inventory, shelters, household allocations, and map pins |
| `[ResQnet_Volunteers]` | `01_Member6_Schema_and_Seed.sql` | `ResQnet.Member6.Api` (Port 5006) | Volunteers, tasks, campaigns, donations, and notification records |
| `[ResQnet_Core]` | `01_Core_Schema_and_Seed.sql` | `ResQnet.UnifiedApi` (Port 5200) | Citizen assistance requests, crisis events, and status transitions |

---

### 3. Connection String Configuration

To switch an API from InMemory to SQL Server, open its `appsettings.json` (or `appsettings.Development.json`) and configure `ConnectionStrings:DefaultConnection`.

#### LocalDB Example (`(localdb)\mssqllocaldb`):
- `ResQnet.Member1.Api`:
  ```json
  "ConnectionStrings": {
    "DefaultConnection": "Server=(localdb)\\mssqllocaldb;Database=ResQnet_Identity;Trusted_Connection=True;MultipleActiveResultSets=true;TrustServerCertificate=True"
  }
  ```
- `ResQnet.Member4.Api`:
  ```json
  "ConnectionStrings": {
    "DefaultConnection": "Server=(localdb)\\mssqllocaldb;Database=ResQnet_AI;Trusted_Connection=True;MultipleActiveResultSets=true;TrustServerCertificate=True"
  }
  ```
- `ResQnet.Member5.Api`:
  ```json
  "ConnectionStrings": {
    "DefaultConnection": "Server=(localdb)\\mssqllocaldb;Database=ResQnet_Resources;Trusted_Connection=True;MultipleActiveResultSets=true;TrustServerCertificate=True"
  }
  ```
- `ResQnet.Member6.Api`:
  ```json
  "ConnectionStrings": {
    "DefaultConnection": "Server=(localdb)\\mssqllocaldb;Database=ResQnet_Volunteers;Trusted_Connection=True;MultipleActiveResultSets=true;TrustServerCertificate=True"
  }
  ```
- `ResQnet.UnifiedApi`:
  ```json
  "ConnectionStrings": {
    "DefaultConnection": "Server=(localdb)\\mssqllocaldb;Database=ResQnet_Core;Trusted_Connection=True;MultipleActiveResultSets=true;TrustServerCertificate=True"
  }
  ```

#### SQL Server Express:
Replace `Server=(localdb)\\mssqllocaldb;` with `Server=localhost\\SQLEXPRESS;`.

#### SQL Server Authentication:
```json
"DefaultConnection": "Server=localhost,1433;Database=<DatabaseName>;User Id=sa;Password=YourStrongPassword!;TrustServerCertificate=True"
```

> **Automatic In-Memory Fallback**: When `"DefaultConnection": "InMemory"` is set, each API automatically provisions an in-memory database with seeded test data for local development without needing a local SQL Server instance.

---

### 4. Running Database Scripts

#### Option A: SQL Server Management Studio (SSMS)
1. Open SSMS and connect to your SQL Server instance.
2. Open and execute the script for each database in order:
   - `database/01_Initial_Schema_and_Seed.sql` (Creates `[ResQnet_Identity]`)
   - `database/01_Member4_AI_Schema_and_Seed.sql` (Creates `[ResQnet_AI]`)
   - `database/01_Member5_Resources_Schema_and_Seed.sql` (Creates `[ResQnet_Resources]`)
   - `database/01_Member6_Schema_and_Seed.sql` (Creates `[ResQnet_Volunteers]`)
   - `database/01_Core_Schema_and_Seed.sql` (Creates `[ResQnet_Core]`)
3. Press **Execute** (`F5`) for each script.

#### Option B: Windows PowerShell (`sqlcmd`)
From the repository root:
```powershell
sqlcmd -S "(localdb)\mssqllocaldb" -i "database/01_Initial_Schema_and_Seed.sql"
sqlcmd -S "(localdb)\mssqllocaldb" -i "database/01_Member4_AI_Schema_and_Seed.sql"
sqlcmd -S "(localdb)\mssqllocaldb" -i "database/01_Member5_Resources_Schema_and_Seed.sql"
sqlcmd -S "(localdb)\mssqllocaldb" -i "database/01_Member6_Schema_and_Seed.sql"
sqlcmd -S "(localdb)\mssqllocaldb" -i "database/01_Core_Schema_and_Seed.sql"
```

---

### 5. Development Seed Accounts

All pre-seeded demo accounts use password: `Password@123`

| Email | Role | Organization | Purpose |
|---|---|---|---|
| `admin@resqnet.org` | `SystemAdmin` | DMC-LK | Platform and security administration, user/org management |
| `coordinator@resqnet.org` | `EmergencyCoordinator` | DMC-LK | Crisis ops, high-level case triage, AI recommendation approval |
| `casemanager@resqnet.org` | `CaseManager` | DMC-LK | Assistance case triage and status advancement |
| `volunteer.coord@resqnet.org` | `VolunteerCoordinator` | SLRC | Volunteer registration, task assignment, and scheduling |
| `donor.officer@resqnet.org` | `DonorOfficer` | SLRC | Fundraising campaigns and monetary/relief donation management |
| `citizen@resqnet.org` | `Citizen` | *(None / Public)* | Public citizen emergency requests and tracking |
| `logistics@resqnet.org` | `LogisticsManager` | DMC-LK | Resource warehouses, inventory, and deliveries |
| `shelter@resqnet.org` | `ShelterAdmin` | DMC-LK | Shelter capacity, intake, and over-allocation guards |
| `partner@resqnet.org` | `PartnerOfficer` | SLRC | Partner organization coordination and liaison |
