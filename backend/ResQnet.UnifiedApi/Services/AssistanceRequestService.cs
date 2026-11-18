using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using ResQnet.UnifiedApi.Data;
using ResQnet.UnifiedApi.Models;

namespace ResQnet.UnifiedApi.Services
{
    public interface IAssistanceRequestService
    {
        Task<AssistanceRequestDto> CreateAsync(CreateAssistanceRequestDto dto, string citizenEmail);
        Task<List<AssistanceRequestDto>> GetMineAsync(string citizenEmail, bool isStaff);
        Task<List<AssistanceRequestDto>> GetAllAsync(string? statusFilter, string? categoryFilter, string? urgencyFilter, bool isStaff);
        Task<AssistanceRequestDto?> GetByIdAsync(Guid id, string callerEmail, bool isStaff);
        Task<AssistanceRequestDto?> UpdateStatusAsync(Guid id, string newStatusDisplay, string? note, string changedByEmail);
        Task<(AssistanceRequestDto? dto, bool conflict)> LinkAiCaseAsync(Guid id, string aiCaseNumber, string calledByEmail);
    }

    public class AssistanceRequestService : IAssistanceRequestService
    {
        private readonly CoreDbContext _db;
        private readonly IStatusTransitionService _transitionService;
        private static readonly SemaphoreSlim _referenceLock = new(1, 1);

        public static readonly HashSet<string> AllowedCategories = new(StringComparer.OrdinalIgnoreCase)
        {
            "Food & Water",
            "Shelter",
            "Medical",
            "Rescue / Evacuation",
            "Other"
        };

        public static readonly HashSet<string> AllowedUrgencies = new(StringComparer.OrdinalIgnoreCase)
        {
            "Low",
            "Medium",
            "High",
            "Critical"
        };

        public AssistanceRequestService(CoreDbContext db, IStatusTransitionService transitionService)
        {
            _db = db;
            _transitionService = transitionService;
        }

        public async Task<AssistanceRequestDto> CreateAsync(CreateAssistanceRequestDto dto, string citizenEmail)
        {
            const int maxRetries = 5;
            for (int attempt = 0; attempt < maxRetries; attempt++)
            {
                await _referenceLock.WaitAsync();
                try
                {
                    var year = DateTime.UtcNow.Year;
                    var prefix = $"REQ-{year}-";

                    var maxSeq = await _db.AssistanceRequests
                        .Where(r => r.Reference.StartsWith(prefix))
                        .Select(r => (int?)r.SequenceNumber)
                        .MaxAsync() ?? 0;

                    var nextSeq = maxSeq + 1;
                    var reference = $"{prefix}{nextSeq:D5}";

                    var urgency = string.IsNullOrWhiteSpace(dto.Urgency) ? "Medium" : dto.Urgency.Trim();

                    var req = new AssistanceRequest
                    {
                        Id = Guid.NewGuid(),
                        Reference = reference,
                        SequenceNumber = nextSeq,
                        CitizenEmail = citizenEmail,
                        Category = dto.Category.Trim(),
                        Urgency = urgency,
                        Description = dto.Description.Trim(),
                        LocationText = dto.Location.Trim(),
                        Latitude = dto.Lat,
                        Longitude = dto.Lng,
                        ContactPhone = dto.ContactPhone?.Trim(),
                        EvidenceName = dto.EvidenceName?.Trim(),
                        HouseholdSize = dto.HouseholdSize,
                        Status = AssistanceRequestStatus.Submitted,
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow
                    };

                    var history = new RequestStatusHistory
                    {
                        Id = Guid.NewGuid(),
                        RequestId = req.Id,
                        OldStatus = AssistanceRequestStatus.Submitted,
                        NewStatus = AssistanceRequestStatus.Submitted,
                        ChangedByEmail = citizenEmail,
                        Note = "Request submitted",
                        Timestamp = req.CreatedAt
                    };

                    _db.AssistanceRequests.Add(req);
                    _db.RequestStatusHistories.Add(history);

                    try
                    {
                        await _db.SaveChangesAsync();
                        if (!req.History.Any(h => h.Id == history.Id))
                        {
                            req.History.Add(history);
                        }
                        return MapToDto(req, isOwner: true, isStaff: false);
                    }
                    catch (DbUpdateException) when (attempt < maxRetries - 1)
                    {
                        _db.ChangeTracker.Clear();
                        await Task.Delay(50);
                    }
                }
                finally
                {
                    _referenceLock.Release();
                }
            }

            throw new InvalidOperationException("Failed to generate a unique assistance request reference number.");
        }

        public async Task<List<AssistanceRequestDto>> GetMineAsync(string citizenEmail, bool isStaff)
        {
            var requests = await _db.AssistanceRequests
                .Include(r => r.History)
                .Where(r => r.CitizenEmail == citizenEmail)
                .OrderByDescending(r => r.CreatedAt)
                .ToListAsync();

            return requests.Select(r => MapToDto(r, isOwner: true, isStaff: isStaff)).ToList();
        }

