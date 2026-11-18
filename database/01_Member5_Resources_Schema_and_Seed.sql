-- =========================================================================================
-- ResQnet.AI - Humanitarian Crisis Management & Aid Coordination Platform
-- Module: Member 5 - Resources, Logistics, Shelters, and Tactical Maps
-- Target Database: Microsoft SQL Server 2019 / 2022 / Azure SQL
-- =========================================================================================

IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = N'ResQnet_Resources')
BEGIN
    CREATE DATABASE [ResQnet_Resources];
END
GO

USE [ResQnet_Resources];
GO

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
