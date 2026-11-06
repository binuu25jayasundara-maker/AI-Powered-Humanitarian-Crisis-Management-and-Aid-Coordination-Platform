using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using ResQnet.UnifiedApi.Data;
using ResQnet.UnifiedApi.Models;

namespace ResQnet.UnifiedApi.Services
{
    public interface ICaseService
    {
        Task<IReadOnlyList<CaseReviewDto>> GetAllCasesAsync();
        Task<CaseReviewDto?> GetCaseByNumberAsync(string caseNumber);
        Task<CaseReviewDto?> GetCaseByIdAsync(string id);
        Task<CaseReviewDto> CreateCaseAsync(CreateCaseDto dto);
        Task<CaseReviewDto?> UpdateCaseAsync(string idOrNumber, UpdateCaseDto dto);
        Task<bool> SubmitHumanDecisionAsync(string caseNumber, HumanDecisionRequest request);
    }

    public class CaseService : ICaseService
    {
        private readonly AppDbContext _context;

        public CaseService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<IReadOnlyList<CaseReviewDto>> GetAllCasesAsync()
        {
            var cases = await _context.Cases
                .OrderByDescending(c => c.CreatedAt)
                .ToListAsync();

            return cases.Select(MapToDto).ToList();
        }

        public async Task<CaseReviewDto?> GetCaseByNumberAsync(string caseNumber)
        {
            var formatted = caseNumber.StartsWith("#") ? caseNumber : "#" + caseNumber;
            var c = await _context.Cases.FirstOrDefaultAsync(x => x.CaseNumber == formatted || x.CaseNumber == caseNumber);
            return c == null ? null : MapToDto(c);
        }

        public async Task<CaseReviewDto?> GetCaseByIdAsync(string id)
        {
            var c = await _context.Cases.FirstOrDefaultAsync(x => x.Id == id || x.CaseNumber == id || x.CaseNumber == "#" + id);
            return c == null ? null : MapToDto(c);
        }

        public async Task<CaseReviewDto> CreateCaseAsync(CreateCaseDto dto)
        {
            var total = await _context.Cases.CountAsync();
            var nextNum = $"#{2000 + total + 1}";

            var c = new CrisisCase
            {
                CaseNumber = nextNum,
                Title = dto.Title,
                Location = dto.Location,
                RequestDetails = dto.RequestDetails,
                Evidence = dto.Evidence ?? "Direct Citizen Incident Report",
                Status = "Pending",
                Urgency = dto.Urgency ?? "Medium",
                Category = dto.Category ?? "Disaster Relief",
                PeopleAffected = dto.PeopleAffected > 0 ? dto.PeopleAffected : 1,
                AssignedAgency = "DMC-LK",
                DueAt = DateTime.UtcNow.AddHours(24),
                CreatedAt = DateTime.UtcNow
            };

            await _context.Cases.AddAsync(c);
            await _context.SaveChangesAsync();
            return MapToDto(c);
        }

        public async Task<CaseReviewDto?> UpdateCaseAsync(string idOrNumber, UpdateCaseDto dto)
        {
            var c = await _context.Cases.FirstOrDefaultAsync(x => x.Id == idOrNumber || x.CaseNumber == idOrNumber || x.CaseNumber == "#" + idOrNumber);
            if (c == null) return null;

            if (!string.IsNullOrWhiteSpace(dto.Title)) c.Title = dto.Title;
            if (!string.IsNullOrWhiteSpace(dto.Location)) c.Location = dto.Location;
            if (!string.IsNullOrWhiteSpace(dto.RequestDetails)) c.RequestDetails = dto.RequestDetails;
            if (!string.IsNullOrWhiteSpace(dto.Evidence)) c.Evidence = dto.Evidence;
            if (!string.IsNullOrWhiteSpace(dto.Status)) c.Status = dto.Status;
            if (!string.IsNullOrWhiteSpace(dto.Urgency)) c.Urgency = dto.Urgency;
            if (!string.IsNullOrWhiteSpace(dto.AssignedAgency)) c.AssignedAgency = dto.AssignedAgency;
            if (dto.PeopleAffected.HasValue) c.PeopleAffected = dto.PeopleAffected.Value;

            await _context.SaveChangesAsync();
            return MapToDto(c);
        }

        public async Task<bool> SubmitHumanDecisionAsync(string caseNumber, HumanDecisionRequest request)
        {
            var formatted = caseNumber.StartsWith("#") ? caseNumber : "#" + caseNumber;
            var c = await _context.Cases.FirstOrDefaultAsync(x => x.CaseNumber == formatted);
            if (c == null) return false;

            c.Status = request.Action == "Approved" ? "Active" : request.Action == "Rejected" ? "Closed" : "Active";
            await _context.SaveChangesAsync();
            return true;
        }

        private static CaseReviewDto MapToDto(CrisisCase c)
        {
            AiRecommendationDto? rec = null;
            if (!string.IsNullOrWhiteSpace(c.RecommendationJson))
            {
                try
                {
                    rec = JsonSerializer.Deserialize<AiRecommendationDto>(c.RecommendationJson);
                }
                catch { }
            }

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
                PossibleDuplicate = c.PossibleDuplicate,
                DuplicateRiskLevel = c.DuplicateRiskLevel,
                Recommendation = rec,
                Urgency = c.Urgency,
                PeopleAffected = c.PeopleAffected,
                DueAt = c.DueAt.ToString("o"),
                CreatedAt = c.CreatedAt.ToString("o")
            };
        }
    }
}
