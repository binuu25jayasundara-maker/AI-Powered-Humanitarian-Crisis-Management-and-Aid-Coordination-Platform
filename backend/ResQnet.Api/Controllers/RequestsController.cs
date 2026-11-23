using ResQnet.Application.Common;
using System;
using System.Collections.Generic;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ResQnet.UnifiedApi.Data;
using ResQnet.UnifiedApi.Models;
using ResQnet.UnifiedApi.Services;

namespace ResQnet.UnifiedApi.Controllers
{
    [ApiController]
    [Route("api/requests")]
    [Authorize]
    public class RequestsController : ControllerBase
    {
        private readonly IAssistanceRequestService _requestService;
        private readonly CoreDbContext _db;

        public RequestsController(IAssistanceRequestService requestService, CoreDbContext db)
        {
            _requestService = requestService;
            _db = db;
        }

        private string GetCallerEmail()
        {
            return User.FindFirst(ClaimTypes.Email)?.Value
                ?? User.FindFirst("email")?.Value
                ?? User.FindFirst(System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Email)?.Value
                ?? string.Empty;
        }

        private string GetCallerRole()
        {
            return User.FindFirst(ClaimTypes.Role)?.Value
                ?? User.FindFirst("role")?.Value
                ?? string.Empty;
        }

        private bool IsStaffRole()
        {
            var role = GetCallerRole();
            return role is "EmergencyCoordinator" or "CaseManager";
        }

        [HttpPost]
        [Authorize(Roles = "Citizen,DonorAndVolunteer")]
        public async Task<IActionResult> Create([FromBody] CreateAssistanceRequestDto dto)
        {
            var errors = new List<string>();

            if (string.IsNullOrWhiteSpace(dto.Description) || dto.Description.Trim().Length < 10)
            {
                errors.Add("Description must be between 10 and 1000 characters.");
            }
            else if (dto.Description.Trim().Length > 1000)
            {
                errors.Add("Description must be between 10 and 1000 characters.");
            }

            if (string.IsNullOrWhiteSpace(dto.Location))
            {
                errors.Add("Location is required.");
            }

            if (string.IsNullOrWhiteSpace(dto.Category) || !AssistanceRequestService.AllowedCategories.Contains(dto.Category.Trim()))
            {
                errors.Add($"Category '{dto.Category}' is invalid. Allowed values: {string.Join(", ", AssistanceRequestService.AllowedCategories)}.");
            }

            if (!string.IsNullOrWhiteSpace(dto.Urgency) && !AssistanceRequestService.AllowedUrgencies.Contains(dto.Urgency.Trim()))
            {
                errors.Add($"Urgency '{dto.Urgency}' is invalid. Allowed values: {string.Join(", ", AssistanceRequestService.AllowedUrgencies)}.");
            }

            if (dto.Lat.HasValue && (dto.Lat.Value < -90 || dto.Lat.Value > 90))
            {
                errors.Add("Latitude must be between -90 and 90 degrees.");
            }

            if (dto.Lng.HasValue && (dto.Lng.Value < -180 || dto.Lng.Value > 180))
            {
                errors.Add("Longitude must be between -180 and 180 degrees.");
            }

            if (dto.HouseholdSize.HasValue && dto.HouseholdSize.Value < 1)
            {
                errors.Add("Household size must be at least 1.");
            }

            if (errors.Count > 0)
            {
                return BadRequest(ApiResponse<object>.Fail("Validation failed.", errors));
            }

            var result = await _requestService.CreateAsync(dto, GetCallerEmail());
            return StatusCode(201, ApiResponse<AssistanceRequestDto>.Ok(result, "Assistance request created successfully."));
        }

        [HttpGet("mine")]
        [Authorize(Roles = "Citizen,DonorAndVolunteer")]
        public async Task<IActionResult> GetMine()
        {
            var results = await _requestService.GetMineAsync(GetCallerEmail(), isStaff: false);
            return Ok(ApiResponse<List<AssistanceRequestDto>>.Ok(results));
        }

