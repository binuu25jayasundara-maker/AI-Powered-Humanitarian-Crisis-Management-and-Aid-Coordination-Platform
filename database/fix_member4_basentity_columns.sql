-- Align Member 4 tables with BaseEntity (CreatedAt / UpdatedAt)
IF COL_LENGTH('dbo.AiRecommendations','CreatedAt') IS NULL
    ALTER TABLE dbo.AiRecommendations ADD CreatedAt datetime2(7) NOT NULL CONSTRAINT DF_AiRecommendations_CreatedAt DEFAULT SYSUTCDATETIME();
IF COL_LENGTH('dbo.AiRecommendations','UpdatedAt') IS NULL
    ALTER TABLE dbo.AiRecommendations ADD UpdatedAt datetime2(7) NULL;

IF COL_LENGTH('dbo.HumanDecisionAudits','CreatedAt') IS NULL
    ALTER TABLE dbo.HumanDecisionAudits ADD CreatedAt datetime2(7) NOT NULL CONSTRAINT DF_HumanDecisionAudits_CreatedAt DEFAULT SYSUTCDATETIME();
IF COL_LENGTH('dbo.HumanDecisionAudits','UpdatedAt') IS NULL
    ALTER TABLE dbo.HumanDecisionAudits ADD UpdatedAt datetime2(7) NULL;

IF COL_LENGTH('dbo.DuplicateDetectionRecords','CreatedAt') IS NULL
    ALTER TABLE dbo.DuplicateDetectionRecords ADD CreatedAt datetime2(7) NOT NULL CONSTRAINT DF_DuplicateDetectionRecords_CreatedAt DEFAULT SYSUTCDATETIME();
IF COL_LENGTH('dbo.DuplicateDetectionRecords','UpdatedAt') IS NULL
    ALTER TABLE dbo.DuplicateDetectionRecords ADD UpdatedAt datetime2(7) NULL;

IF COL_LENGTH('dbo.DemandForecasts','CreatedAt') IS NULL
    ALTER TABLE dbo.DemandForecasts ADD CreatedAt datetime2(7) NOT NULL CONSTRAINT DF_DemandForecasts_CreatedAt DEFAULT SYSUTCDATETIME();
IF COL_LENGTH('dbo.DemandForecasts','UpdatedAt') IS NULL
    ALTER TABLE dbo.DemandForecasts ADD UpdatedAt datetime2(7) NULL;

SELECT 'AiRecommendations' AS T, COL_LENGTH('dbo.AiRecommendations','CreatedAt') AS CreatedAt,
       COL_LENGTH('dbo.AiRecommendations','UpdatedAt') AS UpdatedAt
UNION ALL SELECT 'HumanDecisionAudits', COL_LENGTH('dbo.HumanDecisionAudits','CreatedAt'), COL_LENGTH('dbo.HumanDecisionAudits','UpdatedAt')
UNION ALL SELECT 'DuplicateDetectionRecords', COL_LENGTH('dbo.DuplicateDetectionRecords','CreatedAt'), COL_LENGTH('dbo.DuplicateDetectionRecords','UpdatedAt')
UNION ALL SELECT 'DemandForecasts', COL_LENGTH('dbo.DemandForecasts','CreatedAt'), COL_LENGTH('dbo.DemandForecasts','UpdatedAt');
