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

IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = N'ResQnet_Core')
BEGIN
    CREATE DATABASE [ResQnet_Core];
END
GO

USE [ResQnet_Core];
GO

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
