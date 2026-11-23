-- =========================================================================================
-- ResQnet.AI - Humanitarian Crisis Management & Aid Coordination Platform
-- Unified Database Schema & Baseline Seed Data
-- Target Database: Microsoft SQL Server 2019 / 2022 / Azure SQL / LocalDB
-- Database Name: [ResQnet_Combined]
-- =========================================================================================

IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = N'ResQnet_Combined')
BEGIN
    CREATE DATABASE [ResQnet_Combined];
END
GO

USE [ResQnet_Combined];
GO

-- =========================================================================================
-- SECTION: 01_Initial_Schema_and_Seed.sql
-- =========================================================================================
-- =========================================================================================
-- ResQnet.AI - Humanitarian Crisis Management & Aid Coordination Platform
-- Module: Member 1 - Foundation, Security, RBAC, Organizations, and Audit Logging
-- Target Database: Microsoft SQL Server 2019 / 2022 / Azure SQL
-- =========================================================================================





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
    ('ffffffff-ffff-ffff-ffff-ffffffffffff', 'Citizen', 'Public civilian requesting emergency assistance or viewing alerts', 1),
    ('11111111-2222-3333-4444-555555555555', 'LogisticsManager', 'Resource warehouse and delivery management', 1),
    ('22222222-3333-4444-5555-666666666666', 'ShelterAdmin', 'Shelter capacity and occupancy administrator', 1),
    ('33333333-4444-5555-6666-777777777777', 'PartnerOfficer', 'Partner organization coordination and relief aid liaison', 1)
) AS source ([Id], [Name], [Description], [IsSystemRole])
ON target.[Name] = source.[Name]
WHEN NOT MATCHED THEN
    INSERT ([Id], [Name], [Description], [IsSystemRole])
    VALUES (source.[Id], source.[Name], source.[Description], source.[IsSystemRole]);

-- Seed Users (Password@123)
-- BCrypt representation generated at runtime
MERGE INTO [dbo].[Users] AS target
USING (VALUES
    ('Platform Administrator', 'admin@resqnet.org', '$2a$11$NsntVFmv9BtohB744CW89eWxVTD.zwritpmH87ZCsM3XoeBHwNB56', 'SystemAdmin', '11111111-1111-1111-1111-111111111111', '+94 77 123 4567', 1),
    ('Chaminda Silva', 'coordinator@resqnet.org', '$2a$11$NsntVFmv9BtohB744CW89eWxVTD.zwritpmH87ZCsM3XoeBHwNB56', 'EmergencyCoordinator', '11111111-1111-1111-1111-111111111111', '+94 77 234 5678', 1),
    ('Nadeesha Perera', 'casemanager@resqnet.org', '$2a$11$NsntVFmv9BtohB744CW89eWxVTD.zwritpmH87ZCsM3XoeBHwNB56', 'CaseManager', '11111111-1111-1111-1111-111111111111', '+94 77 345 6789', 1),
    ('Kasun Jayawardena', 'volunteer.coord@resqnet.org', '$2a$11$NsntVFmv9BtohB744CW89eWxVTD.zwritpmH87ZCsM3XoeBHwNB56', 'VolunteerCoordinator', '22222222-2222-2222-2222-222222222222', '+94 77 456 7890', 1),
    ('Anura Fernando', 'donor.officer@resqnet.org', '$2a$11$NsntVFmv9BtohB744CW89eWxVTD.zwritpmH87ZCsM3XoeBHwNB56', 'DonorOfficer', '22222222-2222-2222-2222-222222222222', '+94 77 567 8901', 1),
    ('Sunil Weerasinghe', 'citizen@resqnet.org', '$2a$11$NsntVFmv9BtohB744CW89eWxVTD.zwritpmH87ZCsM3XoeBHwNB56', 'Citizen', NULL, '+94 77 678 9012', 1),
    ('Logistics Manager', 'logistics@resqnet.org', '$2a$11$NsntVFmv9BtohB744CW89eWxVTD.zwritpmH87ZCsM3XoeBHwNB56', 'LogisticsManager', '11111111-1111-1111-1111-111111111111', '+94 77 789 0123', 1),
    ('Shelter Administrator', 'shelter@resqnet.org', '$2a$11$NsntVFmv9BtohB744CW89eWxVTD.zwritpmH87ZCsM3XoeBHwNB56', 'ShelterAdmin', '11111111-1111-1111-1111-111111111111', '+94 77 890 1234', 1),
    ('Partner Officer', 'partner@resqnet.org', '$2a$11$NsntVFmv9BtohB744CW89eWxVTD.zwritpmH87ZCsM3XoeBHwNB56', 'PartnerOfficer', '22222222-2222-2222-2222-222222222222', '+94 77 901 2345', 1)
) AS source ([FullName], [Email], [PasswordHash], [Role], [OrganizationId], [PhoneNumber], [IsActive])
ON target.[Email] = source.[Email]
WHEN NOT MATCHED THEN
    INSERT ([FullName], [Email], [PasswordHash], [Role], [OrganizationId], [PhoneNumber], [IsActive])
    VALUES (source.[FullName], source.[Email], source.[PasswordHash], source.[Role], source.[OrganizationId], source.[PhoneNumber], source.[IsActive]);

PRINT 'ResQnet Member 1 Database initialization and baseline seed script executed successfully.';
GO
GO


-- =========================================================================================
-- SECTION: 01_Member4_AI_Schema_and_Seed.sql
-- =========================================================================================
-- =========================================================================================
-- ResQnet.AI - Humanitarian Crisis Management & Aid Coordination Platform
-- Module: Member 4 - AI Decision-Support Services & Human-in-the-Loop Governance
-- Target Database: Microsoft SQL Server 2019 / 2022 / Azure SQL
-- =========================================================================================





-- 1. CrisisCases Table
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[CrisisCases]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[CrisisCases] (
        [Id] UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
        [CaseNumber] NVARCHAR(50) NOT NULL UNIQUE, -- e.g. '#2341', '#2187'
        [Title] NVARCHAR(250) NOT NULL, -- e.g. 'Flood, Kandyyva'
        [Location] NVARCHAR(250) NOT NULL,
        [RequestDetails] NVARCHAR(MAX) NOT NULL,
        [Evidence] NVARCHAR(MAX) NOT NULL,
        [Status] NVARCHAR(50) NOT NULL DEFAULT 'Assessed - awaiting approval', -- 'Assessed - awaiting approval', 'Approved', 'Modified', 'Rejected', 'Deferred'
        [AssignedAgency] NVARCHAR(100) NULL DEFAULT 'DMC-LK',
        [CreatedAt] DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        [UpdatedAt] DATETIME2 NULL
    );
    CREATE NONCLUSTERED INDEX [IX_CrisisCases_CaseNumber] ON [dbo].[CrisisCases] ([CaseNumber]);
    CREATE NONCLUSTERED INDEX [IX_CrisisCases_Status] ON [dbo].[CrisisCases] ([Status]);
END
GO

-- 2. AiRecommendations Table
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[AiRecommendations]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[AiRecommendations] (
        [Id] UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
        [CaseId] UNIQUEIDENTIFIER NOT NULL,
        [Category] NVARCHAR(100) NOT NULL, -- 'Disaster Relief', 'Emergency Medical', 'Food Supplies', 'Rescue / Evacuation'
        [Urgency] NVARCHAR(100) NOT NULL, -- 'High - immediate assistance needed.', 'Critical', 'Medium', 'Low'
        [ViewRecommendation] NVARCHAR(MAX) NOT NULL, -- 'Provide shelter, food supplies, medical aid.'
        [SuggestAction] NVARCHAR(MAX) NOT NULL, -- 'Coordinate with local authorities and NGOs.'
        [PriorityScore] INT NOT NULL DEFAULT 85, -- 0 - 100
        [Confidence] DECIMAL(5,2) NOT NULL DEFAULT 0.92, -- 0.00 - 1.00
        [Rationale] NVARCHAR(MAX) NOT NULL,
        [ProviderStrategy] NVARCHAR(100) NOT NULL DEFAULT 'RuleBasedStrategy',
        [GeneratedAt] DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        CONSTRAINT [FK_AiRecommendations_CrisisCases] FOREIGN KEY ([CaseId]) REFERENCES [dbo].[CrisisCases] ([Id]) ON DELETE CASCADE
    );
    CREATE NONCLUSTERED INDEX [IX_AiRecommendations_CaseId] ON [dbo].[AiRecommendations] ([CaseId]);
END
GO

