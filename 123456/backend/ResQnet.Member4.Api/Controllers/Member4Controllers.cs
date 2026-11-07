using System;
using System.Collections.Generic;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ResQnet.Member4.Application.Common;
using ResQnet.Member4.Application.DTOs;
using ResQnet.Member4.Application.Interfaces;

namespace ResQnet.Member4.Api.Controllers
{
    // Case review and human decisions: EmergencyCoordinator, CaseManager only
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "EmergencyCoordinator,CaseManager")]
    public class CasesController : ControllerBase
    {
        private readonly ICaseReviewService _caseService;

        public CasesController(ICaseReviewService caseService)
        {
            _caseService = caseService;
        }

        [HttpGet]
        public async Task<ActionResult<ApiResponse<IReadOnlyList<CaseReviewDto>>>> GetAll()
        {
            var cases = await _caseService.GetAllCasesAsync();
            return Ok(ApiResponse<IReadOnlyList<CaseReviewDto>>.Ok(cases));
        }

        [HttpGet("{caseNumber}")]
        public async Task<ActionResult<ApiResponse<CaseReviewDto>>> GetByCaseNumber(string caseNumber)
        {
            // Allow querying by '#2341' or '2341'
            var formatted = caseNumber.StartsWith("#") ? caseNumber : "#" + caseNumber;
            var c = await _caseService.GetCaseByNumberAsync(formatted);
            if (c == null)
            {
                return NotFound(ApiResponse<CaseReviewDto>.Fail($"Case {caseNumber} not found."));
            }
            return Ok(ApiResponse<CaseReviewDto>.Ok(c));
        }

        [HttpPost("{caseNumber}/decision")]
        public async Task<ActionResult<ApiResponse<bool>>> SubmitHumanDecision(string caseNumber, [FromBody] HumanDecisionRequest request)
        {
            // Requirement: reviewer identity comes from the JWT token, not from the request body.
            // Member1 adds "email" via JwtRegisteredClaimNames.Email (literal "email" claim name).
            var reviewerEmail = User.FindFirstValue(JwtRegisteredClaimNames.Email)
                ?? User.FindFirstValue("email")
                ?? User.Identity?.Name;

            if (string.IsNullOrWhiteSpace(reviewerEmail))
                return Unauthorized(ApiResponse<bool>.Fail("Reviewer identity not found in token."));

            // Override whatever the client sent with the authenticated identity
            request.ReviewerEmail = reviewerEmail;

            var formatted = caseNumber.StartsWith("#") ? caseNumber : "#" + caseNumber;
            var success = await _caseService.SubmitHumanDecisionAsync(formatted, request);
            if (!success)
            {
                return NotFound(ApiResponse<bool>.Fail($"Case {caseNumber} not found."));
            }
            return Ok(ApiResponse<bool>.Ok(true, $"Case {caseNumber} human decision recorded successfully ({request.Action})."));
        }
    }

    [ApiController]
    [Route("api/ai")]
    [Authorize]  // Base: any authenticated user (citizen chat assistant)
    public class AiServicesController : ControllerBase
    {
        private readonly IAiAssistantService _assistantService;
        private readonly IForecastingService _forecastingService;
        private readonly IAiGateway _aiGateway;

        public AiServicesController(
            IAiAssistantService assistantService,
            IForecastingService forecastingService,
            IAiGateway aiGateway)
        {
            _assistantService = assistantService;
            _forecastingService = forecastingService;
            _aiGateway = aiGateway;
        }

        // Citizen chat assistant — any authenticated user
        [HttpPost("chat")]
        public async Task<ActionResult<ApiResponse<ChatResponse>>> AskAssistant([FromBody] ChatRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Question))
            {
                return BadRequest(ApiResponse<ChatResponse>.Fail("Question cannot be empty."));
            }
            var response = await _assistantService.AskAssistantAsync(request);
            return Ok(ApiResponse<ChatResponse>.Ok(response));
        }

        // Forecasts — EmergencyCoordinator, CaseManager, LogisticsManager
        [HttpGet("forecasts")]
        [Authorize(Roles = "EmergencyCoordinator,CaseManager,LogisticsManager")]
        public async Task<ActionResult<ApiResponse<IReadOnlyList<DemandForecastDto>>>> GetForecasts()
        {
            var forecasts = await _forecastingService.GetForecastsAsync();
            return Ok(ApiResponse<IReadOnlyList<DemandForecastDto>>.Ok(forecasts));
        }

        // Duplicate detection — EmergencyCoordinator, CaseManager
        [HttpPost("check-duplicates")]
        [Authorize(Roles = "EmergencyCoordinator,CaseManager")]
        public async Task<ActionResult<ApiResponse<DuplicateCheckResult?>>> CheckDuplicates([FromBody] DuplicateCheckRequest request)
        {
            var result = await _aiGateway.CheckDuplicateAsync(request.NewText, request.ExistingText, request.ExistingCaseNumber);
            return Ok(ApiResponse<DuplicateCheckResult?>.Ok(result));
        }
    }

    public class DuplicateCheckRequest
    {
        public string NewText { get; set; } = string.Empty;
        public string ExistingText { get; set; } = string.Empty;
        public string ExistingCaseNumber { get; set; } = "#2187";
    }
}
