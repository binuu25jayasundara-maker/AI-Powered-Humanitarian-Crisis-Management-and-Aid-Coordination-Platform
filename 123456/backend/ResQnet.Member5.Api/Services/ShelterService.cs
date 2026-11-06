using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using ResQnet.Member5.Api.Data;
using ResQnet.Member5.Api.DTOs;
using ResQnet.Member5.Api.Interfaces;
using ResQnet.Member5.Api.Models;

namespace ResQnet.Member5.Api.Services
{
    public class ShelterService : IShelterService
    {
        private readonly ApplicationDbContext _context;
        private static readonly SemaphoreSlim _shelterLock = new(1, 1);

        public ShelterService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<List<ShelterDto>> GetAllSheltersAsync(string? search, string? operationalStatus, string? facility)
        {
            var query = _context.Shelters.AsNoTracking().AsQueryable();

            if (!string.IsNullOrWhiteSpace(operationalStatus) && operationalStatus != "All")
            {
                query = query.Where(s => s.OperationalStatus.ToLower() == operationalStatus.ToLower());
            }

            if (!string.IsNullOrWhiteSpace(facility) && facility != "All")
            {
                var fac = facility.ToLower();
                query = query.Where(s => s.FacilitiesRaw.ToLower().Contains(fac));
            }

            if (!string.IsNullOrWhiteSpace(search))
            {
                var term = search.ToLower();
                query = query.Where(s => s.Name.ToLower().Contains(term) || s.Location.ToLower().Contains(term));
            }

            var shelters = await query.OrderBy(s => s.Name).ToListAsync();
            return shelters.Select(MapToDto).ToList();
        }

        public async Task<ShelterDto?> GetShelterByIdAsync(int id)
        {
            var shelter = await _context.Shelters.AsNoTracking().FirstOrDefaultAsync(s => s.Id == id);
            return shelter == null ? null : MapToDto(shelter);
        }

        public async Task<ShelterDto> CreateShelterAsync(CreateShelterDto dto)
        {
            if (dto.TotalCapacity <= 0)
            {
                throw new ArgumentException("Total capacity must be strictly greater than zero.");
            }

            var shelter = new Shelter
            {
                Name = dto.Name.Trim(),
                Location = dto.Location.Trim(),
                Latitude = dto.Latitude != 0 ? dto.Latitude : 6.9535,
                Longitude = dto.Longitude != 0 ? dto.Longitude : 79.9167,
                TotalCapacity = dto.TotalCapacity,
                CurrentOccupancy = 0,
                OperationalStatus = "Open",
                Facilities = dto.Facilities ?? new List<string> { "Meals", "Drinking Water", "Sanitation" },
                ContactPerson = dto.ContactPerson?.Trim() ?? "Relief Coordinator",
                ContactPhone = dto.ContactPhone?.Trim() ?? "+94 11 000 0000",
                LastUpdated = DateTime.UtcNow
            };

            shelter.RecalculateStatus();
            _context.Shelters.Add(shelter);
            await _context.SaveChangesAsync();

            return MapToDto(shelter);
        }

        public async Task<ShelterDto?> UpdateShelterAsync(int id, UpdateShelterDto dto)
        {
            var shelter = await _context.Shelters.FindAsync(id);
            if (shelter == null) return null;

            if (dto.TotalCapacity <= 0)
            {
                throw new ArgumentException("Total capacity must be strictly greater than zero.");
            }

            if (dto.CurrentOccupancy > dto.TotalCapacity)
            {
                throw new InvalidOperationException("Occupancy cannot exceed total capacity.");
            }

            shelter.Name = dto.Name.Trim();
            shelter.Location = dto.Location.Trim();
            if (dto.Latitude != 0) shelter.Latitude = dto.Latitude;
            if (dto.Longitude != 0) shelter.Longitude = dto.Longitude;
            shelter.TotalCapacity = dto.TotalCapacity;
            shelter.CurrentOccupancy = dto.CurrentOccupancy;
            shelter.OperationalStatus = string.IsNullOrWhiteSpace(dto.OperationalStatus) ? shelter.OperationalStatus : dto.OperationalStatus;
            
            if (dto.Facilities != null)
            {
                shelter.Facilities = dto.Facilities;
            }
            if (!string.IsNullOrWhiteSpace(dto.ContactPerson)) shelter.ContactPerson = dto.ContactPerson.Trim();
            if (!string.IsNullOrWhiteSpace(dto.ContactPhone)) shelter.ContactPhone = dto.ContactPhone.Trim();

            shelter.RecalculateStatus();
            await _context.SaveChangesAsync();

            return MapToDto(shelter);
        }

