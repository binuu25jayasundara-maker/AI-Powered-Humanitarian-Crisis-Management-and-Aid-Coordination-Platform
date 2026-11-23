# ResQnet.AI — Full Setup Guide

This guide sets up the complete local system:

- SQL Server database in Docker
- Fresh schema + seed data
- Backend API
- Frontend web app
- Real Email / SMS / AI providers or simulated fallback
- Build, test, and verification commands

Project root:

```text
C:\Users\LENOVO\Desktop\123456
```

Open PowerShell there before running relative-path commands:

```powershell
cd C:\Users\LENOVO\Desktop\123456
```

---

## 1. What you need

Install these first:

| Software | Purpose |
|---|---|
| Docker Desktop | Runs SQL Server 2022 container |
| .NET SDK 10.x | Builds and runs the backend |
| Node.js + npm | Runs the React/Vite frontend |
| PowerShell | Runs setup scripts |
| Git client / editor | Optional |

Docker must be using **Linux containers**. Port **1433** must be free.

Check Docker:

```powershell
docker version
```

Check .NET:

```powershell
dotnet --version
```

Check Node/npm:

```powershell
node --version
npm --version
```

---

## 2. Project layout

```text
123456\
├── backend\
│   ├── ResQnet.slnx
│   ├── ResQnet.Api\
│   ├── ResQnet.Application\
│   ├── ResQnet.Domain\
│   ├── ResQnet.Infrastructure\
│   └── ResQnet.Tests\
├── database\
│   ├── 00_Full_ResQnet_Schema_and_Seed.sql
│   └── fix_member4_basentity_columns.sql
├── frontend\
│   ├── .env
│   └── package.json
└── docs\
    ├── start-with-external-services.ps1
    ├── test-gmail-smtp.ps1
    ├── DATABASE_SETUP_SIMPLE.md
    ├── EMAIL_FIX_GMAIL_TRANSPORT.md
    ├── UNIT_TESTING_8_2.md
    ├── api-test-results.txt
    ├── integration-test-results.txt
    └── UAT_RESULTS_8_5.md
```

Use the consolidated backend:

```text
backend/ResQnet.Api
```

Do not use `backend/standalone_members` for normal local startup.

---

## 3. Ports and URLs

| Service | URL / Port |
|---|---|
| SQL Server | `localhost,1433` |
| Backend HTTP | `http://localhost:5000` |
| Backend extra port | `http://localhost:5016` |
| Swagger | `http://localhost:5000/swagger` |
| Frontend | `http://localhost:5173` |

The frontend `.env` already points all modules to:

```text
VITE_API_URL=http://localhost:5000
```

---

## 4. Database setup — fresh database

There are no EF Core migrations. The database is created by SQL scripts.

### 4.1 Start SQL Server in Docker

```powershell
$cfg = Get-Content '.\backend\ResQnet.Api\appsettings.Development.json' -Raw | ConvertFrom-Json
$sa = ([System.Data.SqlClient.SqlConnectionStringBuilder]$cfg.ConnectionStrings.DefaultConnection).Password

docker volume create resqnet-sql-data

docker run -d `
  --name resqnet-sql `
  -e "ACCEPT_EULA=Y" `
  -e "MSSQL_SA_PASSWORD=$sa" `
  -e "MSSQL_PID=Developer" `
  -v resqnet-sql-data:/var/opt/mssql `
  -p 1433:1433 `
  mcr.microsoft.com/mssql/server:2022-latest
```

Wait until ready:

```powershell
docker logs -f resqnet-sql
```

Wait for:

```text
SQL Server is now ready for client connections.
```

Press `Ctrl+C`.

### 4.2 Copy scripts into the container

```powershell
docker cp .\database\00_Full_ResQnet_Schema_and_Seed.sql resqnet-sql:/tmp/00_Full_ResQnet_Schema_and_Seed.sql
docker cp .\database\fix_member4_basentity_columns.sql resqnet-sql:/tmp/fix_member4_basentity_columns.sql
```

### 4.3 Run main schema + seed script

```powershell
docker exec resqnet-sql /opt/mssql-tools18/bin/sqlcmd `
  -S localhost -U sa -P "$sa" -C `
  -i /tmp/00_Full_ResQnet_Schema_and_Seed.sql
