-- =========================================================================================
-- ResQnet.AI - Humanitarian Crisis Management & Aid Coordination Platform
-- Module: Member 6 - Volunteers, Donors, Campaigns, and Communication Services
-- Target Database: Microsoft SQL Server 2019 / 2022 / Azure SQL
-- =========================================================================================

IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = N'ResQnet_Core_Db')
BEGIN
    CREATE DATABASE [ResQnet_Core_Db];
END
GO

USE [ResQnet_Core_Db];
GO

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

