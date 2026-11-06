# ResQnet.AI - Database Configuration & Setup Guide
## Module: Member 1 (Security, RBAC, Administration & Foundation)

This guide provides complete instructions for provisioning and configuring the Microsoft SQL Server database for the ResQnet.AI platform.

---

### 1. Prerequisites
- **Microsoft SQL Server**: SQL Server 2019 / 2022, SQL Server Express, or LocalDB (`(localdb)\mssqllocaldb`).
- **SQL Server Management Studio (SSMS)** or **Azure Data Studio**.
- Alternatively: `sqlcmd` command line utility.

---

### 2. Connection String Configuration
Open `Member1_Complete_Project/backend/ResQnet.Member1.Api/appsettings.json` and adjust the connection string to match your SQL Server instance:

#### Standard LocalDB (Default):
```json
"ConnectionStrings": {
  "DefaultConnection": "Server=(localdb)\\mssqllocaldb;Database=ResQnet_Core_Db;Trusted_Connection=True;MultipleActiveResultSets=true;TrustServerCertificate=True"
}
```

#### SQL Server Express:
```json
"ConnectionStrings": {
  "DefaultConnection": "Server=localhost\\SQLEXPRESS;Database=ResQnet_Core_Db;Trusted_Connection=True;MultipleActiveResultSets=true;TrustServerCertificate=True"
}
```

#### SQL Server with SQL Authentication:
```json
"ConnectionStrings": {
  "DefaultConnection": "Server=localhost,1433;Database=ResQnet_Core_Db;User Id=sa;Password=YourStrongPassword!;TrustServerCertificate=True"
}
```

> **Automatic In-Memory Fallback**: If you do not have SQL Server installed on your testing machine, set `DefaultConnection: "InMemory"` in `appsettings.json`. The application will automatically boot an in-memory database with all seed entities populated for immediate testing!

---

### 3. Running Database Scripts via SSMS
1. Open SQL Server Management Studio and connect to your database engine.
2. Click **File -> Open -> File...** and select `01_Initial_Schema_and_Seed.sql`.
3. Click **Execute** (`F5`).
4. Verify that database `ResQnet_Core_Db` is created with tables:
   - `dbo.Organizations`
   - `dbo.Users`
   - `dbo.Roles`
   - `dbo.Permissions`
   - `dbo.RolePermissions`
   - `dbo.AuditEvents`
   - `dbo.RefreshTokens`

---

### 4. Running Database Scripts via PowerShell
In PowerShell:
```powershell
sqlcmd -S "(localdb)\mssqllocaldb" -i "01_Initial_Schema_and_Seed.sql"
```

---

### 5. Development Seed Accounts
All accounts are provisioned with default password: `Password@123`

| Email | Role | Organization | Purpose |
|-------|------|--------------|---------|
| `admin@resqnet.org` | SystemAdmin | DMC-LK | Full Security & Administration |
| `coordinator@resqnet.org` | EmergencyCoordinator | DMC-LK | Crisis Ops & Decision Approval |
| `casemanager@resqnet.org` | CaseManager | DMC-LK | Case Management & Triage |
| `volunteer.coord@resqnet.org` | VolunteerCoordinator | SLRC | Volunteer Onboarding & Tasks |
| `donor.officer@resqnet.org` | DonorOfficer | SLRC | Campaign & Donor Operations |
| `citizen@resqnet.org` | Citizen | None | Public Emergency Aid Requests |
