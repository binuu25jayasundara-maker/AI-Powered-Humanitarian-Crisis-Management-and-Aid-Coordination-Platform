using System;
using System.Collections.Generic;

namespace ResQnet.UnifiedApi.Models
{
// ApiResponse defined in ResQnet.Application.Common

    public class AssistanceRequestDto
    {
        public string Id { get; set; } = string.Empty;
        public string Reference { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty;
        public string Urgency { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Location { get; set; } = string.Empty;
        public double? Lat { get; set; }
        public double? Lng { get; set; }
        public string? ContactPhone { get; set; }
        public string? EvidenceName { get; set; }
        public int? HouseholdSize { get; set; }
        public string Status { get; set; } = string.Empty;
        public string CitizenStage { get; set; } = string.Empty;
        public string? AiCaseNumber { get; set; }
        public string CreatedAt { get; set; } = string.Empty;
        public List<RequestStatusHistoryDto> History { get; set; } = new();
    }

    public class RequestStatusHistoryDto
    {
        public string Id { get; set; } = string.Empty;
        public string OldStatus { get; set; } = string.Empty;
        public string NewStatus { get; set; } = string.Empty;
        public string ChangedByEmail { get; set; } = string.Empty;
        public string? Note { get; set; }
        public string Timestamp { get; set; } = string.Empty;
    }

    public class CreateAssistanceRequestDto
    {
        public string Category { get; set; } = string.Empty;
        public string Urgency { get; set; } = "Medium";
        public string Description { get; set; } = string.Empty;
        public string Location { get; set; } = string.Empty;
        public double? Lat { get; set; }
        public double? Lng { get; set; }
        public string? ContactPhone { get; set; }
        public string? EvidenceName { get; set; }
        public int? HouseholdSize { get; set; }
    }

    public class UpdateRequestStatusDto
    {
        public string? NewStatus { get; set; }
        public string? Status { get; set; }
        public string? Note { get; set; }

        public string GetTargetStatus() => !string.IsNullOrWhiteSpace(NewStatus) ? NewStatus : Status ?? string.Empty;
    }

    public class CrisisEventDto
    {
        public string Id { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string Type { get; set; } = string.Empty;
        public string Severity { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string StartedAt { get; set; } = string.Empty;
        public List<OperationalAreaDto> Areas { get; set; } = new();
    }

    public class OperationalAreaDto
    {
        public string Id { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string District { get; set; } = string.Empty;
        public int PopulationAtRisk { get; set; }
        public string Status { get; set; } = string.Empty;
    }

    public class CreateCrisisEventDto
    {
        public string Name { get; set; } = string.Empty;
        public string Type { get; set; } = string.Empty;
        public string Severity { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string? StartedAt { get; set; }
    }

    public class UpdateCrisisEventDto
    {
        public string? Name { get; set; }
        public string? Type { get; set; }
        public string? Severity { get; set; }
        public string? Status { get; set; }
        public string? Description { get; set; }
        public string? StartedAt { get; set; }
    }

    public class SetEventStatusDto
    {
        public string Status { get; set; } = string.Empty;
    }

    public class AddOperationalAreaDto
    {
        public string Name { get; set; } = string.Empty;
        public string District { get; set; } = string.Empty;
        public int PopulationAtRisk { get; set; }
        public string Status { get; set; } = "Affected";
    }

    public class LinkAiCaseDto
    {
        public string AiCaseNumber { get; set; } = string.Empty;
    }
}