        [HttpGet]
        [Authorize(Roles = "EmergencyCoordinator,CaseManager")]
        public async Task<IActionResult> GetAll(
            [FromQuery] string? status,
            [FromQuery] string? category,
            [FromQuery] string? urgency)
        {
            var results = await _requestService.GetAllAsync(status, category, urgency, isStaff: true);
            return Ok(ApiResponse<List<AssistanceRequestDto>>.Ok(results));
        }

        [HttpGet("{id:guid}")]
        public async Task<IActionResult> GetById(Guid id)
        {
            var role = GetCallerRole();

            // SystemAdmin is explicitly forbidden from request content
            if (role == "SystemAdmin")
            {
                return Forbid();
            }

            var req = await _db.AssistanceRequests.FirstOrDefaultAsync(r => r.Id == id);
            if (req == null)
            {
                return NotFound(ApiResponse<object>.Fail("Assistance request not found."));
            }

            var isStaff = IsStaffRole();
            var callerEmail = GetCallerEmail();
            var isOwner = req.CitizenEmail.Equals(callerEmail, StringComparison.OrdinalIgnoreCase);

            if (!isStaff && !isOwner)
            {
                return Forbid();
            }

            var dto = await _requestService.GetByIdAsync(id, callerEmail, isStaff);
            return Ok(ApiResponse<AssistanceRequestDto>.Ok(dto!));
        }

        [HttpPut("{id:guid}/status")]
        [Authorize(Roles = "EmergencyCoordinator,CaseManager")]
        public async Task<IActionResult> UpdateStatus(Guid id, [FromBody] UpdateRequestStatusDto dto)
        {
            var targetStatus = dto.GetTargetStatus();
            if (string.IsNullOrWhiteSpace(targetStatus))
            {
                return BadRequest(ApiResponse<object>.Fail("Target status is required."));
            }

            try
            {
                var result = await _requestService.UpdateStatusAsync(id, targetStatus, dto.Note, GetCallerEmail());
                if (result == null)
                {
                    return NotFound(ApiResponse<object>.Fail("Assistance request not found."));
                }

                return Ok(ApiResponse<AssistanceRequestDto>.Ok(result, "Request status updated successfully."));
            }
            catch (ArgumentException ex)
            {
                return BadRequest(ApiResponse<object>.Fail(ex.Message));
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ApiResponse<object>.Fail(ex.Message));
            }
        }

        [HttpPut("{id:guid}/ai-link")]
        [Authorize(Roles = "EmergencyCoordinator,CaseManager")]
        public async Task<IActionResult> LinkAiCase(Guid id, [FromBody] LinkAiCaseDto dto)
        {
            var role = GetCallerRole();
            if (role == "SystemAdmin")
                return Forbid();

            if (string.IsNullOrWhiteSpace(dto.AiCaseNumber))
                return BadRequest(ApiResponse<object>.Fail("AiCaseNumber is required."));

            // Strip leading '#' for digit-only validation
            var digits = dto.AiCaseNumber.TrimStart('#').Trim();
            if (string.IsNullOrEmpty(digits) || !System.Text.RegularExpressions.Regex.IsMatch(digits, @"^\d{1,10}$"))
                return BadRequest(ApiResponse<object>.Fail("AiCaseNumber must be in the format '#<digits>' (1–10 digits)."));

            var (result, conflict) = await _requestService.LinkAiCaseAsync(id, dto.AiCaseNumber, GetCallerEmail());

            if (result == null)
                return NotFound(ApiResponse<object>.Fail("Assistance request not found."));

            if (conflict)
                return Conflict(ApiResponse<AssistanceRequestDto>.Fail(
                    $"This request is already linked to AI case '{result.AiCaseNumber}'. Cannot overwrite with a different case number."));

            return Ok(ApiResponse<AssistanceRequestDto>.Ok(result, "AI case number linked successfully."));
        }
    }
}