        public async Task<ShelterCapacityDto?> GetCapacityAsync(int id)
        {
            var shelter = await _context.Shelters.AsNoTracking().FirstOrDefaultAsync(s => s.Id == id);
            if (shelter == null) return null;

            return new ShelterCapacityDto
            {
                ShelterId = shelter.Id,
                ShelterName = shelter.Name,
                TotalCapacity = shelter.TotalCapacity,
                CurrentOccupancy = shelter.CurrentOccupancy,
                AvailableSpaces = shelter.AvailableSpaces,
                OccupancyPercentage = shelter.OccupancyPercentage,
                Status = shelter.OperationalStatus
            };
        }

        public async Task<List<NearbyShelterDto>> GetNearbySheltersAsync(double lat, double lng, string? filter)
        {
            // Default center if not supplied: Kelaniya flood basin (6.9535, 79.9167)
            if (lat == 0 && lng == 0)
            {
                lat = 6.9535;
                lng = 79.9167;
            }

            var query = _context.Shelters.AsNoTracking().AsQueryable();

            if (!string.IsNullOrWhiteSpace(filter) && filter != "All")
            {
                var f = filter.ToLower();
                if (f == "open")
                {
                    query = query.Where(s => s.OperationalStatus == "Open");
                }
                else
                {
                    query = query.Where(s => s.FacilitiesRaw.ToLower().Contains(f));
                }
            }

            var shelters = await query.ToListAsync();

            var nearbyList = shelters.Select(s =>
            {
                var dist = CalculateHaversineDistanceKm(lat, lng, s.Latitude, s.Longitude);
                // Rough speed 25 km/h in crisis traffic plus 2 min buffer
                var travelMinutes = (int)Math.Max(3, Math.Round((dist / 25.0) * 60 + 2));

                return new NearbyShelterDto
                {
                    Id = s.Id,
                    Name = s.Name,
                    Location = s.Location,
                    Latitude = s.Latitude,
                    Longitude = s.Longitude,
                    TotalCapacity = s.TotalCapacity,
                    CurrentOccupancy = s.CurrentOccupancy,
                    AvailableSpaces = s.AvailableSpaces,
                    OccupancyPercentage = s.OccupancyPercentage,
                    OperationalStatus = s.OperationalStatus,
                    Facilities = s.Facilities,
                    ContactPerson = s.ContactPerson,
                    ContactPhone = s.ContactPhone,
                    LastUpdated = s.LastUpdated,
                    DistanceKm = Math.Round(dist, 1),
                    EstimatedTravelMinutes = travelMinutes
                };
            })
            .OrderBy(s => s.DistanceKm)
            .ToList();

            return nearbyList;
        }

