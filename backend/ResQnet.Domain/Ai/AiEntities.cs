using ResQnet.Domain.Entities;
using System;
using System.Collections.Generic;

namespace ResQnet.Member4.Domain.Entities
{
    public class CrisisCase : BaseEntity
    {
        public string CaseNumber { get; set; } = string.Empty; // e.g. '#2341'
        public string Title { get; set; } = string.Empty; // e.g. 'Flood, Kandyyva'
        public string Location { get; set; } = string.Empty;
        public string RequestDetails { get; set; } = string.Empty;
        public string Evidence { get; set; } = string.Empty;
        public string Status { get; set; } = "Assessed - awaiting approval"; // 'Assessed - awaiting approval', 'Approved', 'Modified', 'Rejected'
        public string AssignedAgency { get; set; } = "DMC-LK";

        public virtual AiRecommendation? Recommendation { get; set; }
        public virtual ICollection<HumanDecisionAudit> DecisionAudits { get; set; } = new List<HumanDecisionAudit>();
        public virtual ICollection<DuplicateDetectionRecord> DuplicateRecords { get; set; } = new List<DuplicateDetectionRecord>();
    }

    public class AiRecommendation : BaseEntity
    {
        public Guid CaseId { get; set; }
        public virtual CrisisCase Case { get; set; } = null!;
        public string Category { get; set; } = "Disaster Relief";
        public string Urgency { get; set; } = "High - immediate assistance needed.";
        public string ViewRecommendation { get; set; } = "Provide shelter, food supplies, medical aid.";
        public string SuggestAction { get; set; } = "Coordinate with local authorities and NGOs.";
        public int PriorityScore { get; set; } = 85;
        public decimal Confidence { get; set; } = 0.92m;
        public string Rationale { get; set; } = string.Empty;
        public string ProviderStrategy { get; set; } = "RuleBasedStrategy";
    }

    public class HumanDecisionAudit : BaseEntity
    {
        public Guid CaseId { get; set; }
        public virtual CrisisCase Case { get; set; } = null!;
        public string OriginalRecommendationJson { get; set; } = "{}";
        public string ActionTaken { get; set; } = "Approve"; // 'Approve', 'Modify', 'Reject', 'Defer'
        public string ModificationsJson { get; set; } = "{}";
        public string? Justification { get; set; }
        public string ReviewerId { get; set; } = string.Empty;
        public string ReviewerEmail { get; set; } = string.Empty;
        public DateTime DecidedAt { get; set; } = DateTime.UtcNow;
    }

    public class DuplicateDetectionRecord : BaseEntity
    {
        public Guid PrimaryCaseId { get; set; }
        public virtual CrisisCase PrimaryCase { get; set; } = null!;
        public string SuspectedDuplicateNumber { get; set; } = string.Empty; // e.g. '#2187 - Flood (Kandy)'
        public decimal SimilarityScore { get; set; } = 0.74m;
        public string RiskLevel { get; set; } = "Medium"; // 'Low', 'Medium', 'High'
        public string Rationale { get; set; } = string.Empty;
    }

    public class DemandForecast : BaseEntity
    {
        public string Region { get; set; } = string.Empty;
        public string DisasterType { get; set; } = string.Empty;
        public string ResourceCategory { get; set; } = string.Empty;
        public int ProjectedQuantity { get; set; }
        public string Unit { get; set; } = "Units";
        public decimal Confidence { get; set; } = 0.85m;
        public string ForecastPeriod { get; set; } = "Next 72 Hours";
    }
}