```

This creates:

```text
ResQnet_Combined
```

plus tables and seed data.

### 4.4 Run required Member 4 patch

```powershell
docker exec resqnet-sql /opt/mssql-tools18/bin/sqlcmd `
  -S localhost -U sa -P "$sa" -C -d ResQnet_Combined `
  -i /tmp/fix_member4_basentity_columns.sql
```

This adds missing `CreatedAt` / `UpdatedAt` columns to:

```text
AiRecommendations
HumanDecisionAudits
DuplicateDetectionRecords
DemandForecasts
```

Without this patch, some AI/HITL API calls can fail with `Invalid column name`.

### 4.5 Verify database

```powershell
docker exec resqnet-sql /opt/mssql-tools18/bin/sqlcmd `
  -S localhost -U sa -P "$sa" -d ResQnet_Combined -C `
  -Q "SELECT DB_NAME() AS DbName, (SELECT COUNT(*) FROM sys.tables) AS Tables"
```

Expected:

```text
DbName            Tables
ResQnet_Combined  36
```

---

## 5. Backend setup

### 5.1 Restore and build

```powershell
dotnet restore .\backend\ResQnet.slnx
dotnet build .\backend\ResQnet.slnx --nologo -v minimal
```

Expected:

```text
Build succeeded.
0 Warning(s)
0 Error(s)
```

### 5.2 Run backend in simulated mode

Use this when you do not want to enter real provider credentials:

```powershell
dotnet run --project .\backend\ResQnet.Api --launch-profile http
```

In this mode:

- Email returns `deliveryMode: "Simulated"` and sends no real email.
- SMS falls back to simulated when keys are empty.
- AI uses the rule-based fallback.

Open:

```text
http://localhost:5000/swagger
```

### 5.3 Run backend with real Email / SMS / AI providers

```powershell
& '.\docs\start-with-external-services.ps1'
```

The script will:

1. Prompt for Email / SMS / AI credentials.
2. Stop any running `ResQnet.Api.exe`.
3. Shut down stale MSBuild nodes.
4. Build the solution.
5. Start the API on ports `5000` and `5016`.

Keep that terminal open. The credentials are process-scoped and are not written to disk.

Email setup details:

| Setting | Value |
|---|---|
| Provider | `Smtp` |
| Host | `smtp.gmail.com` |
| Port | `587` or `465` |
| 587 socket | `StartTls` |
| 465 socket | `SslOnConnect` |
| Auth | Gmail App Password, 16 characters |
| From | Same as `SmtpUser` |

If Gmail resets port 587, the API automatically retries on 465, and vice versa.

---

## 6. Frontend setup

### 6.1 Install packages

```powershell
npm install --prefix .\frontend
```

### 6.2 Start frontend

```powershell
npm run dev --prefix .\frontend
```

Open:

```text
http://localhost:5173
```

### 6.3 Build frontend

```powershell
npm run build --prefix .\frontend
```

Expected: TypeScript and Vite build succeeds.

---

## 7. Test accounts

Common seed users:

```text
admin@resqnet.org
citizen@resqnet.org
coordinator@resqnet.org
logistics@resqnet.org
donor.officer@resqnet.org
volunteer.coord@resqnet.org
```

Password:

```text
Password@123
```

UAT-created user:

```text
uat.citizen.1811@resqnet.org
Password@123
```

Roles:

```text
Citizen
SystemAdmin
EmergencyCoordinator
CaseManager
VolunteerCoordinator
DonorAndVolunteer
```

The Communication Center route:

```text
http://localhost:5173/communications
```

is available to Volunteer, VolunteerCoordinator, and SystemAdmin roles.

---

## 8. Quick API checks

### 8.1 Login

```powershell
$login = Invoke-RestMethod -Uri 'http://localhost:5000/api/auth/login' `
  -Method Post -ContentType 'application/json' `
  -Body '{"email":"coordinator@resqnet.org","password":"Password@123"}'

$login.data.token
```

In Swagger, click **Authorize** and paste only the JWT:

```text
eyJ...
```

Do not paste `Bearer eyJ...`.

### 8.2 Send notification

Use a new idempotency key each time:

```powershell
$token = $login.data.token
$body = @{
  recipient = 'your-address@gmail.com'
  channel = 'Email'
  subject = 'ResQnet test'
  body = 'Testing notification dispatch.'
  idempotencyKey = 'SETUP-CHECK-001'
} | ConvertTo-Json

