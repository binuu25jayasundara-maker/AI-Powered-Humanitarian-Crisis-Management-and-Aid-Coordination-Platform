# Simple Database Setup — Fresh Database

Use this to create a new `ResQnet_Combined` database from the project scripts.

Project root:

```text
C:\Users\LENOVO\Desktop\123456
```

Open PowerShell there:

```powershell
cd C:\Users\LENOVO\Desktop\123456
```

---

## 1. Requirements

- Docker Desktop installed and running
- Linux containers selected
- Port `1433` free

---

## 2. Start SQL Server in Docker

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

Wait until SQL Server is ready:

```powershell
docker logs -f resqnet-sql
```

When you see:

```text
SQL Server is now ready for client connections.
```

press `Ctrl+C`.

---

## 3. Copy the SQL scripts into the container

```powershell
docker cp .\database\00_Full_ResQnet_Schema_and_Seed.sql resqnet-sql:/tmp/00_Full_ResQnet_Schema_and_Seed.sql
docker cp .\database\fix_member4_basentity_columns.sql resqnet-sql:/tmp/fix_member4_basentity_columns.sql
```

---

## 4. Create tables and seed data

Main script:

```powershell
docker exec resqnet-sql /opt/mssql-tools18/bin/sqlcmd `
  -S localhost -U sa -P "$sa" -C `
  -i /tmp/00_Full_ResQnet_Schema_and_Seed.sql
```

Required Member 4 patch:

```powershell
docker exec resqnet-sql /opt/mssql-tools18/bin/sqlcmd `
  -S localhost -U sa -P "$sa" -C -d ResQnet_Combined `
  -i /tmp/fix_member4_basentity_columns.sql
```

---

## 5. Verify

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

## 6. Start the API

```powershell
dotnet run --project .\backend\ResQnet.Api --launch-profile http
```

Swagger:

```text
http://localhost:5000/swagger
```

Seed login:

```text
coordinator@resqnet.org
Password@123
```

---

## Daily use

Start database:

```powershell
docker start resqnet-sql
```

Stop database:

```powershell
docker stop resqnet-sql
```

---

## Common problems

| Problem | Fix |
|---|---|
| Docker daemon is not running | Open Docker Desktop |
| Port `1433` already used | Change `-p 1433:1433` to `-p 1434:1433` and update the connection string |
| `Invalid column name 'CreatedAt'` | Run `fix_member4_basentity_columns.sql` again |
| Database has no tables | Run `00_Full_ResQnet_Schema_and_Seed.sql` again |

Do not run `dotnet ef database update`. This project uses SQL scripts, not EF migrations.
