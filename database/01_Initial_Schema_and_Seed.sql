-- =========================================================================================
-- ResQnet.AI - Humanitarian Crisis Management & Aid Coordination Platform
-- Module: Member 1 - Foundation, Security, RBAC, Organizations, and Audit Logging
-- Target Database: Microsoft SQL Server 2019 / 2022 / Azure SQL
-- =========================================================================================

IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = N'ResQnet_Core_Db')
BEGIN
    CREATE DATABASE [ResQnet_Core_Db];
END
GO

USE [ResQnet_Core_Db];
GO

-- 1. Organizations Table
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Organizations]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[Organizations] (
        [Id] UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
        [Name] NVARCHAR(200) NOT NULL,
        [Code] NVARCHAR(50) NOT NULL UNIQUE,
        [Type] NVARCHAR(50) NOT NULL DEFAULT 'NGO', -- 'Government', 'NGO', 'International', 'VolunteerGroup'
        [ContactEmail] NVARCHAR(150) NOT NULL,
        [ContactPhone] NVARCHAR(50) NOT NULL,
        [Address] NVARCHAR(500) NOT NULL,
        [IsVerified] BIT NOT NULL DEFAULT 1,
        [VerifiedAt] DATETIME2 NULL,
        [CreatedAt] DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        [UpdatedAt] DATETIME2 NULL
    );
END
GO

-- 2. Users Table
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Users]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[Users] (
        [Id] UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
        [FullName] NVARCHAR(150) NOT NULL,
        [Email] NVARCHAR(150) NOT NULL UNIQUE,
        [PasswordHash] NVARCHAR(500) NOT NULL,
        [Role] NVARCHAR(50) NOT NULL DEFAULT 'Citizen',
        [OrganizationId] UNIQUEIDENTIFIER NULL,
        [PhoneNumber] NVARCHAR(50) NULL,
        [IsActive] BIT NOT NULL DEFAULT 1,
        [LastLoginAt] DATETIME2 NULL,
        [CreatedAt] DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        [UpdatedAt] DATETIME2 NULL,
        CONSTRAINT [FK_Users_Organizations] FOREIGN KEY ([OrganizationId]) REFERENCES [dbo].[Organizations] ([Id]) ON DELETE SET NULL
    );
    CREATE NONCLUSTERED INDEX [IX_Users_Email] ON [dbo].[Users] ([Email]);
    CREATE NONCLUSTERED INDEX [IX_Users_Role] ON [dbo].[Users] ([Role]);
END
GO

-- 3. Roles Table
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Roles]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[Roles] (
        [Id] UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
        [Name] NVARCHAR(100) NOT NULL UNIQUE,
        [Description] NVARCHAR(500) NOT NULL,
        [IsSystemRole] BIT NOT NULL DEFAULT 1,
        [CreatedAt] DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        [UpdatedAt] DATETIME2 NULL
    );
END
GO

-- 4. Permissions Table
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Permissions]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[Permissions] (
        [Id] UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
        [Code] NVARCHAR(100) NOT NULL UNIQUE,
        [Description] NVARCHAR(250) NOT NULL,
        [Category] NVARCHAR(100) NOT NULL DEFAULT 'General',
        [CreatedAt] DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        [UpdatedAt] DATETIME2 NULL
    );
END
GO

-- 5. RolePermissions Join Table
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[RolePermissions]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[RolePermissions] (
        [RoleId] UNIQUEIDENTIFIER NOT NULL,
        [PermissionId] UNIQUEIDENTIFIER NOT NULL,
        CONSTRAINT [PK_RolePermissions] PRIMARY KEY ([RoleId], [PermissionId]),
        CONSTRAINT [FK_RolePermissions_Roles] FOREIGN KEY ([RoleId]) REFERENCES [dbo].[Roles] ([Id]) ON DELETE CASCADE,
        CONSTRAINT [FK_RolePermissions_Permissions] FOREIGN KEY ([PermissionId]) REFERENCES [dbo].[Permissions] ([Id]) ON DELETE CASCADE
    );
END
GO

-- 6. AuditEvents Table
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[AuditEvents]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[AuditEvents] (
        [Id] UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
        [ActorId] NVARCHAR(150) NOT NULL,
        [ActorEmail] NVARCHAR(150) NOT NULL,
        [Action] NVARCHAR(100) NOT NULL,
        [EntityName] NVARCHAR(100) NOT NULL,
        [EntityId] NVARCHAR(100) NULL,
        [DetailsJson] NVARCHAR(MAX) NOT NULL DEFAULT '{}',
        [IpAddress] NVARCHAR(50) NULL,
        [Status] NVARCHAR(50) NOT NULL DEFAULT 'Success',
        [CreatedAt] DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        [UpdatedAt] DATETIME2 NULL
    );
    CREATE NONCLUSTERED INDEX [IX_AuditEvents_CreatedAt] ON [dbo].[AuditEvents] ([CreatedAt] DESC);
    CREATE NONCLUSTERED INDEX [IX_AuditEvents_EntityName] ON [dbo].[AuditEvents] ([EntityName]);
    CREATE NONCLUSTERED INDEX [IX_AuditEvents_ActorEmail] ON [dbo].[AuditEvents] ([ActorEmail]);
END
GO

-- 7. RefreshTokens Table
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[RefreshTokens]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[RefreshTokens] (
        [Id] UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
        [UserId] UNIQUEIDENTIFIER NOT NULL,
        [Token] NVARCHAR(500) NOT NULL UNIQUE,
        [ExpiresAt] DATETIME2 NOT NULL,
        [IsRevoked] BIT NOT NULL DEFAULT 0,
        [ReplacedByToken] NVARCHAR(500) NULL,
        [CreatedAt] DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        [UpdatedAt] DATETIME2 NULL,
        CONSTRAINT [FK_RefreshTokens_Users] FOREIGN KEY ([UserId]) REFERENCES [dbo].[Users] ([Id]) ON DELETE CASCADE
    );