Invoke-RestMethod -Uri 'http://localhost:5000/api/notifications/send' `
  -Method Post -Headers @{ Authorization = "Bearer $token" } `
  -ContentType 'application/json' -Body $body | ConvertTo-Json -Depth 5
```

Possible delivery modes:

| Mode | Meaning |
|---|---|
| `Live` | Real provider accepted the message |
| `Simulated` | No provider configured; no external delivery |
| `Duplicate` | Same idempotency key reused |
| `Failed` | Provider or validation error |

Only `Live` should be reported as delivered.

---

## 9. Verification commands

Backend build:

```powershell
dotnet build .\backend\ResQnet.slnx --nologo -v minimal
```

Backend tests:

```powershell
dotnet test .\backend\ResQnet.Tests\ResQnet.Tests.csproj --nologo -v minimal
```

Expected:

```text
Passed! - Failed: 0, Passed: 17, Skipped: 0, Total: 17
```

Frontend build:

```powershell
npm run build --prefix .\frontend
```

Database check:

```powershell
docker ps --filter name=resqnet-sql
```

Expected status:

```text
Up ...
0.0.0.0:1433->1433/tcp
```

Evidence files:

```text
docs/UNIT_TESTING_8_2.md
docs/api-test-results.txt
docs/integration-test-results.txt
docs/UAT_RESULTS_8_5.md
docs/EMAIL_FIX_GMAIL_TRANSPORT.md
```

---

## 10. Daily startup order

1. Start Docker Desktop.
2. Start database:

```powershell
docker start resqnet-sql
```

3. Start backend:

```powershell
dotnet run --project .\backend\ResQnet.Api --launch-profile http
```

or with real providers:

```powershell
& '.\docs\start-with-external-services.ps1'
```

4. Start frontend:

```powershell
npm run dev --prefix .\frontend
```

5. Open:

```text
http://localhost:5173
```

---

## 11. Daily shutdown

Stop backend with `Ctrl+C` in its terminal.

Stop frontend with `Ctrl+C` in its terminal.

Stop database:

```powershell
docker stop resqnet-sql
```

Do not remove the container or volume unless you have a backup.

---

## 12. Troubleshooting

| Problem | Fix |
|---|---|
| Docker daemon not reachable | Start Docker Desktop |
| Port 1433 already used | Change `-p 1433:1433` to another host port and update the connection string |
| `MSB3021/MSB3026/MSB3027 file locked` | Stop `ResQnet.Api.exe`, run `dotnet build-server shutdown`, rebuild |
| `Invalid column name 'CreatedAt'` | Run `fix_member4_basentity_columns.sql` again |
| Database has no tables | Run `00_Full_ResQnet_Schema_and_Seed.sql` again |
| Delivery Mode is `Simulated` | API was started without SMTP credentials; use the external-services script |
| Delivery Mode is `Failed` with `net_io_connectionclosed` or `unexpectedly disconnected` | Network/firewall reset; the API retries the alternate Gmail port automatically; rerun with a new idempotency key |
| SMTP `535` error | Gmail App Password/2FA problem; regenerate the App Password |
| Duplicate result | Reuse of an existing idempotency key; click **Generate New Key** |

---

## 13. Configuration and secrets

Development database settings are in:

```text
backend/ResQnet.Api/appsettings.Development.json
```

External provider secrets should be passed as environment variables by:

```text
docs/start-with-external-services.ps1
```

For deployment, use host/container secrets or environment variables. Do not paste API keys, Gmail App Passwords, or production database passwords into source files or chat.

Useful environment variables:

```text
ConnectionStrings__DefaultConnection
Notifications__Email__Provider
Notifications__Email__SmtpHost
Notifications__Email__SmtpPort
Notifications__Email__SmtpUser
Notifications__Email__SmtpPassword
Notifications__Email__SmtpSocketOptions
Notifications__Sms__Provider
Notifications__Sms__NotifyLkUserId
Notifications__Sms__NotifyLkApiKey
AI__ApiKey
AI__Endpoint
AI__Model
```

---

## 14. Known limitations

Do not claim these are implemented:

- Polly retry policies
- Transactional outbox
- EF Core explicit transactions
- SQL rowversion concurrency tokens

The implemented behaviors are:

- SQL-script schema and seed
- Process-scoped external provider configuration
- Automatic simulated fallback when credentials are missing
- Honest UI states: simulated, duplicate, failed, live
- Gmail SMTP retry across ports 587 and 465 on transport resets
