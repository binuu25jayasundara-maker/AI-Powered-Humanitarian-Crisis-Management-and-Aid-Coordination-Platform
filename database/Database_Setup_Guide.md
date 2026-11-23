# ResQnet.AI - Database Configuration & Setup Guide

This guide provides complete instructions for provisioning and configuring Microsoft SQL Server databases for the consolidated ResQnet.AI platform and its standalone member modules.

---

### 1. Overview of Database Setup

ResQnet supports two database options:

1. **Option 1: Built-in In-Memory Database (Default / Zero-Config)**
   - Enabled by default in development (`"DefaultConnection": "InMemory"`).
   - Starts instantly with pre-seeded demo users, organizations, cases, shelters, and requests.
   - Requires no SQL Server installation.

2. **Option 2: Microsoft SQL Server (Single Consolidated Database or Per-Module)**
   - **Unified Script**: `database/00_Full_ResQnet_Schema_and_Seed.sql` creates and seeds the complete `[ResQnet_Combined]` database with all tables across all domains.
   - **Standalone Member Scripts**: Preserved for individual member submissions:
     - `01_Member1_Schema_and_Seed.sql` (Creates `[ResQnet_Identity]`)
     - `02_Member6_Schema_and_Seed.sql` (Creates `[ResQnet_Volunteers]`)

---

### 2. Unified Database Execution

To provision the complete unified database:

#### Using `sqlcmd` (LocalDB):
```powershell
sqlcmd -S "(localdb)\mssqllocaldb" -i "database/00_Full_ResQnet_Schema_and_Seed.sql"
```

#### Using `sqlcmd` (Docker / SQL Server Express):
```powershell
sqlcmd -S localhost,1433 -U sa -P "YourStrong@Password123" -i "database/00_Full_ResQnet_Schema_and_Seed.sql"
```

#### Using SSMS or Azure Data Studio:
1. Open SQL Server Management Studio and connect to your SQL Server instance.
2. Open `database/00_Full_ResQnet_Schema_and_Seed.sql`.
3. Press **Execute** (`F5`).

---

### 3. Connection String Configuration

To switch `ResQnet.Api` from InMemory to your SQL Server database:

Open [backend/ResQnet.Api/appsettings.Development.json](file:///c:/Users/LENOVO/Desktop/New%20folder/New%20folder/123456/backend/ResQnet.Api/appsettings.Development.json):

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=(localdb)\\mssqllocaldb;Database=ResQnet_Combined;Trusted_Connection=True;MultipleActiveResultSets=true;TrustServerCertificate=True"
  }
}
```

Or for SQL Server Express / Docker:
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=localhost,1433;Database=ResQnet_Combined;User Id=sa;Password=YourStrong@Password123;TrustServerCertificate=True"
  }
}
```

---

### 4. Development Seed Accounts

All pre-seeded demo accounts share the password: **`Password@123`**

| Email | Role | Organization | Primary Responsibility |
|---|---|---|---|
| `admin@resqnet.org` | `SystemAdmin` | DMC-LK | Security controls, user & org management, audit trail |
| `coordinator@resqnet.org` | `EmergencyCoordinator` | DMC-LK | Crisis event oversight & high-level AI triage approvals |
| `casemanager@resqnet.org` | `CaseManager` | DMC-LK | Citizen assistance request review & verification |
| `volunteer.coord@resqnet.org` | `VolunteerCoordinator` | SLRC | Volunteer registration, scheduling & task assignment |
| `donor.officer@resqnet.org` | `DonorOfficer` | SLRC | Fundraising campaigns & monetary donations |
| `citizen@resqnet.org` | `Citizen` | *(Public)* | Submitting emergency aid requests & live tracking |
| `logistics@resqnet.org` | `LogisticsManager` | DMC-LK | Warehouse inventory management & deliveries |
| `shelter@resqnet.org` | `ShelterAdmin` | DMC-LK | Shelter capacity, household intake & concurrency |
| `partner@resqnet.org` | `PartnerOfficer` | SLRC | Relief agency liaison & external partner coordination |
