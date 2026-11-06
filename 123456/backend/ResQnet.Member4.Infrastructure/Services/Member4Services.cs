using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using ResQnet.Member4.Application.DTOs;
using ResQnet.Member4.Application.Interfaces;
using ResQnet.Member4.Application.Strategies;
using ResQnet.Member4.Domain.Entities;
using ResQnet.Member4.Infrastructure.Data;

namespace ResQnet.Member4.Infrastructure.Services
{
    public class AiGateway : IAiGateway
    {
        private readonly IEnumerable<IAiProcessingStrategy> _strategies;

        public AiGateway(IEnumerable<IAiProcessingStrategy> strategies)
        {
            _strategies = strategies;
        }

        public async Task<AiRecommendationDto> GetRecommendationForCaseAsync(string requestDetails, string location, string evidence, string? preferredStrategy = null)
        {
            // Select strategy based on preference or fallback to default
            var strategy = _strategies.FirstOrDefault(s => preferredStrategy != null && s.StrategyName.Contains(preferredStrategy))
                           ?? _strategies.FirstOrDefault(s => s is ExternalLlmAiStrategy)
                           ?? _strategies.First(s => s is RuleBasedAiStrategy);

            return await strategy.GenerateRecommendationAsync(requestDetails, location, evidence);
        }

        public async Task<ChatResponse> ProcessChatQueryAsync(ChatRequest request)
        {
            var strategy = _strategies.First(s => s is RuleBasedAiStrategy);
            return await strategy.AnswerChatAsync(request.Question, request.CaseNumber, request.Language ?? "en");
        }

        public async Task<DuplicateCheckResult?> CheckDuplicateAsync(string newText, string existingText, string existingCaseNum)
        {
            var strategy = _strategies.First(s => s is RuleBasedAiStrategy);
            return await strategy.CheckDuplicateAsync(newText, existingText, existingCaseNum);
        }
    }

    public class CaseReviewService : ICaseReviewService
    {
        private readonly ApplicationDbContext _context;

        public CaseReviewService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<IReadOnlyList<CaseReviewDto>> GetAllCasesAsync(CancellationToken cancellationToken = default)
        {
            var cases = await _context.CrisisCases
                .Include(c => c.Recommendation)
                .Include(c => c.DuplicateRecords)
                .AsNoTracking()
                .ToListAsync(cancellationToken);

            return cases.Select(MapToDto).ToList();
        }

        public async Task<CaseReviewDto?> GetCaseByNumberAsync(string caseNumber, CancellationToken cancellationToken = default)
        {
            var c = await _context.CrisisCases
                .Include(c => c.Recommendation)
                .Include(c => c.DuplicateRecords)
                .FirstOrDefaultAsync(x => x.CaseNumber == caseNumber, cancellationToken);

            return c == null ? null : MapToDto(c);
        }

        public async Task<bool> SubmitHumanDecisionAsync(string caseNumber, HumanDecisionRequest decision, CancellationToken cancellationToken = default)
        {
            var c = await _context.CrisisCases
                .Include(x => x.Recommendation)
                .FirstOrDefaultAsync(x => x.CaseNumber == caseNumber, cancellationToken);

            if (c == null) return false;

            // Record immutable human-in-the-loop audit record
            var audit = new HumanDecisionAudit
            {
                CaseId = c.Id,
                OriginalRecommendationJson = JsonSerializer.Serialize(c.Recommendation),
                ActionTaken = decision.Action,
                ModificationsJson = JsonSerializer.Serialize(new
                {
                    category = decision.ModifiedCategory,
                    urgency = decision.ModifiedUrgency,
                    action = decision.ModifiedAction
                }),
                Justification = decision.Justification ?? $"Human coordinator action: {decision.Action}",
                ReviewerId = decision.ReviewerEmail ?? "coordinator@resqnet.org",
                ReviewerEmail = decision.ReviewerEmail ?? "coordinator@resqnet.org",
                DecidedAt = DateTime.UtcNow
            };

            await _context.HumanDecisionAudits.AddAsync(audit, cancellationToken);

            // Update Case status based on human coordinator action
            c.Status = decision.Action switch
            {
                "Approve" => "Approved",
                "Modify" => "Approved with Modifications",
                "Reject" => "Rejected",
                "Defer" => "Deferred for Investigation",
                _ => c.Status
            };

            if (decision.Action == "Modify" && c.Recommendation != null)
            {
                if (!string.IsNullOrWhiteSpace(decision.ModifiedCategory))
                    c.Recommendation.Category = decision.ModifiedCategory;
                if (!string.IsNullOrWhiteSpace(decision.ModifiedUrgency))
                    c.Recommendation.Urgency = decision.ModifiedUrgency;
            }

            c.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync(cancellationToken);

            return true;
        }

        private static CaseReviewDto MapToDto(CrisisCase c)
        {
            var dup = c.DuplicateRecords.FirstOrDefault();
            return new CaseReviewDto
            {
                Id = c.Id,
                CaseNumber = c.CaseNumber,
                Title = c.Title,
                Location = c.Location,
                RequestDetails = c.RequestDetails,
                Evidence = c.Evidence,
                Status = c.Status,
                AssignedAgency = c.AssignedAgency,
                PossibleDuplicate = dup?.SuspectedDuplicateNumber,
                DuplicateRiskLevel = dup?.RiskLevel,
                Recommendation = c.Recommendation == null ? null : new AiRecommendationDto
                {
                    Id = c.Recommendation.Id,
                    Category = c.Recommendation.Category,
                    Urgency = c.Recommendation.Urgency,
                    View = c.Recommendation.ViewRecommendation,
                    Suggest = c.Recommendation.SuggestAction,
                    PriorityScore = c.Recommendation.PriorityScore,
                    Confidence = c.Recommendation.Confidence,
                    Rationale = c.Recommendation.Rationale,
                    ProviderStrategy = c.Recommendation.ProviderStrategy
                }
            };
        }
    }

    public class AiAssistantService : IAiAssistantService
    {
        private readonly IAiGateway _aiGateway;

        public AiAssistantService(IAiGateway aiGateway)
        {
            _aiGateway = aiGateway;
        }

        public async Task<ChatResponse> AskAssistantAsync(ChatRequest request)
        {
            return await _aiGateway.ProcessChatQueryAsync(request);
        }
    }

    public class ForecastingService : IForecastingService
    {
        private readonly ApplicationDbContext _context;

        public ForecastingService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<IReadOnlyList<DemandForecastDto>> GetForecastsAsync(CancellationToken cancellationToken = default)
        {
            var forecasts = await _context.DemandForecasts.AsNoTracking().ToListAsync(cancellationToken);
            return forecasts.Select(f => new DemandForecastDto
            {
                Id = f.Id,
                Region = f.Region,
                DisasterType = f.DisasterType,
                ResourceCategory = f.ResourceCategory,
                ProjectedQuantity = f.ProjectedQuantity,
                Unit = f.Unit,
                Confidence = f.Confidence,
                ForecastPeriod = f.ForecastPeriod
            }).ToList();
        }
    }
}