-- 3. HumanDecisionAudits Table (Human-in-the-Loop Governance Requirement)
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[HumanDecisionAudits]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[HumanDecisionAudits] (
        [Id] UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
        [CaseId] UNIQUEIDENTIFIER NOT NULL,
        [OriginalRecommendationJson] NVARCHAR(MAX) NOT NULL,
        [ActionTaken] NVARCHAR(50) NOT NULL, -- 'Approve', 'Modify', 'Reject', 'Defer'
        [ModificationsJson] NVARCHAR(MAX) NULL DEFAULT '{}',
        [Justification] NVARCHAR(MAX) NULL,
        [ReviewerId] NVARCHAR(150) NOT NULL,
        [ReviewerEmail] NVARCHAR(150) NOT NULL,
        [DecidedAt] DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        CONSTRAINT [FK_HumanDecisionAudits_CrisisCases] FOREIGN KEY ([CaseId]) REFERENCES [dbo].[CrisisCases] ([Id]) ON DELETE CASCADE
    );
    CREATE NONCLUSTERED INDEX [IX_HumanDecisionAudits_CaseId] ON [dbo].[HumanDecisionAudits] ([CaseId]);
    CREATE NONCLUSTERED INDEX [IX_HumanDecisionAudits_Reviewer] ON [dbo].[HumanDecisionAudits] ([ReviewerEmail]);
END
GO

-- 4. DuplicateDetectionRecords Table (Flags duplicates without deleting)
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[DuplicateDetectionRecords]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[DuplicateDetectionRecords] (
        [Id] UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
        [PrimaryCaseId] UNIQUEIDENTIFIER NOT NULL,
        [SuspectedDuplicateNumber] NVARCHAR(50) NOT NULL, -- e.g. '#2187 - Flood (Kandy)'
        [SimilarityScore] DECIMAL(5,2) NOT NULL DEFAULT 0.74,
        [RiskLevel] NVARCHAR(50) NOT NULL DEFAULT 'Medium', -- 'Low', 'Medium', 'High'
        [Rationale] NVARCHAR(MAX) NOT NULL,
        [FlaggedAt] DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        CONSTRAINT [FK_Duplicates_CrisisCases] FOREIGN KEY ([PrimaryCaseId]) REFERENCES [dbo].[CrisisCases] ([Id]) ON DELETE CASCADE
    );
END
GO

-- 5. DemandForecasts Table
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[DemandForecasts]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[DemandForecasts] (
        [Id] UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
        [Region] NVARCHAR(150) NOT NULL,
        [DisasterType] NVARCHAR(100) NOT NULL,
        [ResourceCategory] NVARCHAR(100) NOT NULL,
        [ProjectedQuantity] INT NOT NULL,
        [Unit] NVARCHAR(50) NOT NULL,
        [Confidence] DECIMAL(5,2) NOT NULL,
        [ForecastPeriod] NVARCHAR(100) NOT NULL,
        [GeneratedAt] DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
    );
END
GO

-- =========================================================================================
-- SEED DATA: Case #2341 (Exact Match to Screenshot 11) and Case #2187
-- =========================================================================================

-- Seed Primary Case #2341
DECLARE @Case2341Id UNIQUEIDENTIFIER = '12345678-2341-2341-2341-123456789abc';
DECLARE @Case2187Id UNIQUEIDENTIFIER = '12345678-2187-2187-2187-123456789abc';

IF NOT EXISTS (SELECT 1 FROM [dbo].[CrisisCases] WHERE [CaseNumber] = '#2341')
BEGIN
    INSERT INTO [dbo].[CrisisCases] ([Id], [CaseNumber], [Title], [Location], [RequestDetails], [Evidence], [Status], [AssignedAgency])
    VALUES (
        @Case2341Id,
        '#2341',
        'Flood, Kandyyva',
        'Kandyya, Central Province, Sri Lanka',
        'Emergency shelter, food, and medical assistance required.',
        'Photos, news reports, witness statements.',
        'Assessed - awaiting approval',
        'DMC-LK'
    );
END

-- Seed Previous Case #2187
IF NOT EXISTS (SELECT 1 FROM [dbo].[CrisisCases] WHERE [CaseNumber] = '#2187')
BEGIN
    INSERT INTO [dbo].[CrisisCases] ([Id], [CaseNumber], [Title], [Location], [RequestDetails], [Evidence], [Status], [AssignedAgency])
    VALUES (
        @Case2187Id,
        '#2187',
        'Flood (Kandy)',
        'Kandy Municipal Area',
        'Request for food rations and family tents following river overflow.',
        'Local authority field verification report.',
        'Approved',
        'SLRC'
    );
END

-- Seed AI Recommendation for Case #2341 (Exact match to Screenshot 11)
IF NOT EXISTS (SELECT 1 FROM [dbo].[AiRecommendations] WHERE [CaseId] = @Case2341Id)
BEGIN
    INSERT INTO [dbo].[AiRecommendations] 
    ([Id], [CaseId], [Category], [Urgency], [ViewRecommendation], [SuggestAction], [PriorityScore], [Confidence], [Rationale], [ProviderStrategy])
    VALUES (
        NEWID(),
        @Case2341Id,
        'Disaster Relief',
        'High - immediate assistance needed.',
        'Provide shelter, food supplies, medical aid.',
        'Coordinate with local authorities and NGOs.',
        88,
        0.94,
        'NLP multi-factor scoring classified as Disaster Relief based on compound terms (flood, shelter, medical). High urgency triggered due to vulnerable displaced family count and road closures.',
        'RuleBasedStrategy'
    );
END

-- Seed Duplicate Flag for Case #2341 matching #2187
IF NOT EXISTS (SELECT 1 FROM [dbo].[DuplicateDetectionRecords] WHERE [PrimaryCaseId] = @Case2341Id)
BEGIN
    INSERT INTO [dbo].[DuplicateDetectionRecords]
    ([Id], [PrimaryCaseId], [SuspectedDuplicateNumber], [SimilarityScore], [RiskLevel], [Rationale])
    VALUES (
        NEWID(),
        @Case2341Id,
        '#2187 - Flood (Kandy)',
        0.74,
        'Medium',
        'High text and geographical overlap (Kandy flood sector). Both requests involve shelter and food aid within 48-hour event window.'
    );
END

-- Seed Baseline Demand Forecasts
IF NOT EXISTS (SELECT 1 FROM [dbo].[DemandForecasts])
BEGIN
    INSERT INTO [dbo].[DemandForecasts] ([Region], [DisasterType], [ResourceCategory], [ProjectedQuantity], [Unit], [Confidence], [ForecastPeriod])
    VALUES 
    ('Kandyya District', 'Monsoon Flood', 'Emergency Rations', 15000, 'Meals', 0.89, 'Next 72 Hours'),
    ('Kandyya District', 'Monsoon Flood', 'Family Shelters', 350, 'Tents', 0.84, 'Next 72 Hours'),
    ('Kandyya District', 'Monsoon Flood', 'First Aid Trauma Kits', 800, 'Kits', 0.91, 'Next 72 Hours');
END

PRINT 'ResQnet Member 4 AI & HITL Database schema and seed data created successfully.';
GO
GO


-- =========================================================================================
-- SECTION: 01_Member5_Resources_Schema_and_Seed.sql
-- =========================================================================================
-- =========================================================================================
-- ResQnet.AI - Humanitarian Crisis Management & Aid Coordination Platform
-- Module: Member 5 - Resources, Logistics, Shelters, and Tactical Maps
-- Target Database: Microsoft SQL Server 2019 / 2022 / Azure SQL
-- =========================================================================================





