using System;
using System.Collections.Generic;

namespace ResQnet.Member4.Application.DTOs
{
    public class CaseReviewDto
    {
        public Guid Id { get; set; }
        public string CaseNumber { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string Location { get; set; } = string.Empty;
        public string RequestDetails { get; set; } = string.Empty;
        public string Evidence { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public string AssignedAgency { get; set; } = string.Empty;

        // Duplicate Warning Info (matching Screenshot 11)
        public string? PossibleDuplicate { get; set; } // e.g. '#2187 - Flood (Kandy)'
        public string? DuplicateRiskLevel { get; set; } // e.g. 'Medium'

        // AI Recommendation (matching Screenshot 11)
        public AiRecommendationDto? Recommendation { get; set; }
    }

    public class AiRecommendationDto
    {
        public Guid Id { get; set; }
        public string Category { get; set; } = "Disaster Relief";
        public string Urgency { get; set; } = "High - immediate assistance needed.";
        public string View { get; set; } = "Provide shelter, food supplies, medical aid.";
        public string Suggest { get; set; } = "Coordinate with local authorities and NGOs.";
        public int PriorityScore { get; set; }
        public decimal Confidence { get; set; }
        public string Rationale { get; set; } = string.Empty;
        public string ProviderStrategy { get; set; } = string.Empty;
    }

    public class HumanDecisionRequest
    {
        public string Action { get; set; } = "Approve"; // 'Approve', 'Modify', 'Reject', 'Defer'
        public string? ModifiedCategory { get; set; }
        public string? ModifiedUrgency { get; set; }
        public string? ModifiedAction { get; set; }
        public string? Justification { get; set; }
        public string? ReviewerEmail { get; set; }
    }

    public class ChatRequest
    {
        public string Question { get; set; } = string.Empty;
        public string? CaseNumber { get; set; }
        public string? Language { get; set; } = "en"; // 'en', 'si', 'ta'
    }

    public class ChatResponse
    {
        public string Reply { get; set; } = string.Empty;
        public decimal Confidence { get; set; }
        public string Source { get; set; } = "ResQnet AI Gateway";
        public string? SuggestedAction { get; set; }
    }

    public class DuplicateCheckResult
    {
        public string CaseNumber { get; set; } = string.Empty;
        public string SuspectedDuplicate { get; set; } = string.Empty;
        public decimal SimilarityScore { get; set; }
        public string RiskLevel { get; set; } = string.Empty;
        public string Rationale { get; set; } = string.Empty;
    }

    public class DemandForecastDto
    {
        public Guid Id { get; set; }
        public string Region { get; set; } = string.Empty;
        public string DisasterType { get; set; } = string.Empty;
        public string ResourceCategory { get; set; } = string.Empty;
        public int ProjectedQuantity { get; set; }
        public string Unit { get; set; } = string.Empty;
        public decimal Confidence { get; set; }
        public string ForecastPeriod { get; set; } = string.Empty;
    }
}
