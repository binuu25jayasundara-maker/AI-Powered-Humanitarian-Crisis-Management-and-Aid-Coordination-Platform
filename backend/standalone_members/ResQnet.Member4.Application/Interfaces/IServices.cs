using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using ResQnet.Member4.Application.DTOs;

namespace ResQnet.Member4.Application.Interfaces
{
    public interface IAiGateway
    {
        Task<AiRecommendationDto> GetRecommendationForCaseAsync(string requestDetails, string location, string evidence, string? preferredStrategy = null);
        Task<ChatResponse> ProcessChatQueryAsync(ChatRequest request);
        Task<DuplicateCheckResult?> CheckDuplicateAsync(string newText, string existingText, string existingCaseNum);
    }

    public interface ICaseReviewService
    {
        Task<IReadOnlyList<CaseReviewDto>> GetAllCasesAsync(CancellationToken cancellationToken = default);
        Task<CaseReviewDto?> GetCaseByNumberAsync(string caseNumber, CancellationToken cancellationToken = default);
        Task<bool> SubmitHumanDecisionAsync(string caseNumber, HumanDecisionRequest decision, CancellationToken cancellationToken = default);
        Task<(string CaseNumber, AiRecommendationDto Recommendation)> CreateCaseAsync(CreateCaseRequest request, CancellationToken cancellationToken = default);
        Task<OverrideMetricsDto> GetOverrideMetricsAsync(CancellationToken cancellationToken = default);
    }

    public interface IDuplicateService
    {
        Task<DuplicateCheckResult?> CheckDuplicateAgainstCasesAsync(
            string requestDetails,
            string location,
            DateTime createdAt,
            string? excludeCaseNumber = null,
            CancellationToken cancellationToken = default);
    }

    public interface IAiAssistantService
    {
        Task<ChatResponse> AskAssistantAsync(ChatRequest request);
    }

    public interface IForecastingService
    {
        Task<IReadOnlyList<DemandForecastDto>> GetForecastsAsync(CancellationToken cancellationToken = default);
    }
}