END
GO

-- =========================================================================================
-- SEED DATA: Baseline Organizations, Roles, Permissions, and Default User Accounts
-- Default Password for all seed users: "Password@123"
-- BCrypt WorkFactor 11 Hash: $2a$11$sIglF1rUomq7hK1q63Qn0u8w03rZ88qR19hZkM30PzE9t9sH6nE6C
-- =========================================================================================

-- Organizations
MERGE INTO [dbo].[Organizations] AS target
USING (VALUES 
    ('11111111-1111-1111-1111-111111111111', 'National Disaster Management Centre', 'DMC-LK', 'Government', 'ops@dmc.gov.lk', '+94 11 213 6136', 'Vidya Mawatha, Colombo 07, Sri Lanka', 1, SYSUTCDATETIME()),
    ('22222222-2222-2222-2222-222222222222', 'Sri Lanka Red Cross Society', 'SLRC', 'NGO', 'info@redcross.lk', '+94 11 269 1095', 'Dharmapala Mawatha, Colombo 07', 1, SYSUTCDATETIME()),
    ('33333333-3333-3333-3333-333333333333', 'Sarvodaya Shramadana Movement', 'SARVODAYA', 'NGO', 'relief@sarvodaya.org', '+94 11 265 5255', 'Rawatawatte Road, Moratuwa', 1, SYSUTCDATETIME())
) AS source ([Id], [Name], [Code], [Type], [ContactEmail], [ContactPhone], [Address], [IsVerified], [VerifiedAt])
ON target.[Id] = source.[Id]
WHEN NOT MATCHED THEN
    INSERT ([Id], [Name], [Code], [Type], [ContactEmail], [ContactPhone], [Address], [IsVerified], [VerifiedAt])
    VALUES (source.[Id], source.[Name], source.[Code], source.[Type], source.[ContactEmail], source.[ContactPhone], source.[Address], source.[IsVerified], source.[VerifiedAt]);

-- Roles
MERGE INTO [dbo].[Roles] AS target
USING (VALUES
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'SystemAdmin', 'Full administrative security and operational configuration control', 1),
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'EmergencyCoordinator', 'Crisis command, multi-agency dispatch and critical approval', 1),
    ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'CaseManager', 'Assistance case assessment, verification and queue management', 1),
    ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'VolunteerCoordinator', 'Volunteer onboarding, skill profiling and shift scheduling', 1),
    ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'DonorOfficer', 'Fundraising campaigns, monetary gifts and transparency tracking', 1),
    ('ffffffff-ffff-ffff-ffff-ffffffffffff', 'Citizen', 'Public civilian requesting emergency assistance or viewing alerts', 1)
) AS source ([Id], [Name], [Description], [IsSystemRole])
ON target.[Name] = source.[Name]
WHEN NOT MATCHED THEN
    INSERT ([Id], [Name], [Description], [IsSystemRole])
    VALUES (source.[Id], source.[Name], source.[Description], source.[IsSystemRole]);

-- Seed Users (Password@123)
-- BCrypt representation generated at runtime
MERGE INTO [dbo].[Users] AS target
USING (VALUES
    ('Platform Administrator', 'admin@resqnet.org', '$2a$11$F6n1q7vjXh37pQ5Fk22D4euOQW8/pYmP50l72L4uWlKzU0K7o4r6S', 'SystemAdmin', '11111111-1111-1111-1111-111111111111', '+94 77 123 4567', 1),
    ('Chaminda Silva', 'coordinator@resqnet.org', '$2a$11$F6n1q7vjXh37pQ5Fk22D4euOQW8/pYmP50l72L4uWlKzU0K7o4r6S', 'EmergencyCoordinator', '11111111-1111-1111-1111-111111111111', '+94 77 234 5678', 1),
    ('Nadeesha Perera', 'casemanager@resqnet.org', '$2a$11$F6n1q7vjXh37pQ5Fk22D4euOQW8/pYmP50l72L4uWlKzU0K7o4r6S', 'CaseManager', '11111111-1111-1111-1111-111111111111', '+94 77 345 6789', 1),
    ('Kasun Jayawardena', 'volunteer.coord@resqnet.org', '$2a$11$F6n1q7vjXh37pQ5Fk22D4euOQW8/pYmP50l72L4uWlKzU0K7o4r6S', 'VolunteerCoordinator', '22222222-2222-2222-2222-222222222222', '+94 77 456 7890', 1),
    ('Anura Fernando', 'donor.officer@resqnet.org', '$2a$11$F6n1q7vjXh37pQ5Fk22D4euOQW8/pYmP50l72L4uWlKzU0K7o4r6S', 'DonorOfficer', '22222222-2222-2222-2222-222222222222', '+94 77 567 8901', 1),
    ('Sunil Weerasinghe', 'citizen@resqnet.org', '$2a$11$F6n1q7vjXh37pQ5Fk22D4euOQW8/pYmP50l72L4uWlKzU0K7o4r6S', 'Citizen', NULL, '+94 77 678 9012', 1)
) AS source ([FullName], [Email], [PasswordHash], [Role], [OrganizationId], [PhoneNumber], [IsActive])
ON target.[Email] = source.[Email]
WHEN NOT MATCHED THEN
    INSERT ([FullName], [Email], [PasswordHash], [Role], [OrganizationId], [PhoneNumber], [IsActive])
    VALUES (source.[FullName], source.[Email], source.[PasswordHash], source.[Role], source.[OrganizationId], source.[PhoneNumber], source.[IsActive]);

PRINT 'ResQnet Member 1 Database initialization and baseline seed script executed successfully.';
GO
