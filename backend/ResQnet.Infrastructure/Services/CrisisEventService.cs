using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using ResQnet.Infrastructure.Data;
using ResQnet.UnifiedApi.Models;

namespace ResQnet.UnifiedApi.Services
{
    public class CrisisEventService : ICrisisEventService
    {
        private readonly ResQnetDbContext _db;

        public CrisisEventService(ResQnetDbContext db)
        {
            _db = db;
        }

        public async Task<List<CrisisEventDto>> GetAllAsync()
        {
            var events = await _db.CrisisEvents
                .Include(e => e.Areas)
                .OrderByDescending(e => e.StartedAt)
                .ToListAsync();

            return events.Select(MapToDto).ToList();
        }

        public async Task<CrisisEventDto?> GetByIdAsync(Guid id)
        {
            var ev = await _db.CrisisEvents
                .Include(e => e.Areas)
                .FirstOrDefaultAsync(e => e.Id == id);

            return ev == null ? null : MapToDto(ev);
        }

        public async Task<CrisisEventDto> CreateAsync(CreateCrisisEventDto dto)
        {
            if (!Enum.TryParse<EventSeverity>(dto.Severity?.Trim(), ignoreCase: true, out var severity))
            {
                throw new ArgumentException($"Invalid severity: '{dto.Severity}'. Valid values: Critical, High, Moderate, Low.");
            }

            var startedAt = DateTime.UtcNow;
            if (!string.IsNullOrWhiteSpace(dto.StartedAt) && DateTime.TryParse(dto.StartedAt, out var parsed))
            {
                startedAt = parsed.ToUniversalTime();
            }

            var ev = new CrisisEvent
            {
                Id = Guid.NewGuid(),
                Name = dto.Name.Trim(),
                Type = dto.Type.Trim(),
                Severity = severity,
                Status = EventStatus.Planned,
                Description = dto.Description.Trim(),
                StartedAt = startedAt,
                Areas = new List<OperationalArea>()
            };

            _db.CrisisEvents.Add(ev);
            await _db.SaveChangesAsync();

            return MapToDto(ev);
        }

        public async Task<CrisisEventDto?> UpdateAsync(Guid id, UpdateCrisisEventDto dto)
        {
            var ev = await _db.CrisisEvents
                .Include(e => e.Areas)
                .FirstOrDefaultAsync(e => e.Id == id);

            if (ev == null) return null;

            if (!string.IsNullOrWhiteSpace(dto.Name)) ev.Name = dto.Name.Trim();
            if (!string.IsNullOrWhiteSpace(dto.Type)) ev.Type = dto.Type.Trim();
            if (!string.IsNullOrWhiteSpace(dto.Description)) ev.Description = dto.Description.Trim();

            if (!string.IsNullOrWhiteSpace(dto.Severity))
            {
                if (!Enum.TryParse<EventSeverity>(dto.Severity.Trim(), ignoreCase: true, out var sev))
                {
                    throw new ArgumentException($"Invalid severity: '{dto.Severity}'");
                }
                ev.Severity = sev;
            }

            if (!string.IsNullOrWhiteSpace(dto.Status))
            {
                if (!Enum.TryParse<EventStatus>(dto.Status.Trim(), ignoreCase: true, out var st))
                {
                    throw new ArgumentException($"Invalid status: '{dto.Status}'");
                }
                ev.Status = st;
            }

            if (!string.IsNullOrWhiteSpace(dto.StartedAt) && DateTime.TryParse(dto.StartedAt, out var parsed))
            {
                ev.StartedAt = parsed.ToUniversalTime();
            }

            await _db.SaveChangesAsync();
            return MapToDto(ev);
        }

        public async Task<CrisisEventDto?> SetStatusAsync(Guid id, string status)
        {
            var ev = await _db.CrisisEvents
                .Include(e => e.Areas)
                .FirstOrDefaultAsync(e => e.Id == id);

            if (ev == null) return null;

            if (!Enum.TryParse<EventStatus>(status?.Trim(), ignoreCase: true, out var st))
            {
                throw new ArgumentException($"Invalid event status: '{status}'. Valid values: Planned, Active, Monitoring, Closed.");
            }

            ev.Status = st;
            await _db.SaveChangesAsync();

            return MapToDto(ev);
        }

        public async Task<CrisisEventDto?> AddAreaAsync(Guid id, AddOperationalAreaDto dto)
        {
            var ev = await _db.CrisisEvents
                .Include(e => e.Areas)
                .FirstOrDefaultAsync(e => e.Id == id);

            if (ev == null) return null;

            var areaStatus = AreaStatus.Affected;
            if (!string.IsNullOrWhiteSpace(dto.Status))
            {
                if (!Enum.TryParse<AreaStatus>(dto.Status.Trim(), ignoreCase: true, out var parsedStatus))
                {
                    throw new ArgumentException($"Invalid area status: '{dto.Status}'. Valid values: Affected, Responding, Stabilised, Cleared.");
                }
                areaStatus = parsedStatus;
            }

            var area = new OperationalArea
            {
                Id = Guid.NewGuid(),
                CrisisEventId = ev.Id,
                Name = dto.Name.Trim(),
                District = dto.District.Trim(),
                PopulationAtRisk = dto.PopulationAtRisk,
                Status = areaStatus
            };

            ev.Areas.Add(area);
            _db.OperationalAreas.Add(area);
            await _db.SaveChangesAsync();

            return MapToDto(ev);
        }

        private static CrisisEventDto MapToDto(CrisisEvent ev)
        {
            return new CrisisEventDto
            {
                Id = ev.Id.ToString(),
                Name = ev.Name,
                Type = ev.Type,
                Severity = ev.Severity.ToString(),
                Status = ev.Status.ToString(),
                Description = ev.Description,
                StartedAt = ev.StartedAt.ToString("o"),
                Areas = ev.Areas.Select(a => new OperationalAreaDto
                {
                    Id = a.Id.ToString(),
                    Name = a.Name,
                    District = a.District,
                    PopulationAtRisk = a.PopulationAtRisk,
                    Status = a.Status.ToString()
                }).ToList()
            };
        }
    }
}