        public async Task<HouseholdAllocationDto> AllocateHouseholdAsync(int shelterId, CreateHouseholdAllocationDto dto)
        {
            if (dto.NumberOfPeople <= 0)
            {
                throw new ArgumentException("Number of people must be at least 1.");
            }

            await _shelterLock.WaitAsync();
            try
            {
                var shelter = await _context.Shelters.FindAsync(shelterId);
                if (shelter == null)
                {
                    throw new KeyNotFoundException($"Shelter with ID {shelterId} not found.");
                }

                // Check operational status
                if (shelter.OperationalStatus == "Closed")
                {
                    throw new InvalidOperationException($"Cannot allocate to {shelter.Name}: This shelter is currently closed.");
                }

                // Strict Capacity Validation Guard
                var available = shelter.AvailableSpaces;
                if (dto.NumberOfPeople > available)
                {
                    // Find an alternative nearby shelter with available capacity to suggest
                    var alternative = await _context.Shelters
                        .Where(s => s.Id != shelterId && s.OperationalStatus == "Open" && (s.TotalCapacity - s.CurrentOccupancy) >= dto.NumberOfPeople)
                        .OrderBy(s => (s.TotalCapacity - s.CurrentOccupancy))
                        .FirstOrDefaultAsync();

                    var alternativeMsg = alternative != null
                        ? $" Suggest alternative shelter: '{alternative.Name}' with {alternative.AvailableSpaces} spaces available ({alternative.OccupancyPercentage}% occupied)."
                        : " No alternative shelters with sufficient capacity found.";

                    throw new InvalidOperationException(
                        $"Insufficient shelter capacity. This allocation exceeds the available spaces ({available} spaces left in {shelter.Name}).{alternativeMsg}"
                    );
                }

                // Prevent duplicate active allocations for the same case reference if specified
                if (!string.IsNullOrWhiteSpace(dto.CaseReferenceId))
                {
                    var existingCase = await _context.HouseholdAllocations
                        .AnyAsync(h => h.CaseReferenceId == dto.CaseReferenceId && h.Status == "Confirmed");
                    if (existingCase)
                    {
                        throw new InvalidOperationException($"An active household allocation already exists for Case Reference '{dto.CaseReferenceId}'.");
                    }
                }

                // Update occupancy atomically
                shelter.CurrentOccupancy += dto.NumberOfPeople;
                shelter.RecalculateStatus();

                var allocation = new HouseholdAllocation
                {
                    ShelterId = shelter.Id,
                    HouseholdHeadName = dto.HouseholdHeadName.Trim(),
                    CaseReferenceId = dto.CaseReferenceId?.Trim(),
                    NumberOfPeople = dto.NumberOfPeople,
                    SpecialNeeds = dto.SpecialNeeds?.Trim() ?? string.Empty,
                    AllocatedBy = string.IsNullOrWhiteSpace(dto.AllocatedBy) ? "Shelter Admin" : dto.AllocatedBy.Trim(),
                    Status = "Confirmed",
                    AllocatedAt = DateTime.UtcNow
                };

                _context.HouseholdAllocations.Add(allocation);
                await _context.SaveChangesAsync();

                return new HouseholdAllocationDto
                {
                    Id = allocation.Id,
                    ShelterId = shelter.Id,
                    ShelterName = shelter.Name,
                    HouseholdHeadName = allocation.HouseholdHeadName,
                    CaseReferenceId = allocation.CaseReferenceId,
                    NumberOfPeople = allocation.NumberOfPeople,
                    SpecialNeeds = allocation.SpecialNeeds,
                    AllocatedBy = allocation.AllocatedBy,
                    Status = allocation.Status,
                    AllocatedAt = allocation.AllocatedAt
                };
            }
            finally
            {
                _shelterLock.Release();
            }
        }

        public async Task<List<HouseholdAllocationDto>> GetHouseholdAllocationsAsync(int shelterId)
        {
            var allocations = await _context.HouseholdAllocations
                .Include(h => h.Shelter)
                .Where(h => h.ShelterId == shelterId)
                .OrderByDescending(h => h.AllocatedAt)
                .AsNoTracking()
                .ToListAsync();

            return allocations.Select(h => new HouseholdAllocationDto
            {
                Id = h.Id,
                ShelterId = h.ShelterId,
                ShelterName = h.Shelter?.Name ?? "Shelter",
                HouseholdHeadName = h.HouseholdHeadName,
                CaseReferenceId = h.CaseReferenceId,
                NumberOfPeople = h.NumberOfPeople,
                SpecialNeeds = h.SpecialNeeds,
                AllocatedBy = h.AllocatedBy,
                Status = h.Status,
                AllocatedAt = h.AllocatedAt
            }).ToList();
        }