        public async Task<List<AssistanceRequestDto>> GetAllAsync(string? statusFilter, string? categoryFilter, string? urgencyFilter, bool isStaff)
        {
            var query = _db.AssistanceRequests.Include(r => r.History).AsQueryable();

            if (!string.IsNullOrWhiteSpace(statusFilter))
            {
                if (_transitionService.TryParseStatus(statusFilter, out var st))
                {
                    query = query.Where(r => r.Status == st);
                }
            }

            if (!string.IsNullOrWhiteSpace(categoryFilter))
            {
                query = query.Where(r => r.Category == categoryFilter.Trim());
            }

            if (!string.IsNullOrWhiteSpace(urgencyFilter))
            {
                query = query.Where(r => r.Urgency == urgencyFilter.Trim());
            }

            var requests = await query.OrderByDescending(r => r.CreatedAt).ToListAsync();
            return requests.Select(r => MapToDto(r, isOwner: false, isStaff: isStaff)).ToList();
        }

        public async Task<AssistanceRequestDto?> GetByIdAsync(Guid id, string callerEmail, bool isStaff)
        {
            var req = await _db.AssistanceRequests
                .Include(r => r.History)
                .FirstOrDefaultAsync(r => r.Id == id);

            if (req == null) return null;

            var isOwner = req.CitizenEmail.Equals(callerEmail, StringComparison.OrdinalIgnoreCase);
            return MapToDto(req, isOwner: isOwner, isStaff: isStaff);
        }

        public async Task<AssistanceRequestDto?> UpdateStatusAsync(Guid id, string newStatusDisplay, string? note, string changedByEmail)
        {
            var req = await _db.AssistanceRequests
                .Include(r => r.History)
                .FirstOrDefaultAsync(r => r.Id == id);

            if (req == null) return null;

            if (!_transitionService.TryParseStatus(newStatusDisplay, out var newStatus))
            {
                throw new ArgumentException($"Invalid status value: '{newStatusDisplay}'");
            }

            if (!_transitionService.IsValidTransition(req.Status, newStatus))
            {
                throw new InvalidOperationException($"Invalid status transition from '{_transitionService.ToDisplayString(req.Status)}' to '{_transitionService.ToDisplayString(newStatus)}'.");
            }

            if (_transitionService.NoteRequired(newStatus) && string.IsNullOrWhiteSpace(note))
            {
                throw new ArgumentException($"A note is required for transition to '{_transitionService.ToDisplayString(newStatus)}'.");
            }

            var history = new RequestStatusHistory
            {
                Id = Guid.NewGuid(),
                RequestId = req.Id,
                OldStatus = req.Status,
                NewStatus = newStatus,
                ChangedByEmail = changedByEmail,
                Note = string.IsNullOrWhiteSpace(note) ? null : note.Trim(),
                Timestamp = DateTime.UtcNow
            };

            req.Status = newStatus;
            req.UpdatedAt = DateTime.UtcNow;

            _db.RequestStatusHistories.Add(history);
            await _db.SaveChangesAsync();

            if (!req.History.Any(h => h.Id == history.Id))
            {
                req.History.Add(history);
            }
            return MapToDto(req, isOwner: false, isStaff: true);
        }

        public async Task<(AssistanceRequestDto? dto, bool conflict)> LinkAiCaseAsync(Guid id, string aiCaseNumber, string calledByEmail)
        {
            var req = await _db.AssistanceRequests
                .Include(r => r.History)
                .FirstOrDefaultAsync(r => r.Id == id);

            if (req == null) return (null, false);

            // Normalise: strip leading '#', ensure it is digits-only, re-add '#'
            var trimmed = aiCaseNumber.TrimStart('#').Trim();
            var normalised = "#" + trimmed;

            // If already linked to a DIFFERENT number, return conflict
            if (!string.IsNullOrWhiteSpace(req.AiCaseNumber) &&
                !req.AiCaseNumber.Equals(normalised, StringComparison.OrdinalIgnoreCase))
            {
                return (MapToDto(req, isOwner: false, isStaff: true), true);
            }

            // Idempotent: same number already linked
            if (!string.IsNullOrWhiteSpace(req.AiCaseNumber) &&
                req.AiCaseNumber.Equals(normalised, StringComparison.OrdinalIgnoreCase))
            {
                return (MapToDto(req, isOwner: false, isStaff: true), false);
            }

            req.AiCaseNumber = normalised;
            req.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();

            return (MapToDto(req, isOwner: false, isStaff: true), false);
        }

        private AssistanceRequestDto MapToDto(AssistanceRequest req, bool isOwner, bool isStaff)
        {
            var showContact = isOwner || isStaff;

            return new AssistanceRequestDto
            {
                Id = req.Id.ToString(),
                Reference = req.Reference,
                Category = req.Category,
                Urgency = req.Urgency,
                Description = req.Description,
                Location = req.LocationText,
                Lat = req.Latitude,
                Lng = req.Longitude,
                ContactPhone = showContact ? req.ContactPhone : null,
                EvidenceName = req.EvidenceName,
                HouseholdSize = req.HouseholdSize,
                Status = _transitionService.ToDisplayString(req.Status),
                CitizenStage = _transitionService.ToCitizenStage(req.Status),
                AiCaseNumber = isStaff ? req.AiCaseNumber : null,
                CreatedAt = req.CreatedAt.ToString("o"),
                History = req.History
                    .OrderBy(h => h.Timestamp)
                    .Select(h => new RequestStatusHistoryDto
                    {
                        Id = h.Id.ToString(),
                        OldStatus = _transitionService.ToDisplayString(h.OldStatus),
                        NewStatus = _transitionService.ToDisplayString(h.NewStatus),
                        ChangedByEmail = isStaff ? h.ChangedByEmail : "Coordination team",
                        Note = h.Note,
                        Timestamp = h.Timestamp.ToString("o")
                    }).ToList()
            };
        }
    }
}