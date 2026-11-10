using System;
using System.Collections.Generic;

namespace ResQnet.UnifiedApi.Models
{
    public enum AssistanceRequestStatus
    {
        Submitted,
        UnderReview,
        NeedsInformation,
        Verified,
        Prioritised,
        Assigned,
        InProgress,
        Fulfilled,
        Closed,
        Rejected
    }

    public enum EventSeverity
    {
        Critical,
        High,
        Moderate,
        Low
    }

    public enum EventStatus
    {
        Planned,
        Active,
        Monitoring,
        Closed
    }

    public enum AreaStatus
    {
        Affected,
        Responding,
        Stabilised,
        Cleared
    }

    public class AssistanceRequest
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public string Reference { get; set; } = string.Empty;
        public int SequenceNumber { get; set; }
        public string CitizenEmail { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty;
        public string Urgency { get; set; } = "Medium";
        public string Description { get; set; } = string.Empty;
        public string LocationText { get; set; } = string.Empty;
        public double? Latitude { get; set; }
        public double? Longitude { get; set; }
        public string? ContactPhone { get; set; }
        public string? EvidenceName { get; set; }
        public int? HouseholdSize { get; set; }
        public AssistanceRequestStatus Status { get; set; } = AssistanceRequestStatus.Submitted;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
        public ICollection<RequestStatusHistory> History { get; set; } = new List<RequestStatusHistory>();
    }

    public class RequestStatusHistory
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public Guid RequestId { get; set; }
        public AssistanceRequest Request { get; set; } = null!;
        public AssistanceRequestStatus OldStatus { get; set; }
        public AssistanceRequestStatus NewStatus { get; set; }
        public string ChangedByEmail { get; set; } = string.Empty;
        public string? Note { get; set; }
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    }

    public class CrisisEvent
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public string Name { get; set; } = string.Empty;
        public string Type { get; set; } = string.Empty;
        public EventSeverity Severity { get; set; }
        public EventStatus Status { get; set; } = EventStatus.Planned;
        public string Description { get; set; } = string.Empty;
        public DateTime StartedAt { get; set; }
        public ICollection<OperationalArea> Areas { get; set; } = new List<OperationalArea>();
    }

    public class OperationalArea
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public Guid CrisisEventId { get; set; }
        public CrisisEvent CrisisEvent { get; set; } = null!;
        public string Name { get; set; } = string.Empty;
        public string District { get; set; } = string.Empty;
        public int PopulationAtRisk { get; set; }
        public AreaStatus Status { get; set; } = AreaStatus.Affected;
    }
}