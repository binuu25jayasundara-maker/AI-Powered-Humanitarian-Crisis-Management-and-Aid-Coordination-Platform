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

    public class DuplicateService : IDuplicateService
    {
        private readonly ApplicationDbContext _context;

        public DuplicateService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<DuplicateCheckResult?> CheckDuplicateAgainstCasesAsync(
            string requestDetails,
            string location,
            DateTime createdAt,
            string? excludeCaseNumber = null,
            CancellationToken cancellationToken = default)
        {
            var storedCases = await _context.CrisisCases
                .AsNoTracking()
                .ToListAsync(cancellationToken);

            var newTokens = RuleBasedAiStrategy.TokenizeAndNormalize(requestDetails);
            if (newTokens.Count == 0) return null;

            DuplicateCheckResult? bestMatch = null;
            decimal highestScore = 0m;

            foreach (var sc in storedCases)
            {
                // Exclude the case itself from comparison
                if (!string.IsNullOrWhiteSpace(excludeCaseNumber) &&
                    string.Equals(sc.CaseNumber, excludeCaseNumber, StringComparison.OrdinalIgnoreCase))
                {
                    continue;
                }

                var existingTokens = RuleBasedAiStrategy.TokenizeAndNormalize(sc.RequestDetails);
                if (existingTokens.Count == 0) continue;

                int intersection = newTokens.Count(t => existingTokens.Contains(t));
                int union = newTokens.Union(existingTokens).Count();
                decimal baseScore = union == 0 ? 0m : (decimal)intersection / union;

                decimal bonus = 0m;

                // Location match bonus (+0.15)
                if (!string.IsNullOrWhiteSpace(location) && !string.IsNullOrWhiteSpace(sc.Location))
                {
                    var locA = location.Trim().ToLowerInvariant();
                    var locB = sc.Location.Trim().ToLowerInvariant();
                    if (locA == locB || locA.Contains(locB) || locB.Contains(locA))
                    {
                        bonus += 0.15m;
                    }
                }

                // Within 24 hours bonus (+0.10)
                if ((createdAt - sc.CreatedAt).Duration() <= TimeSpan.FromHours(24))
                {
                    bonus += 0.10m;
                }

                decimal totalScore = Math.Clamp(baseScore + bonus, 0m, 1.00m);
                totalScore = Math.Round(totalScore, 2);

                if (totalScore >= 0.25m && totalScore > highestScore)
                {
                    highestScore = totalScore;
                    string riskLevel = totalScore >= 0.70m ? "High" : totalScore >= 0.45m ? "Medium" : "Low";
                    var overlapping = newTokens.Intersect(existingTokens);

                    bestMatch = new DuplicateCheckResult
                    {
                        CaseNumber = excludeCaseNumber ?? string.Empty,
                        SuspectedDuplicate = sc.CaseNumber,
                        SimilarityScore = totalScore,
                        RiskLevel = riskLevel,
                        Rationale = $"Overlap score: {totalScore:P0} (Jaccard: {baseScore:P0}, Bonus: {bonus:P0}) with {sc.CaseNumber}. Matching keywords: [{string.Join(", ", overlapping)}]."
                    };
                }
            }

            return bestMatch;
        }
    }

    public class CaseReviewService : ICaseReviewService
    {
        private readonly ApplicationDbContext _context;
        private readonly IAiGateway _aiGateway;
        private readonly IDuplicateService _duplicateService;

        public CaseReviewService(
            ApplicationDbContext context,
            IAiGateway aiGateway,
            IDuplicateService duplicateService)
        {
            _context = context;
            _aiGateway = aiGateway;
            _duplicateService = duplicateService;
        }

        public CaseReviewService(ApplicationDbContext context)
            : this(context, new AiGateway(new IAiProcessingStrategy[] { new RuleBasedAiStrategy() }), new DuplicateService(context))
        {
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

        public async Task<(string CaseNumber, AiRecommendationDto Recommendation)> CreateCaseAsync(CreateCaseRequest request, CancellationToken cancellationToken = default)
        {
            // Determine new case number: highest existing numeric case number + 1
            var existingNumbers = await _context.CrisisCases
                .AsNoTracking()
                .Select(c => c.CaseNumber)
                .ToListAsync(cancellationToken);

            int highestNumber = 1000;
            foreach (var numStr in existingNumbers)
            {
                var clean = numStr.Trim().TrimStart('#');
                if (int.TryParse(clean, out int parsedNum) && parsedNum > highestNumber)
                {
                    highestNumber = parsedNum;
                }
            }
            string newCaseNumber = $"#{highestNumber + 1}";

            // Run AI gateway to produce recommendation
            var recDto = await _aiGateway.GetRecommendationForCaseAsync(request.Description, request.Location, "");

            var newCase = new CrisisCase
            {
                Id = Guid.NewGuid(),
                CaseNumber = newCaseNumber,
                Title = $"{request.Category.Trim()}, {request.Location.Trim()}",
                Location = request.Location.Trim(),
                RequestDetails = request.Description.Trim(),
                Evidence = string.Empty,
                Status = "Assessed - awaiting approval",
                AssignedAgency = "DMC-LK",
                CreatedAt = DateTime.UtcNow
            };

            var recEntity = new AiRecommendation
            {
                Id = recDto.Id != Guid.Empty ? recDto.Id : Guid.NewGuid(),
                CaseId = newCase.Id,
                Category = recDto.Category,
                Urgency = recDto.Urgency,
                ViewRecommendation = recDto.View,
                SuggestAction = recDto.Suggest,
                PriorityScore = recDto.PriorityScore,
                Confidence = recDto.Confidence,
                Rationale = recDto.Rationale,
                ProviderStrategy = recDto.ProviderStrategy
            };
            newCase.Recommendation = recEntity;

            // Check duplicate against existing stored cases
            var duplicateMatch = await _duplicateService.CheckDuplicateAgainstCasesAsync(
                request.Description,
                request.Location,
                newCase.CreatedAt,
                newCaseNumber,
                cancellationToken);

            if (duplicateMatch != null)
            {
                var dupRecord = new DuplicateDetectionRecord
                {
                    Id = Guid.NewGuid(),
                    PrimaryCaseId = newCase.Id,
                    SuspectedDuplicateNumber = duplicateMatch.SuspectedDuplicate,
                    SimilarityScore = duplicateMatch.SimilarityScore,
                    RiskLevel = duplicateMatch.RiskLevel,
                    Rationale = duplicateMatch.Rationale,
                    CreatedAt = DateTime.UtcNow
                };
                newCase.DuplicateRecords.Add(dupRecord);
            }

            await _context.CrisisCases.AddAsync(newCase, cancellationToken);
            await _context.AiRecommendations.AddAsync(recEntity, cancellationToken);
            await _context.SaveChangesAsync(cancellationToken);

            return (newCaseNumber, recDto);
        }

        public async Task<OverrideMetricsDto> GetOverrideMetricsAsync(CancellationToken cancellationToken = default)
        {
            var audits = await _context.HumanDecisionAudits
                .Include(a => a.Case)
                    .ThenInclude(c => c.Recommendation)
                .AsNoTracking()
                .ToListAsync(cancellationToken);

            // Decisions: Approve, Modify, Reject. Defer is reported separately and excluded from override rate.
            int totalDecisions = 0;
            int modifiedOrRejected = 0;
            int deferredDecisions = 0;

            var categoryAudits = new Dictionary<string, List<HumanDecisionAudit>>(StringComparer.OrdinalIgnoreCase);

            foreach (var a in audits)
            {
                var category = a.Case?.Recommendation?.Category ?? "Disaster Relief";
                if (!categoryAudits.ContainsKey(category))
                {
                    categoryAudits[category] = new List<HumanDecisionAudit>();
                }
                categoryAudits[category].Add(a);

                if (string.Equals(a.ActionTaken, "Approve", StringComparison.OrdinalIgnoreCase))
                {
                    totalDecisions++;
                }
                else if (string.Equals(a.ActionTaken, "Modify", StringComparison.OrdinalIgnoreCase) ||
                         string.Equals(a.ActionTaken, "Reject", StringComparison.OrdinalIgnoreCase))
                {
                    totalDecisions++;
                    modifiedOrRejected++;
                }
                else if (string.Equals(a.ActionTaken, "Defer", StringComparison.OrdinalIgnoreCase))
                {
                    deferredDecisions++;
                }
            }

            decimal overallPct = totalDecisions == 0 ? 0m : Math.Round((decimal)modifiedOrRejected / totalDecisions * 100m, 2);

            var result = new OverrideMetricsDto
            {
                TotalDecisions = totalDecisions,
                ModifiedOrRejectedCount = modifiedOrRejected,
                OverridePercentage = overallPct,
                DeferredDecisions = deferredDecisions
            };

            foreach (var kvp in categoryAudits)
            {
                int catTotal = 0;
                int catModRej = 0;
                int catDefer = 0;

                foreach (var a in kvp.Value)
                {
                    if (string.Equals(a.ActionTaken, "Approve", StringComparison.OrdinalIgnoreCase))
                    {
                        catTotal++;
                    }
                    else if (string.Equals(a.ActionTaken, "Modify", StringComparison.OrdinalIgnoreCase) ||
                             string.Equals(a.ActionTaken, "Reject", StringComparison.OrdinalIgnoreCase))
                    {
                        catTotal++;
                        catModRej++;
                    }
                    else if (string.Equals(a.ActionTaken, "Defer", StringComparison.OrdinalIgnoreCase))
                    {
                        catDefer++;
                    }
                }

                decimal catPct = catTotal == 0 ? 0m : Math.Round((decimal)catModRej / catTotal * 100m, 2);
                result.ByCategory[kvp.Key] = new CategoryOverrideMetricsDto
                {
                    TotalDecisions = catTotal,
                    ModifiedOrRejectedCount = catModRej,
                    OverridePercentage = catPct,
                    DeferredDecisions = catDefer
                };
            }

            return result;
        }

        public async Task<bool> SubmitHumanDecisionAsync(string caseNumber, HumanDecisionRequest decision, CancellationToken cancellationToken = default)
        {
            var c = await _context.CrisisCases
                .Include(x => x.Recommendation)
                .FirstOrDefaultAsync(x => x.CaseNumber == caseNumber, cancellationToken);

            if (c == null) return false;

            // Serialize a DTO, NOT the entity, avoiding circular references
            var recDto = c.Recommendation == null ? null : new AiRecommendationDto
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
            };

            // Record immutable human-in-the-loop audit record
            var audit = new HumanDecisionAudit
            {
                CaseId = c.Id,
                OriginalRecommendationJson = JsonSerializer.Serialize(recDto),
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