-- 1. Resources Table
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Resources]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[Resources] (
        [Id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        [Name] NVARCHAR(120) NOT NULL,
        [Category] NVARCHAR(80) NOT NULL,
        [AvailableQuantity] INT NOT NULL DEFAULT 0,
        [AllocatedQuantity] INT NOT NULL DEFAULT 0,
        [MinimumStockLevel] INT NOT NULL DEFAULT 0,
        [Unit] NVARCHAR(30) NOT NULL DEFAULT 'units',
        [Status] NVARCHAR(40) NOT NULL DEFAULT 'Normal',
        [UpdatedAt] DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
    );
    CREATE NONCLUSTERED INDEX [IX_Resources_Category] ON [dbo].[Resources] ([Category]);
    CREATE NONCLUSTERED INDEX [IX_Resources_Status] ON [dbo].[Resources] ([Status]);
END
GO

-- 2. Shelters Table
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Shelters]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[Shelters] (
        [Id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        [Name] NVARCHAR(150) NOT NULL,
        [Location] NVARCHAR(255) NOT NULL,
        [Latitude] FLOAT NOT NULL DEFAULT 0,
        [Longitude] FLOAT NOT NULL DEFAULT 0,
        [TotalCapacity] INT NOT NULL DEFAULT 100,
        [CurrentOccupancy] INT NOT NULL DEFAULT 0,
        [OperationalStatus] NVARCHAR(50) NOT NULL DEFAULT 'Open',
        [FacilitiesRaw] NVARCHAR(MAX) NOT NULL DEFAULT 'Meals,Drinking Water,Sanitation',
        [ContactPerson] NVARCHAR(100) NOT NULL DEFAULT 'Site Coordinator',
        [ContactPhone] NVARCHAR(50) NOT NULL DEFAULT '+94 11 291 0000',
        [LastUpdated] DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
    );
    CREATE NONCLUSTERED INDEX [IX_Shelters_OperationalStatus] ON [dbo].[Shelters] ([OperationalStatus]);
END
GO

-- 3. ResourceAllocations Table
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[ResourceAllocations]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[ResourceAllocations] (
        [Id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        [ResourceId] INT NOT NULL,
        [DestinationType] NVARCHAR(50) NOT NULL DEFAULT 'Shelter',
        [DestinationShelterId] INT NULL,
        [DestinationShelterName] NVARCHAR(150) NULL,
        [EmergencyRequestId] NVARCHAR(50) NULL,
        [Quantity] INT NOT NULL DEFAULT 1,
        [AllocatedBy] NVARCHAR(100) NOT NULL DEFAULT 'Staff',
        [Notes] NVARCHAR(255) NOT NULL DEFAULT '',
        [Status] NVARCHAR(40) NOT NULL DEFAULT 'Allocated',
        [AllocatedAt] DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        CONSTRAINT [FK_ResourceAllocations_Resources] FOREIGN KEY ([ResourceId]) REFERENCES [dbo].[Resources] ([Id]) ON DELETE NO ACTION
    );
    CREATE NONCLUSTERED INDEX [IX_ResourceAllocations_ResourceId] ON [dbo].[ResourceAllocations] ([ResourceId]);
END
GO

-- 4. HouseholdAllocations Table
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[HouseholdAllocations]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[HouseholdAllocations] (
        [Id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        [ShelterId] INT NOT NULL,
        [HouseholdHeadName] NVARCHAR(150) NOT NULL,
        [CaseReferenceId] NVARCHAR(60) NULL,
        [NumberOfPeople] INT NOT NULL DEFAULT 1,
        [SpecialNeeds] NVARCHAR(255) NOT NULL DEFAULT '',
        [AllocatedBy] NVARCHAR(100) NOT NULL DEFAULT 'Shelter Admin',
        [Status] NVARCHAR(50) NOT NULL DEFAULT 'Confirmed',
        [AllocatedAt] DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        CONSTRAINT [FK_HouseholdAllocations_Shelters] FOREIGN KEY ([ShelterId]) REFERENCES [dbo].[Shelters] ([Id]) ON DELETE CASCADE
    );
    CREATE NONCLUSTERED INDEX [IX_HouseholdAllocations_ShelterId] ON [dbo].[HouseholdAllocations] ([ShelterId]);
END
GO

-- 5. PartnerSupportRequests Table
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[PartnerSupportRequests]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[PartnerSupportRequests] (
        [Id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        [RequiredResource] NVARCHAR(120) NOT NULL,
        [QuantityRequired] INT NOT NULL DEFAULT 1,
        [RequestingLocation] NVARCHAR(150) NOT NULL,
        [Priority] NVARCHAR(40) NOT NULL DEFAULT 'High',
        [Reason] NVARCHAR(500) NOT NULL,
        [Status] NVARCHAR(50) NOT NULL DEFAULT 'Pending',
        [PartnerOrganization] NVARCHAR(120) NULL,
        [CreatedAt] DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
    );
END
GO

-- 6. ShelterSupplyRequests Table
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[ShelterSupplyRequests]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[ShelterSupplyRequests] (
        [Id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        [ShelterId] INT NOT NULL,
        [ShelterName] NVARCHAR(150) NOT NULL,
        [RequestedResource] NVARCHAR(100) NOT NULL,
        [Quantity] INT NOT NULL DEFAULT 1,
        [Priority] NVARCHAR(40) NOT NULL DEFAULT 'High',
        [Reason] NVARCHAR(500) NOT NULL DEFAULT '',
        [Status] NVARCHAR(50) NOT NULL DEFAULT 'Pending',
        [CreatedAt] DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        CONSTRAINT [FK_ShelterSupplyRequests_Shelters] FOREIGN KEY ([ShelterId]) REFERENCES [dbo].[Shelters] ([Id]) ON DELETE CASCADE
    );
    CREATE NONCLUSTERED INDEX [IX_ShelterSupplyRequests_ShelterId] ON [dbo].[ShelterSupplyRequests] ([ShelterId]);
END
GO

-- 7. EmergencyRequests Table
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[EmergencyRequests]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[EmergencyRequests] (
        [Id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        [RequestIdentifier] NVARCHAR(50) NOT NULL,
        [Category] NVARCHAR(80) NOT NULL DEFAULT 'Medical',
        [Location] NVARCHAR(200) NOT NULL,
        [Latitude] FLOAT NOT NULL DEFAULT 0,
        [Longitude] FLOAT NOT NULL DEFAULT 0,
        [Priority] NVARCHAR(40) NOT NULL DEFAULT 'CRITICAL',
        [CurrentStatus] NVARCHAR(50) NOT NULL DEFAULT 'Pending',
        [PeopleCount] INT NOT NULL DEFAULT 1,
        [Description] NVARCHAR(500) NOT NULL DEFAULT '',
        [ReportedAt] DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
    );
END
GO

-- 8. FloodZones Table
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[FloodZones]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[FloodZones] (
        [Id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        [ZoneName] NVARCHAR(150) NOT NULL,
        [SeverityLevel] NVARCHAR(80) NOT NULL DEFAULT 'High Risk',
        [WaterLevelTrend] NVARCHAR(80) NOT NULL DEFAULT 'Rising (+0.3m/hr)',
        [EstimatedAffectedPopulation] INT NOT NULL DEFAULT 0,
        [EvacuationStatus] NVARCHAR(100) NOT NULL DEFAULT 'Mandatory Evacuation',
        [PolygonCoordinatesJson] NVARCHAR(MAX) NOT NULL DEFAULT '[]',
        [CenterLatitude] FLOAT NOT NULL DEFAULT 0,
        [CenterLongitude] FLOAT NOT NULL DEFAULT 0,
        [LastUpdated] DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
    );
END
GO

-- =========================================================================================
-- SEED DATA: Exact baseline matching ResQnet.Member5.Api.Data.DbInitializer
-- =========================================================================================

-- 1. Seed Resources
IF NOT EXISTS (SELECT 1 FROM [dbo].[Resources])
BEGIN
    SET IDENTITY_INSERT [dbo].[Resources] ON;
    INSERT INTO [dbo].[Resources] ([Id], [Name], [Category], [AvailableQuantity], [AllocatedQuantity], [MinimumStockLevel], [Unit], [Status], [UpdatedAt])
    VALUES
        (1, 'Water (L)', 'Water', 12400, 3200, 2500, 'L', 'Normal', SYSUTCDATETIME()),
        (2, 'Food packs', 'Food Packs', 3200, 1100, 1500, 'packs', 'Warning', SYSUTCDATETIME()),
        (3, 'Medicine kits', 'Medicine Kits', 310, 98, 250, 'kits', 'Critical', SYSUTCDATETIME()),
        (4, 'First Aid Kits', 'First Aid Kits', 180, 120, 150, 'kits', 'Warning', SYSUTCDATETIME()),
        (5, 'Emergency Blankets & Cots', 'Essential Supplies', 850, 400, 300, 'units', 'Normal', SYSUTCDATETIME()),
        (6, 'Hygiene & Sanitation Packs', 'Essential Supplies', 640, 210, 200, 'packs', 'Normal', SYSUTCDATETIME()),
        (7, 'Water Purification Tablets', 'Water', 120, 380, 500, 'strips', 'Critical', SYSUTCDATETIME());
    SET IDENTITY_INSERT [dbo].[Resources] OFF;
END
GO

-- 2. Seed Shelters
IF NOT EXISTS (SELECT 1 FROM [dbo].[Shelters])
BEGIN
    SET IDENTITY_INSERT [dbo].[Shelters] ON;
    INSERT INTO [dbo].[Shelters] ([Id], [Name], [Location], [Latitude], [Longitude], [TotalCapacity], [CurrentOccupancy], [OperationalStatus], [FacilitiesRaw], [ContactPerson], [ContactPhone], [LastUpdated])
    VALUES
        (1, 'Kelaniya Maha Vidyalaya', 'Station Road, Kelaniya, Western Province', 6.9583, 79.9194, 100, 82, 'Open', 'Accessible,Meals,Medical,Drinking Water,Sanitation', 'Mr. Sarath Bandara', '+94 11 291 1234', SYSUTCDATETIME()),
        (2, 'Biyagama Hall', 'Main Street, Biyagama, Gampaha District', 6.9450, 79.9920, 120, 77, 'Open', 'Accessible,Meals,Medical,Sanitation', 'Ms. Dilani Silva', '+94 11 248 5567', SYSUTCDATETIME()),
        (3, 'Kaduwela Town Hall', 'Kaduwela Junction, Colombo Outer Ring', 6.9320, 79.9830, 80, 78, 'Almost Full', 'Accessible,Meals,Medical', 'Mr. Rohana Gamage', '+94 11 257 8890', SYSUTCDATETIME()),
        (4, 'Wattala Grounds Center', 'Negombo Road, Wattala', 6.9890, 79.8910, 150, 46, 'Open', 'Accessible,Meals,Drinking Water,Sanitation', 'Ms. Anula Fernando', '+94 11 293 4455', SYSUTCDATETIME()),
        (5, 'Malwana Community Complex', 'Pugoda Road, Malwana', 6.9410, 80.0120, 70, 70, 'Full', 'Meals,Drinking Water,Sanitation', 'Mr. K. Perera', '+94 11 289 1122', SYSUTCDATETIME());
    SET IDENTITY_INSERT [dbo].[Shelters] OFF;
END
GO

-- 3. Seed Resource Allocations
IF NOT EXISTS (SELECT 1 FROM [dbo].[ResourceAllocations])
BEGIN
    SET IDENTITY_INSERT [dbo].[ResourceAllocations] ON;
    INSERT INTO [dbo].[ResourceAllocations] ([Id], [ResourceId], [DestinationType], [DestinationShelterId], [DestinationShelterName], [EmergencyRequestId], [Quantity], [AllocatedBy], [Notes], [Status], [AllocatedAt])
    VALUES
        (1, 1, 'Shelter', 1, 'Kelaniya Maha Vidyalaya', NULL, 1200, 'Logistics Mgr', 'Dispatched via Truck A for incoming evacuees', 'Delivered', DATEADD(HOUR, -4, SYSUTCDATETIME())),
        (2, 2, 'Shelter', 2, 'Biyagama Hall', NULL, 600, 'Logistics Mgr', 'Partner NGO stock dispatch', 'InTransit', DATEADD(HOUR, -2, SYSUTCDATETIME())),
        (3, 3, 'EmergencyRequest', NULL, NULL, 'RQ-2041', 12, 'Resource Manager', 'Critical insulin and triage kits for Kelaniya flood survivors', 'Allocated', DATEADD(MINUTE, -45, SYSUTCDATETIME()));
    SET IDENTITY_INSERT [dbo].[ResourceAllocations] OFF;
END
GO

-- 4. Seed Household Allocations
IF NOT EXISTS (SELECT 1 FROM [dbo].[HouseholdAllocations])
BEGIN
    SET IDENTITY_INSERT [dbo].[HouseholdAllocations] ON;
    INSERT INTO [dbo].[HouseholdAllocations] ([Id], [ShelterId], [HouseholdHeadName], [CaseReferenceId], [NumberOfPeople], [SpecialNeeds], [AllocatedBy], [Status], [AllocatedAt])
    VALUES
        (1, 1, 'Perera Family', 'RQ-2041', 4, 'Elderly care and asthma medication', 'Shelter Admin', 'Confirmed', DATEADD(HOUR, -3, SYSUTCDATETIME())),
        (2, 2, 'Silva Family', 'RQ-2042', 3, 'Infant infant formula', 'Shelter Admin', 'Confirmed', DATEADD(HOUR, -1, SYSUTCDATETIME()));
    SET IDENTITY_INSERT [dbo].[HouseholdAllocations] OFF;
END
GO

-- 5. Seed Partner Support Requests
IF NOT EXISTS (SELECT 1 FROM [dbo].[PartnerSupportRequests])
BEGIN
    SET IDENTITY_INSERT [dbo].[PartnerSupportRequests] ON;
    INSERT INTO [dbo].[PartnerSupportRequests] ([Id], [RequiredResource], [QuantityRequired], [RequestingLocation], [Priority], [Reason], [Status], [PartnerOrganization], [CreatedAt])
    VALUES
        (1, 'Water (L)', 3000, 'Biyagama Distribution Hub', 'Critical', '3 urgent requests compete for Water (stock 120 strips). Local stock exhausted.', 'Pending', 'Sri Lanka Red Cross', DATEADD(MINUTE, -90, SYSUTCDATETIME())),
        (2, 'Medical Ambulances & Trauma Kits', 2, 'Kelaniya South Basin', 'Critical', 'Shortage conflict: 3 urgent requests need 1 ambulance.', 'Approved', 'St. John Ambulance / DMC', DATEADD(MINUTE, -50, SYSUTCDATETIME()));
    SET IDENTITY_INSERT [dbo].[PartnerSupportRequests] OFF;
END
GO

-- 6. Seed Shelter Supply Requests
IF NOT EXISTS (SELECT 1 FROM [dbo].[ShelterSupplyRequests])
BEGIN
    SET IDENTITY_INSERT [dbo].[ShelterSupplyRequests] ON;
    INSERT INTO [dbo].[ShelterSupplyRequests] ([Id], [ShelterId], [ShelterName], [RequestedResource], [Quantity], [Priority], [Reason], [Status], [CreatedAt])
    VALUES
        (1, 3, 'Kaduwela Town Hall', 'Emergency Cots & Blankets', 40, 'High', 'Shelter nearing full capacity (98%). Rapid influx expected tonight.', 'Pending', DATEADD(MINUTE, -60, SYSUTCDATETIME())),
        (2, 1, 'Kelaniya Maha Vidyalaya', 'Water Purification Tablets', 200, 'Critical', 'Local well water contaminated by river overflow.', 'Dispatched', DATEADD(HOUR, -2, SYSUTCDATETIME()));
    SET IDENTITY_INSERT [dbo].[ShelterSupplyRequests] OFF;
END
GO

-- 7. Seed Emergency Requests
IF NOT EXISTS (SELECT 1 FROM [dbo].[EmergencyRequests])
BEGIN
    SET IDENTITY_INSERT [dbo].[EmergencyRequests] ON;
    INSERT INTO [dbo].[EmergencyRequests] ([Id], [RequestIdentifier], [Category], [Location], [Latitude], [Longitude], [Priority], [CurrentStatus], [PeopleCount], [Description], [ReportedAt])
    VALUES
        (1, 'RQ-2041', 'Medical / Evacuation', 'Kelaniya South (Near Rail Bridge)', 6.9535, 79.9167, 'CRITICAL', 'Pending', 4, 'Elderly diabetic resident stranded on upper floor. Water level rising.', DATEADD(MINUTE, -35, SYSUTCDATETIME())),
        (2, 'RQ-2042', 'Rescue / Evacuation', 'Biyagama Industrial Zone Border', 6.9412, 79.9890, 'CRITICAL', 'Responder Assigned', 6, 'Family trapped by flash flood near river bank canal.', DATEADD(MINUTE, -55, SYSUTCDATETIME())),
        (3, 'RQ-2043', 'Food & Water', 'Kaduwela Lowland Sector C', 6.9350, 79.9750, 'HIGH', 'Pending', 5, 'Clean drinking water exhausted. Road cutoff by 0.5m water.', DATEADD(HOUR, -1, SYSUTCDATETIME()));
    SET IDENTITY_INSERT [dbo].[EmergencyRequests] OFF;
END
GO

-- 8. Seed Flood Zones
IF NOT EXISTS (SELECT 1 FROM [dbo].[FloodZones])
BEGIN
    SET IDENTITY_INSERT [dbo].[FloodZones] ON;
    INSERT INTO [dbo].[FloodZones] ([Id], [ZoneName], [SeverityLevel], [WaterLevelTrend], [EstimatedAffectedPopulation], [EvacuationStatus], [PolygonCoordinatesJson], [CenterLatitude], [CenterLongitude], [LastUpdated])
    VALUES
        (1, 'Kelaniya River Basin - High Inundation Zone', 'High Risk', 'Rising (+0.4m/hr)', 4200, 'Mandatory Evacuation Ordered', '[[6.9650, 79.9050], [6.9680, 79.9300], [6.9500, 79.9350], [6.9450, 79.9120], [6.9650, 79.9050]]', 6.9550, 79.9200, SYSUTCDATETIME()),
        (2, 'Biyagama Lowland Flash Flood Zone', 'Moderate Risk', 'Peak Stagnant', 2600, 'Advisory in Effect', '[[6.9500, 79.9780], [6.9520, 80.0050], [6.9350, 80.0020], [6.9320, 79.9800], [6.9500, 79.9780]]', 6.9420, 79.9910, SYSUTCDATETIME()),
        (3, 'Kaduwela Canal Corridor', 'Severe Inundation', 'Receding Slowly (-0.1m/hr)', 1850, 'Active Relief & Rescue', '[[6.9380, 79.9680], [6.9400, 79.9900], [6.9250, 79.9880], [6.9230, 79.9700], [6.9380, 79.9680]]', 6.9310, 79.9800, SYSUTCDATETIME());
    SET IDENTITY_INSERT [dbo].[FloodZones] OFF;
END
GO

PRINT 'ResQnet Member 5 Resources, Shelters & Tactical Maps database schema and seed data created successfully.';
GO
GO


-- =========================================================================================
-- SECTION: 01_Member6_Schema_and_Seed.sql
-- =========================================================================================
-- =========================================================================================
-- ResQnet.AI - Humanitarian Crisis Management & Aid Coordination Platform
-- Module: Member 6 - Volunteers, Donors, Campaigns, and Communication Services
-- Target Database: Microsoft SQL Server 2019 / 2022 / Azure SQL
-- =========================================================================================





-- 1. Volunteers Table
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Volunteers]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[Volunteers] (
        [Id] UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
        [FullName] NVARCHAR(150) NOT NULL,
        [Email] NVARCHAR(150) NOT NULL UNIQUE,
        [PhoneNumber] NVARCHAR(50) NOT NULL,
        [Skills] NVARCHAR(250) NOT NULL, -- e.g. 'First aid, driving', 'Translation', 'Logistics', 'Medical'
        [Status] NVARCHAR(50) NOT NULL DEFAULT 'Available', -- 'Available', 'On Task', 'On Leave'
        [TotalHours] INT NOT NULL DEFAULT 0,
        [CreatedAt] DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        [UpdatedAt] DATETIME2 NULL
    );
    CREATE NONCLUSTERED INDEX [IX_Volunteers_Status] ON [dbo].[Volunteers] ([Status]);
END
GO

-- 2. VolunteerTasks Table
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[VolunteerTasks]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[VolunteerTasks] (
        [Id] UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
        [Title] NVARCHAR(250) NOT NULL, -- e.g. 'Distribute meals - Rivagama'
        [Category] NVARCHAR(100) NOT NULL DEFAULT 'Relief Logistics',
        [Location] NVARCHAR(200) NOT NULL,
        [RequiredSkill] NVARCHAR(100) NOT NULL, -- e.g. 'Logistics'
        [Status] NVARCHAR(50) NOT NULL DEFAULT 'Open', -- 'Open', 'Assigned', 'In Progress', 'Completed'
        [AssignedVolunteerId] UNIQUEIDENTIFIER NULL,
        [MatchScorePercent] INT NOT NULL DEFAULT 67,
        [CreatedAt] DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        CONSTRAINT [FK_Tasks_Volunteers] FOREIGN KEY ([AssignedVolunteerId]) REFERENCES [dbo].[Volunteers] ([Id]) ON DELETE SET NULL
    );
END
GO

-- 3. Campaigns Table
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Campaigns]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[Campaigns] (
        [Id] UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
        [Title] NVARCHAR(200) NOT NULL UNIQUE, -- 'Flood Relief 2024'
        [GoalAmount] DECIMAL(18,2) NOT NULL DEFAULT 5000000.00, -- LKR 5M
        [RaisedAmount] DECIMAL(18,2) NOT NULL DEFAULT 4200000.00, -- LKR 4.2M
        [MedicalItemsCount] INT NOT NULL DEFAULT 1284,
        [DisposalFlagCount] INT NOT NULL DEFAULT 3,
        [FoodAllocationPercent] INT NOT NULL DEFAULT 40,
        [MedicalAllocationPercent] INT NOT NULL DEFAULT 35,
        [ShelterAllocationPercent] INT NOT NULL DEFAULT 25,
        [Status] NVARCHAR(50) NOT NULL DEFAULT 'Active',
        [CreatedAt] DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
    );
END
GO

-- 4. Donations Table
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Donations]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[Donations] (
        [Id] UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
        [CampaignId] UNIQUEIDENTIFIER NULL,
        [DonorName] NVARCHAR(150) NOT NULL, -- 'A. Silva', 'Org X', 'K. Perera'
        [Amount] DECIMAL(18,2) NOT NULL, -- 25000, 300000, 5000
        [ItemCount] INT NOT NULL DEFAULT 0,
        [Flag] NVARCHAR(50) NOT NULL DEFAULT '-', -- '-', 'Urgent', 'Disposal'
        [IsSuspicious] BIT NOT NULL DEFAULT 0,
        [PaymentReference] NVARCHAR(100) NULL,
        [CreatedAt] DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        CONSTRAINT [FK_Donations_Campaigns] FOREIGN KEY ([CampaignId]) REFERENCES [dbo].[Campaigns] ([Id]) ON DELETE SET NULL
    );
    CREATE NONCLUSTERED INDEX [IX_Donations_CreatedAt] ON [dbo].[Donations] ([CreatedAt] DESC);
END
GO

-- 5. Notifications Table
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Notifications]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[Notifications] (
        [Id] UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
        [Recipient] NVARCHAR(150) NOT NULL,
        [Channel] NVARCHAR(50) NOT NULL, -- 'Email', 'SMS', 'Push'
        [Subject] NVARCHAR(200) NOT NULL,
        [Body] NVARCHAR(MAX) NOT NULL,
        [Status] NVARCHAR(50) NOT NULL DEFAULT 'Sent', -- 'Pending', 'Sent', 'Failed'
        [RetryCount] INT NOT NULL DEFAULT 0,
        [SentAt] DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
    );
END
GO

-- 6. NotificationIdempotency Table (Advanced Requirement: Prevents Duplicate Delivery)
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[NotificationIdempotency]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[NotificationIdempotency] (
        [Id] UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
        [IdempotencyKey] NVARCHAR(150) NOT NULL UNIQUE, -- SHA-256 event hash
        [EventName] NVARCHAR(100) NOT NULL,
        [ProcessedAt] DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
    );
    CREATE UNIQUE NONCLUSTERED INDEX [IX_NotificationIdempotency_Key] ON [dbo].[NotificationIdempotency] ([IdempotencyKey]);
END
GO

-- =========================================================================================
-- SEED DATA: Exactly matching Screenshots 10 & 9
-- =========================================================================================

-- Seed Volunteers (Exact match to Screenshot 9 Table)
MERGE INTO [dbo].[Volunteers] AS target
USING (VALUES
    ('Nimal P.', 'nimal@resqnet.org', '+94 77 111 2222', 'First aid, driving', 'Available', 48),
    ('Kavya S.', 'kavya@resqnet.org', '+94 77 222 3333', 'Translation', 'On Task', 72),
    ('Ruwan D.', 'ruwan@resqnet.org', '+94 77 333 4444', 'Logistics', 'Available', 95),
    ('Amal T.', 'amal@resqnet.org', '+94 77 444 5555', 'Medical', 'On Leave', 30)
) AS source ([FullName], [Email], [PhoneNumber], [Skills], [Status], [TotalHours])
ON target.[FullName] = source.[FullName]
WHEN NOT MATCHED THEN
    INSERT ([FullName], [Email], [PhoneNumber], [Skills], [Status], [TotalHours])
    VALUES (source.[FullName], source.[Email], source.[PhoneNumber], source.[Skills], source.[Status], source.[TotalHours]);

-- Seed Task Match: 'Distribute meals - Rivagama' (Screenshot 9)
IF NOT EXISTS (SELECT 1 FROM [dbo].[VolunteerTasks] WHERE [Title] = 'Distribute meals - Rivagama')
BEGIN
    INSERT INTO [dbo].[VolunteerTasks] ([Title], [Category], [Location], [RequiredSkill], [Status], [MatchScorePercent])
    VALUES ('Distribute meals - Rivagama', 'Meal Distribution', 'Rivagama Relief Center', 'Logistics', 'Open', 67);
END

-- Seed Campaign: 'Flood Relief 2024' (Goal LKR 5M, Raised 4.2M, Food 40%, Medical 35%, Shelter 25% - Screenshot 10)
DECLARE @CampaignId UNIQUEIDENTIFIER = '44444444-4444-4444-4444-444444444444';
IF NOT EXISTS (SELECT 1 FROM [dbo].[Campaigns] WHERE [Title] = 'Flood Relief 2024')
BEGIN
    INSERT INTO [dbo].[Campaigns] 
    ([Id], [Title], [GoalAmount], [RaisedAmount], [MedicalItemsCount], [DisposalFlagCount], [FoodAllocationPercent], [MedicalAllocationPercent], [ShelterAllocationPercent], [Status])
    VALUES 
    (@CampaignId, 'Flood Relief 2024', 5000000.00, 4200000.00, 1284, 3, 40, 35, 25, 'Active');
END

-- Seed Recent Donations (Screenshot 10 Table: A. Silva, Org X [Urgent], K. Perera)
IF NOT EXISTS (SELECT 1 FROM [dbo].[Donations] WHERE [DonorName] = 'A. Silva')
BEGIN
    INSERT INTO [dbo].[Donations] ([CampaignId], [DonorName], [Amount], [ItemCount], [Flag], [IsSuspicious])
    VALUES 
    (@CampaignId, 'A. Silva', 25000.00, 0, '-', 0),
    (@CampaignId, 'Org X', 300000.00, 500, 'Urgent', 0),
    (@CampaignId, 'K. Perera', 5000.00, 0, '-', 0);
END

PRINT 'ResQnet Member 6 Volunteers, Donors & Communication database schema and seed data created successfully.';
GO
====
-- EXPANDED MODULES: Monetary & Physical Goods Donations, Volunteer Roster & Scheduling
-- =========================================================================================

-- 7. Donors Profile Table (Persistent DON-XXXX tracking)
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Donors]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[Donors] (
        [DonorId] NVARCHAR(50) NOT NULL PRIMARY KEY, -- e.g. 'DON-0001'
        [FullName] NVARCHAR(150) NOT NULL,
        [Email] NVARCHAR(150) NOT NULL UNIQUE,
        [PhoneNumber] NVARCHAR(50) NOT NULL,
        [CreatedAt] DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
    );
END
GO

-- 8. Monetary Donations Table
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[MonetaryDonations]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[MonetaryDonations] (
        [Id] UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
        [Reference] NVARCHAR(50) NOT NULL UNIQUE, -- e.g. 'REQ-MON-0001'
        [DonorId] NVARCHAR(50) NOT NULL,
        [DonorName] NVARCHAR(150) NOT NULL,
        [DonorEmail] NVARCHAR(150) NOT NULL,
        [DonorPhone] NVARCHAR(50) NOT NULL,
        [Amount] DECIMAL(18,2) NOT NULL,
        [Currency] NVARCHAR(10) NOT NULL DEFAULT 'LKR',
        [Purpose] NVARCHAR(250) NULL,
        [PaymentMethod] NVARCHAR(50) NOT NULL, -- 'Bank Transfer' or 'Online Card Payment'
        [PaymentDetails] NVARCHAR(MAX) NULL, -- JSON or note (never sensitive card/CVV!)
        [Status] NVARCHAR(50) NOT NULL DEFAULT 'Payment Verification', -- 'Pending', 'Payment Verification', 'Confirmed', 'Rejected', 'Cancelled'
        [VerifiedBy] NVARCHAR(150) NULL,
        [VerifiedAt] DATETIME2 NULL,
        [VerificationNotes] NVARCHAR(MAX) NULL,
        [CreatedAt] DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
    );
END
GO

-- 9. Goods Donations Table
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[GoodsDonations]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[GoodsDonations] (
        [Id] UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
        [Reference] NVARCHAR(50) NOT NULL UNIQUE, -- e.g. 'REQ-GDS-0001'
        [DonorId] NVARCHAR(50) NOT NULL,
        [DonorName] NVARCHAR(150) NOT NULL,
        [DonorEmail] NVARCHAR(150) NOT NULL,
        [DonorPhone] NVARCHAR(50) NOT NULL,
        [CollectionAddress] NVARCHAR(300) NOT NULL,
        [Notes] NVARCHAR(MAX) NULL,
        [Status] NVARCHAR(50) NOT NULL DEFAULT 'Submitted', -- 'Submitted', 'Under Review', 'Approved - Date Range Issued', 'Handover Date Selected', 'Handover Scheduled', 'Goods Received', 'Rejected', 'Cancelled'
        [EarliestHandoverDate] DATE NULL,
        [LatestHandoverDate] DATE NULL,
        [HandoverLocation] NVARCHAR(250) NULL,
        [SelectedHandoverDate] DATE NULL,
        [ReceivedAt] DATETIME2 NULL,
        [ReceivedBy] NVARCHAR(150) NULL,
        [RejectionReason] NVARCHAR(MAX) NULL,
        [CreatedAt] DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
    );
END
GO

-- 10. Goods Items Table
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[GoodsItems]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[GoodsItems] (
        [Id] UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
        [DonationReference] NVARCHAR(50) NOT NULL,
        [Category] NVARCHAR(100) NOT NULL,
        [ItemName] NVARCHAR(200) NOT NULL,
        [Quantity] INT NOT NULL DEFAULT 1,
        [Unit] NVARCHAR(50) NOT NULL,
        [Condition] NVARCHAR(100) NOT NULL,
        [Notes] NVARCHAR(MAX) NULL,
        CONSTRAINT [FK_GoodsItems_Donations] FOREIGN KEY ([DonationReference]) REFERENCES [dbo].[GoodsDonations] ([Reference]) ON DELETE CASCADE
    );
END
GO

-- 11. Volunteer Registrations Table
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[VolunteerRegistrations]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[VolunteerRegistrations] (
        [Id] UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
        [RegistrationNumber] NVARCHAR(50) NOT NULL UNIQUE, -- e.g. 'REG-VOL-0001'
        [VolunteerId] NVARCHAR(50) NOT NULL, -- e.g. 'VOL-0001'
        [FullName] NVARCHAR(150) NOT NULL,
        [Email] NVARCHAR(150) NOT NULL,
        [PhoneNumber] NVARCHAR(50) NOT NULL,
        [Skills] NVARCHAR(MAX) NOT NULL, -- comma separated
        [AvailabilityDays] NVARCHAR(MAX) NOT NULL, -- comma separated
        [AvailabilityStartTime] NVARCHAR(20) NOT NULL, -- '09:00'
        [AvailabilityEndTime] NVARCHAR(20) NOT NULL, -- '17:00'
        [EmergencyContact] NVARCHAR(150) NOT NULL,
        [PreferredRoles] NVARCHAR(MAX) NOT NULL,
        [Status] NVARCHAR(50) NOT NULL DEFAULT 'Submitted', -- 'Submitted', 'Under Review', 'Approved', 'Rejected'
        [ReviewNotes] NVARCHAR(MAX) NULL,
        [ReviewedBy] NVARCHAR(150) NULL,
        [RegisteredAt] DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
    );
END
GO

-- 12. Volunteer Schedules Table
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[VolunteerSchedules]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[VolunteerSchedules] (
        [Id] UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
        [ScheduleId] NVARCHAR(50) NOT NULL UNIQUE, -- e.g. 'SCHED-0001'
        [VolunteerId] NVARCHAR(50) NOT NULL,
        [RegistrationNumber] NVARCHAR(50) NOT NULL,
        [FullName] NVARCHAR(150) NOT NULL,
        [ShiftDate] DATE NOT NULL,
        [StartTime] NVARCHAR(20) NOT NULL,
        [EndTime] NVARCHAR(20) NOT NULL,
        [TaskAssigned] NVARCHAR(250) NOT NULL,
        [Location] NVARCHAR(250) NOT NULL,
        [Status] NVARCHAR(50) NOT NULL DEFAULT 'Confirmed', -- 'Scheduled', 'Confirmed', 'Completed', 'Cancelled'
        [AssignedBy] NVARCHAR(150) NOT NULL,
        [Notes] NVARCHAR(MAX) NULL,
        [CreatedAt] DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
    );
END
GO

-- 13. In-App Notifications Table
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[InAppNotifications]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[InAppNotifications] (
        [Id] UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
        [NotificationId] NVARCHAR(50) NOT NULL UNIQUE,
        [RecipientEmail] NVARCHAR(150) NOT NULL,
        [RecipientRole] NVARCHAR(100) NOT NULL,
        [Title] NVARCHAR(250) NOT NULL,
        [Message] NVARCHAR(MAX) NOT NULL,
        [Type] NVARCHAR(50) NOT NULL, -- 'info', 'success', 'warning', 'appointment'
        [IsRead] BIT NOT NULL DEFAULT 0,
        [CreatedAt] DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        [RelatedReference] NVARCHAR(50) NULL
    );
END
GO

PRINT 'ResQnet Member 6 Expanded Donation and Volunteer Database Schema appended successfully.';
GO


-- =========================================================================================
-- SECTION: 01_Core_Schema_and_Seed.sql
-- =========================================================================================
-- =========================================================================================
-- ResQnet.AI - Humanitarian Crisis Management & Aid Coordination Platform
-- Module: Core API (UnifiedApi) - Citizen Assistance Requests & Crisis Event Coordination
-- Target Database: Microsoft SQL Server 2019 / 2022 / Azure SQL
-- Entity Framework: ResQnet.UnifiedApi (EF Core InMemory for dev, SQL Server for prod)
-- =========================================================================================
-- NOTE: Differences between entities and seed code
-- ───────────────────────────────────────────────────────────────────────────────────────
-- 1. AiCaseNumber (nullable NVARCHAR(32)) is defined in the entity but NOT present in
--    CoreDbSeeder.cs seed rows; all seeded requests have AiCaseNumber = NULL. This is
--    intentional: the field is set at runtime via PUT /api/requests/{id}/ai-link.
-- 2. SequenceNumber is set in seed code (1, 2, 3) but has no unique index in the EF
--    model — only Reference has a unique index. This script adds no unique constraint on
--    SequenceNumber to stay consistent with the entity model.
-- 3. The seed uses fixed GUIDs for requests (22222222-0001/0002/0003-...) and events
--    (11111111-0001/0002/0003-...). The script reproduces these exactly.
-- 4. UpdatedAt is set in the seed but no trigger is defined in the entity model; this
--    script does not create an UPDATE trigger (consistent with EF model behaviour).
-- 5. The EF model uses an enum (AssistanceRequestStatus) stored as INT by default.
--    This script uses NVARCHAR for Status columns to match the display strings used by
--    StatusTransitionService.ToDisplayString(), making the data human-readable.
--    If EF is configured to store enums as integers, adjust the Status column type and
--    constraint values accordingly.
-- =========================================================================================





-- =========================================================================================
-- 1. CrisisEvents Table
-- =========================================================================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[CrisisEvents]') AND type IN (N'U'))
BEGIN
    CREATE TABLE [dbo].[CrisisEvents] (
        [Id]          UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
        [Name]        NVARCHAR(200)    NOT NULL,
        [Type]        NVARCHAR(100)    NOT NULL,
        -- EventSeverity enum: 0=Critical, 1=High, 2=Moderate, 3=Low
        [Severity]    INT              NOT NULL DEFAULT 1,
        -- EventStatus enum: 0=Planned, 1=Active, 2=Monitoring, 3=Closed
        [Status]      INT              NOT NULL DEFAULT 0,
        [Description] NVARCHAR(MAX)    NOT NULL DEFAULT '',
        [StartedAt]   DATETIME2        NOT NULL DEFAULT SYSUTCDATETIME()
    );
    CREATE NONCLUSTERED INDEX [IX_CrisisEvents_Status]   ON [dbo].[CrisisEvents] ([Status]);
    CREATE NONCLUSTERED INDEX [IX_CrisisEvents_Severity] ON [dbo].[CrisisEvents] ([Severity]);
END
GO

-- =========================================================================================
-- 2. OperationalAreas Table
-- =========================================================================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[OperationalAreas]') AND type IN (N'U'))
BEGIN
    CREATE TABLE [dbo].[OperationalAreas] (
        [Id]               UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
        [CrisisEventId]    UNIQUEIDENTIFIER NOT NULL,
        [Name]             NVARCHAR(200)    NOT NULL,
        [District]         NVARCHAR(200)    NOT NULL,
        [PopulationAtRisk] INT              NOT NULL DEFAULT 0,
        -- AreaStatus enum: 0=Affected, 1=Responding, 2=Stabilised, 3=Cleared
        [Status]           INT              NOT NULL DEFAULT 0,
        CONSTRAINT [FK_OperationalAreas_CrisisEvents]
            FOREIGN KEY ([CrisisEventId]) REFERENCES [dbo].[CrisisEvents] ([Id]) ON DELETE CASCADE
    );
    CREATE NONCLUSTERED INDEX [IX_OperationalAreas_CrisisEventId] ON [dbo].[OperationalAreas] ([CrisisEventId]);
END
GO

-- =========================================================================================
-- 3. AssistanceRequests Table
-- =========================================================================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[AssistanceRequests]') AND type IN (N'U'))
BEGIN
    CREATE TABLE [dbo].[AssistanceRequests] (
        [Id]             UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
        [Reference]      NVARCHAR(32)     NOT NULL,
        [SequenceNumber] INT              NOT NULL DEFAULT 0,
        [CitizenEmail]   NVARCHAR(256)    NOT NULL,
        [Category]       NVARCHAR(100)    NOT NULL,
        [Urgency]        NVARCHAR(30)     NOT NULL DEFAULT 'Medium',
        [Description]    NVARCHAR(MAX)    NOT NULL DEFAULT '',
        [LocationText]   NVARCHAR(500)    NOT NULL DEFAULT '',
        [Latitude]       FLOAT            NULL,
        [Longitude]      FLOAT            NULL,
        [ContactPhone]   NVARCHAR(50)     NULL,
        [EvidenceName]   NVARCHAR(250)    NULL,
        [HouseholdSize]  INT              NULL,
        -- AssistanceRequestStatus enum: 0=Submitted, 1=UnderReview, 2=NeedsInformation,
        --   3=Verified, 4=Prioritised, 5=Assigned, 6=InProgress, 7=Fulfilled, 8=Closed, 9=Rejected
        [Status]         INT              NOT NULL DEFAULT 0,
        [CreatedAt]      DATETIME2        NOT NULL DEFAULT SYSUTCDATETIME(),
        [UpdatedAt]      DATETIME2        NOT NULL DEFAULT SYSUTCDATETIME(),
        -- AiCaseNumber: set via PUT /api/requests/{id}/ai-link (staff-only).
        -- Format: '#<digits>' e.g. '#2347'. NULL until an AI recommendation is linked.
        [AiCaseNumber]   NVARCHAR(32)     NULL,
        CONSTRAINT [UQ_AssistanceRequests_Reference] UNIQUE ([Reference])
    );
    CREATE NONCLUSTERED INDEX [IX_AssistanceRequests_CitizenEmail] ON [dbo].[AssistanceRequests] ([CitizenEmail]);
    CREATE NONCLUSTERED INDEX [IX_AssistanceRequests_Status]       ON [dbo].[AssistanceRequests] ([Status]);
    CREATE NONCLUSTERED INDEX [IX_AssistanceRequests_Category]     ON [dbo].[AssistanceRequests] ([Category]);
END
GO

-- =========================================================================================
-- 4. RequestStatusHistories Table
-- =========================================================================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[RequestStatusHistories]') AND type IN (N'U'))
BEGIN
    CREATE TABLE [dbo].[RequestStatusHistories] (
        [Id]             UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
        [RequestId]      UNIQUEIDENTIFIER NOT NULL,
        [OldStatus]      INT              NOT NULL DEFAULT 0,
        [NewStatus]      INT              NOT NULL DEFAULT 0,
        [ChangedByEmail] NVARCHAR(256)    NOT NULL,
        [Note]           NVARCHAR(MAX)    NULL,
        [Timestamp]      DATETIME2        NOT NULL DEFAULT SYSUTCDATETIME(),
        CONSTRAINT [FK_RequestStatusHistories_AssistanceRequests]
            FOREIGN KEY ([RequestId]) REFERENCES [dbo].[AssistanceRequests] ([Id]) ON DELETE CASCADE
    );
    CREATE NONCLUSTERED INDEX [IX_RequestStatusHistories_RequestId] ON [dbo].[RequestStatusHistories] ([RequestId]);
    CREATE NONCLUSTERED INDEX [IX_RequestStatusHistories_Timestamp] ON [dbo].[RequestStatusHistories] ([Timestamp]);
END
GO

-- =========================================================================================
-- 5. Seed Data — Crisis Events
--    Reproduces CoreDbSeeder.cs exactly (fixed GUIDs, relative timestamps replaced with
--    static offsets from a reference point; adjust DATEADD values as needed for your env)
-- =========================================================================================

-- Reference point: seed timestamp as a fixed UTC datetime
DECLARE @now DATETIME2 = SYSUTCDATETIME();

-- 5a. Crisis Events
IF NOT EXISTS (SELECT 1 FROM [dbo].[CrisisEvents] WHERE [Id] = '11111111-0001-0000-0000-000000000000')
BEGIN
    INSERT INTO [dbo].[CrisisEvents] ([Id], [Name], [Type], [Severity], [Status], [Description], [StartedAt])
    VALUES
    (
        '11111111-0001-0000-0000-000000000000',
        'Kelani River Flood 2026',
        'Flood',
        0,  -- Critical
        1,  -- Active
        'Severe flooding along the Kelani River basin following sustained monsoon rainfall.',
        DATEADD(HOUR, -52, @now)
    ),
    (
        '11111111-0002-0000-0000-000000000000',
        'Ratnapura Landslide Alert',
        'Landslide',
        1,  -- High
        2,  -- Monitoring
        'Landslide in Kuruwita area with ongoing risk of further slope failure.',
        DATEADD(HOUR, -20, @now)
    ),
    (
        '11111111-0003-0000-0000-000000000000',
        'Hambantota Drought Response',
        'Drought',
        2,  -- Moderate
        0,  -- Planned
        'Preparedness plan for forecast water scarcity in the southern dry zone.',
        DATEADD(HOUR, 72, @now)
    );
END
GO

-- 5b. Operational Areas
DECLARE @now2 DATETIME2 = SYSUTCDATETIME();

IF NOT EXISTS (SELECT 1 FROM [dbo].[OperationalAreas] WHERE [CrisisEventId] = '11111111-0001-0000-0000-000000000000')
BEGIN
    INSERT INTO [dbo].[OperationalAreas] ([Id], [CrisisEventId], [Name], [District], [PopulationAtRisk], [Status])
    VALUES
    (NEWID(), '11111111-0001-0000-0000-000000000000', 'Kolonnawa', 'Colombo',   18000, 0),  -- Affected
    (NEWID(), '11111111-0001-0000-0000-000000000000', 'Hanwella',  'Colombo',    9500, 1),  -- Responding
    (NEWID(), '11111111-0001-0000-0000-000000000000', 'Biyagama',  'Gampaha',    7200, 1),  -- Responding
    (NEWID(), '11111111-0002-0000-0000-000000000000', 'Kuruwita',  'Ratnapura',  3400, 2);  -- Stabilised
END
GO

-- 5c. Assistance Requests
IF NOT EXISTS (SELECT 1 FROM [dbo].[AssistanceRequests] WHERE [Id] = '22222222-0001-0000-0000-000000000000')
BEGIN
    INSERT INTO [dbo].[AssistanceRequests]
        ([Id], [Reference], [SequenceNumber], [CitizenEmail], [Category], [Urgency],
         [Description], [LocationText], [Latitude], [Longitude], [ContactPhone],
         [HouseholdSize], [Status], [CreatedAt], [UpdatedAt], [AiCaseNumber])
    VALUES
    (
        '22222222-0001-0000-0000-000000000000',
        'REQ-2026-00001', 1,
        'citizen@resqnet.org',
        'Food & Water', 'High',
        'Family of 5 without drinking water since yesterday.',
        'Rivagama, Western Province',
        6.9215, 79.9140,
        '+94 77 123 4501',
        5,
        6,      -- InProgress
        DATEADD(HOUR, -12, SYSUTCDATETIME()),
        DATEADD(HOUR,  -2, SYSUTCDATETIME()),
        NULL    -- AiCaseNumber: not yet linked
    ),
    (
        '22222222-0002-0000-0000-000000000000',
        'REQ-2026-00002', 2,
        'citizen@resqnet.org',
        'Medical', 'Medium',
        'Need blood pressure medicine for an elderly person.',
        'Peradeniya Road, Kandy',
        7.2750, 80.6050,
        '+94 77 123 4502',
        2,
        7,      -- Fulfilled
        DATEADD(HOUR, -36, SYSUTCDATETIME()),
        DATEADD(HOUR,  -6, SYSUTCDATETIME()),
        NULL
    ),
    (
        '22222222-0003-0000-0000-000000000000',
        'REQ-2026-00003', 3,
        'citizen@resqnet.org',
        'Shelter', 'High',
        'House damaged by floodwater, temporary shelter needed.',
        'Biyagama South, Gampaha District',
        6.9421, 79.9482,
        '+94 77 123 4503',
        4,
        1,      -- UnderReview
        DATEADD(HOUR, -4, SYSUTCDATETIME()),
        DATEADD(HOUR, -3, SYSUTCDATETIME()),
        NULL
    );
END
GO

-- 5d. Request Status Histories
IF NOT EXISTS (SELECT 1 FROM [dbo].[RequestStatusHistories] WHERE [RequestId] = '22222222-0001-0000-0000-000000000000')
BEGIN
    -- Request 1 (Food & Water — InProgress)
    INSERT INTO [dbo].[RequestStatusHistories]
        ([Id], [RequestId], [OldStatus], [NewStatus], [ChangedByEmail], [Note], [Timestamp])
    VALUES
    (NEWID(), '22222222-0001-0000-0000-000000000000', 0, 0, 'citizen@resqnet.org',      'Request submitted by citizen',      DATEADD(HOUR, -12, SYSUTCDATETIME())),
    (NEWID(), '22222222-0001-0000-0000-000000000000', 0, 1, 'casemanager@resqnet.org',  'Initial intake review',             DATEADD(HOUR, -10, SYSUTCDATETIME())),
    (NEWID(), '22222222-0001-0000-0000-000000000000', 1, 3, 'casemanager@resqnet.org',  'Caller confirmed needs',            DATEADD(HOUR,  -8, SYSUTCDATETIME())),
    (NEWID(), '22222222-0001-0000-0000-000000000000', 3, 4, 'coordinator@resqnet.org',  'High flood priority',               DATEADD(HOUR,  -6, SYSUTCDATETIME())),
    (NEWID(), '22222222-0001-0000-0000-000000000000', 4, 5, 'coordinator@resqnet.org',  'Assigned to water dispatch team',   DATEADD(HOUR,  -4, SYSUTCDATETIME())),
    (NEWID(), '22222222-0001-0000-0000-000000000000', 5, 6, 'coordinator@resqnet.org',  'Relief bowser en route',            DATEADD(HOUR,  -2, SYSUTCDATETIME()));

    -- Request 2 (Medical — Fulfilled)
    INSERT INTO [dbo].[RequestStatusHistories]
        ([Id], [RequestId], [OldStatus], [NewStatus], [ChangedByEmail], [Note], [Timestamp])
    VALUES
    (NEWID(), '22222222-0002-0000-0000-000000000000', 0, 0, 'citizen@resqnet.org',      'Request submitted by citizen',           DATEADD(HOUR, -36, SYSUTCDATETIME())),
    (NEWID(), '22222222-0002-0000-0000-000000000000', 0, 1, 'casemanager@resqnet.org',  NULL,                                     DATEADD(HOUR, -30, SYSUTCDATETIME())),
    (NEWID(), '22222222-0002-0000-0000-000000000000', 1, 3, 'casemanager@resqnet.org',  NULL,                                     DATEADD(HOUR, -24, SYSUTCDATETIME())),
    (NEWID(), '22222222-0002-0000-0000-000000000000', 3, 4, 'coordinator@resqnet.org',  NULL,                                     DATEADD(HOUR, -20, SYSUTCDATETIME())),
    (NEWID(), '22222222-0002-0000-0000-000000000000', 4, 5, 'coordinator@resqnet.org',  NULL,                                     DATEADD(HOUR, -16, SYSUTCDATETIME())),
    (NEWID(), '22222222-0002-0000-0000-000000000000', 5, 6, 'coordinator@resqnet.org',  NULL,                                     DATEADD(HOUR, -10, SYSUTCDATETIME())),
    (NEWID(), '22222222-0002-0000-0000-000000000000', 6, 7, 'casemanager@resqnet.org',  'Medication handed over to resident',     DATEADD(HOUR,  -6, SYSUTCDATETIME()));

    -- Request 3 (Shelter — UnderReview)
    INSERT INTO [dbo].[RequestStatusHistories]
        ([Id], [RequestId], [OldStatus], [NewStatus], [ChangedByEmail], [Note], [Timestamp])
    VALUES
    (NEWID(), '22222222-0003-0000-0000-000000000000', 0, 0, 'citizen@resqnet.org',     'Request submitted by citizen',         DATEADD(HOUR, -4, SYSUTCDATETIME())),
    (NEWID(), '22222222-0003-0000-0000-000000000000', 0, 1, 'casemanager@resqnet.org', 'Shelter capacity check in progress',   DATEADD(HOUR, -3, SYSUTCDATETIME()));
END
GO

-- =========================================================================================
-- END OF SCRIPT
-- =========================================================================================
GO
