-- =========================================================================================
-- ResQnet.AI - Humanitarian Crisis Management & Aid Coordination Platform
-- Module: Member 4 - AI Decision-Support Services & Human-in-the-Loop Governance
-- Target Database: Microsoft SQL Server 2019 / 2022 / Azure SQL
-- =========================================================================================

IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = N'ResQnet_Core_Db')
BEGIN
    CREATE DATABASE [ResQnet_Core_Db];
END
GO

USE [ResQnet_Core_Db];
GO

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