        public async Task<ShelterSupplyRequestDto> CreateSupplyRequestAsync(CreateShelterSupplyRequestDto dto)
        {
            if (dto.Quantity <= 0)
            {
                throw new ArgumentException("Requested quantity must be at least 1.");
            }

            var shelter = await _context.Shelters.FindAsync(dto.ShelterId);
            if (shelter == null)
            {
                throw new KeyNotFoundException($"Shelter with ID {dto.ShelterId} not found.");
            }

            var request = new ShelterSupplyRequest
            {
                ShelterId = shelter.Id,
                ShelterName = shelter.Name,
                RequestedResource = dto.RequestedResource.Trim(),
                Quantity = dto.Quantity,
                Priority = string.IsNullOrWhiteSpace(dto.Priority) ? "High" : dto.Priority.Trim(),
                Reason = dto.Reason?.Trim() ?? string.Empty,
                Status = "Pending",
                CreatedAt = DateTime.UtcNow
            };

            _context.ShelterSupplyRequests.Add(request);
            await _context.SaveChangesAsync();

            return MapSupplyToDto(request);
        }

        public async Task<List<ShelterSupplyRequestDto>> GetSupplyRequestsAsync(int? shelterId)
        {
            var query = _context.ShelterSupplyRequests.AsNoTracking().AsQueryable();
            if (shelterId.HasValue)
            {
                query = query.Where(s => s.ShelterId == shelterId.Value);
            }

            var list = await query.OrderByDescending(s => s.CreatedAt).ToListAsync();
            return list.Select(MapSupplyToDto).ToList();
        }

        public async Task<ShelterSupplyRequestDto?> UpdateSupplyRequestStatusAsync(int id, UpdateShelterSupplyStatusDto dto)
        {
            var req = await _context.ShelterSupplyRequests.FindAsync(id);
            if (req == null) return null;

            req.Status = dto.Status.Trim();
            await _context.SaveChangesAsync();

            return MapSupplyToDto(req);
        }

        private static ShelterDto MapToDto(Shelter s) => new()
        {
            Id = s.Id,
            Name = s.Name,
            Location = s.Location,
            Latitude = s.Latitude,
            Longitude = s.Longitude,
            TotalCapacity = s.TotalCapacity,
            CurrentOccupancy = s.CurrentOccupancy,
            AvailableSpaces = s.AvailableSpaces,
            OccupancyPercentage = s.OccupancyPercentage,
            OperationalStatus = s.OperationalStatus,
            Facilities = s.Facilities,
            ContactPerson = s.ContactPerson,
            ContactPhone = s.ContactPhone,
            LastUpdated = s.LastUpdated
        };

        private static ShelterSupplyRequestDto MapSupplyToDto(ShelterSupplyRequest s) => new()
        {
            Id = s.Id,
            ShelterId = s.ShelterId,
            ShelterName = s.ShelterName,
            RequestedResource = s.RequestedResource,
            Quantity = s.Quantity,
            Priority = s.Priority,
            Reason = s.Reason,
            Status = s.Status,
            CreatedAt = s.CreatedAt
        };

        private static double CalculateHaversineDistanceKm(double lat1, double lon1, double lat2, double lon2)
        {
            const double R = 6371.0; // Earth radius in km
            var dLat = (lat2 - lat1) * Math.PI / 180.0;
            var dLon = (lon2 - lon1) * Math.PI / 180.0;
            var a = Math.Sin(dLat / 2) * Math.Sin(dLat / 2) +
                    Math.Cos(lat1 * Math.PI / 180.0) * Math.Cos(lat2 * Math.PI / 180.0) *
                    Math.Sin(dLon / 2) * Math.Sin(dLon / 2);
            var c = 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));
            return R * c;
        }
    }
}
