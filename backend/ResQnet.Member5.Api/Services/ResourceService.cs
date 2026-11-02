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
    public class ResourceService : IResourceService
    {
        private readonly ApplicationDbContext _context;
        private static readonly SemaphoreSlim _allocationLock = new(1, 1);

        public ResourceService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<List<ResourceDto>> GetAllResourcesAsync(string? category, string? status, string? search)
        {
            var query = _context.Resources.AsNoTracking().AsQueryable();

            if (!string.IsNullOrWhiteSpace(category) && category != "All")
            {
                query = query.Where(r => r.Category.ToLower() == category.ToLower());
            }

            if (!string.IsNullOrWhiteSpace(status) && status != "All")
            {
                query = query.Where(r => r.Status.ToLower() == status.ToLower());
            }

            if (!string.IsNullOrWhiteSpace(search))
            {
                var term = search.ToLower();
                query = query.Where(r => r.Name.ToLower().Contains(term) || r.Category.ToLower().Contains(term));
            }

            var resources = await query.OrderBy(r => r.Category).ThenBy(r => r.Name).ToListAsync();
            return resources.Select(MapToDto).ToList();
        }

        public async Task<ResourceDto?> GetResourceByIdAsync(int id)
        {
            var resource = await _context.Resources.AsNoTracking().FirstOrDefaultAsync(r => r.Id == id);
            return resource == null ? null : MapToDto(resource);
        }

        public async Task<ResourceDto> CreateResourceAsync(CreateResourceDto dto)
        {
            if (dto.AvailableQuantity < 0)
            {
                throw new ArgumentException("Available quantity cannot be negative.");
            }

            var resource = new Resource
            {
                Name = dto.Name.Trim(),
                Category = dto.Category.Trim(),
                AvailableQuantity = dto.AvailableQuantity,
                AllocatedQuantity = 0,
                MinimumStockLevel = dto.MinimumStockLevel,
                Unit = string.IsNullOrWhiteSpace(dto.Unit) ? "units" : dto.Unit.Trim(),
                UpdatedAt = DateTime.UtcNow
            };
            resource.RecalculateStatus();

            _context.Resources.Add(resource);
            await _context.SaveChangesAsync();

            return MapToDto(resource);
        }

        public async Task<ResourceDto?> UpdateResourceAsync(int id, UpdateResourceDto dto)
        {
            var resource = await _context.Resources.FindAsync(id);
            if (resource == null)
            {
                return null;
            }

            if (dto.AvailableQuantity < 0)
            {
                throw new ArgumentException("Available quantity cannot be negative.");
            }

            resource.Name = dto.Name.Trim();
            resource.Category = dto.Category.Trim();
            resource.AvailableQuantity = dto.AvailableQuantity;
            resource.MinimumStockLevel = dto.MinimumStockLevel;
            if (!string.IsNullOrWhiteSpace(dto.Unit))
            {
                resource.Unit = dto.Unit.Trim();
            }
            resource.RecalculateStatus();

            await _context.SaveChangesAsync();
            return MapToDto(resource);
        }

        public async Task<bool> DeleteResourceAsync(int id)
        {
            var resource = await _context.Resources.FindAsync(id);
            if (resource == null)
            {
                return false;
            }

            // Check if there are active allocations
            var hasAllocations = await _context.ResourceAllocations.AnyAsync(ra => ra.ResourceId == id);
            if (hasAllocations)
            {
                throw new InvalidOperationException("Cannot delete resource with active allocation records.");
            }

            _context.Resources.Remove(resource);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<ResourceSummaryDto> GetSummaryAsync()
        {
            var all = await _context.Resources.AsNoTracking().ToListAsync();

            var water = all.Where(r => r.Category.Equals("Water", StringComparison.OrdinalIgnoreCase)).ToList();
            var food = all.Where(r => r.Category.Equals("Food Packs", StringComparison.OrdinalIgnoreCase)).ToList();
            var medicine = all.Where(r => r.Category.Equals("Medicine Kits", StringComparison.OrdinalIgnoreCase) ||
                                          r.Category.Equals("First Aid Kits", StringComparison.OrdinalIgnoreCase)).ToList();

            var totalWaterAvail = water.Sum(r => r.AvailableQuantity);
            var totalWaterAlloc = water.Sum(r => r.AllocatedQuantity);

            var totalFoodAvail = food.Sum(r => r.AvailableQuantity);
            var totalFoodAlloc = food.Sum(r => r.AllocatedQuantity);

            var totalMedAvail = medicine.Sum(r => r.AvailableQuantity);
            var totalMedAlloc = medicine.Sum(r => r.AllocatedQuantity);

            return new ResourceSummaryDto
            {
                TotalWaterAvailable = totalWaterAvail,
                TotalWaterAllocated = totalWaterAlloc,
                WaterStatus = water.Any(w => w.Status == "Critical") ? "Critical" : (water.Any(w => w.Status == "Warning") ? "Warning" : "Normal"),

                TotalFoodPacksAvailable = totalFoodAvail,
                TotalFoodPacksAllocated = totalFoodAlloc,
                FoodPacksStatus = food.Any(f => f.Status == "Critical") ? "Critical" : (food.Any(f => f.Status == "Warning") ? "Warning" : "Normal"),

                TotalMedicineKitsAvailable = totalMedAvail,
                TotalMedicineKitsAllocated = totalMedAlloc,
                MedicineKitsStatus = medicine.Any(m => m.Status == "Critical") ? "Critical" : (medicine.Any(m => m.Status == "Warning") ? "Warning" : "Normal"),

                TotalItemsCount = all.Count,
                CriticalStockCount = all.Count(r => r.Status == "Critical"),
                WarningStockCount = all.Count(r => r.Status == "Warning"),
                NormalStockCount = all.Count(r => r.Status == "Normal")
            };
        }

        public async Task<List<ShortageAlertDto>> GetShortagesAsync()
        {
            var alerts = new List<ShortageAlertDto>();
            var resources = await _context.Resources.AsNoTracking().ToListAsync();

            foreach (var res in resources.Where(r => r.Status == "Critical" || r.Status == "Warning" || r.AvailableQuantity < r.MinimumStockLevel))
            {
                var deficit = Math.Max(0, res.MinimumStockLevel - res.AvailableQuantity);
                alerts.Add(new ShortageAlertDto
                {
                    ResourceId = res.Id,
                    ResourceName = res.Name,
                    RequiredQuantity = res.MinimumStockLevel,
                    AvailableQuantity = res.AvailableQuantity,
                    ShortageAmount = deficit > 0 ? deficit : (res.AvailableQuantity == 0 ? res.MinimumStockLevel : 100),
                    AffectedShelterOrRequest = res.Name.Contains("Water")
                        ? "Kelaniya Relief Center & Biyagama Hub"
                        : (res.Name.Contains("Medicine") ? "Case RQ-2041 (Kelaniya)" : "Kaduwela Town Hall"),
                    Priority = res.Status == "Critical" ? "Critical" : "High",
                    SuggestedResolution = res.AvailableQuantity <= 0
                        ? $"Initiate immediate partner dispatch from Sri Lanka Red Cross or WFP buffer stock for {res.Name}."
                        : $"Stock low ({res.AvailableQuantity} {res.Unit} left). Limit non-emergency allocations and request NGO replenishment."
                });
            }

            return alerts;
        }

        public async Task<ResourceAllocationDto> AllocateResourceAsync(CreateAllocationDto dto)
        {
            if (dto.Quantity <= 0)
            {
                throw new ArgumentException("Quantity to allocate must be strictly greater than zero.");
            }

            await _allocationLock.WaitAsync();
            try
            {
                var resource = await _context.Resources.FindAsync(dto.ResourceId);
                if (resource == null)
                {
                    throw new KeyNotFoundException($"Resource with ID {dto.ResourceId} not found.");
                }

                // Strict over-allocation prevention
                if (dto.Quantity > resource.AvailableQuantity)
                {
                    throw new InvalidOperationException(
                        $"Cannot allocate {dto.Quantity} {resource.Unit}. Only {resource.AvailableQuantity} {resource.Unit} are currently available in inventory."
                    );
                }

                // Update inventory quantities atomically
                resource.AvailableQuantity -= dto.Quantity;
                resource.AllocatedQuantity += dto.Quantity;
                resource.RecalculateStatus();

                string? destinationName = dto.DestinationShelterName;
                if (dto.DestinationType == "Shelter" && dto.DestinationShelterId.HasValue && string.IsNullOrEmpty(destinationName))
                {
                    var shelter = await _context.Shelters.FindAsync(dto.DestinationShelterId.Value);
                    if (shelter != null)
                    {
                        destinationName = shelter.Name;
                    }
                }

                var allocation = new ResourceAllocation
                {
                    ResourceId = resource.Id,
                    DestinationType = dto.DestinationType,
                    DestinationShelterId = dto.DestinationShelterId,
                    DestinationShelterName = destinationName,
                    EmergencyRequestId = dto.EmergencyRequestId,
                    Quantity = dto.Quantity,
                    AllocatedBy = string.IsNullOrWhiteSpace(dto.AllocatedBy) ? "Resource Manager" : dto.AllocatedBy.Trim(),
                    Notes = dto.Notes?.Trim() ?? string.Empty,
                    Status = "Allocated",
                    AllocatedAt = DateTime.UtcNow
                };

                _context.ResourceAllocations.Add(allocation);
                await _context.SaveChangesAsync();

                return new ResourceAllocationDto
                {
                    Id = allocation.Id,
                    ResourceId = resource.Id,
                    ResourceName = resource.Name,
                    DestinationType = allocation.DestinationType,
                    DestinationShelterId = allocation.DestinationShelterId,
                    DestinationShelterName = allocation.DestinationShelterName,
                    EmergencyRequestId = allocation.EmergencyRequestId,
                    Quantity = allocation.Quantity,
                    AllocatedBy = allocation.AllocatedBy,
                    Notes = allocation.Notes,
                    Status = allocation.Status,
                    AllocatedAt = allocation.AllocatedAt
                };
            }
            finally
            {
                _allocationLock.Release();
            }
        }

        public async Task<List<ResourceAllocationDto>> GetAllocationsAsync()
        {
            var allocations = await _context.ResourceAllocations
                .Include(ra => ra.Resource)
                .OrderByDescending(ra => ra.AllocatedAt)
                .AsNoTracking()
                .ToListAsync();

            return allocations.Select(a => new ResourceAllocationDto
            {
                Id = a.Id,
                ResourceId = a.ResourceId,
                ResourceName = a.Resource?.Name ?? "Unknown Resource",
                DestinationType = a.DestinationType,
                DestinationShelterId = a.DestinationShelterId,
                DestinationShelterName = a.DestinationShelterName,
                EmergencyRequestId = a.EmergencyRequestId,
                Quantity = a.Quantity,
                AllocatedBy = a.AllocatedBy,
                Notes = a.Notes,
                Status = a.Status,
                AllocatedAt = a.AllocatedAt
            }).ToList();
        }

        public async Task<PartnerSupportRequestDto> CreatePartnerSupportRequestAsync(CreatePartnerSupportRequestDto dto)
        {
            if (dto.QuantityRequired <= 0)
            {
                throw new ArgumentException("Quantity required must be strictly greater than zero.");
            }

            var request = new PartnerSupportRequest
            {
                RequiredResource = dto.RequiredResource.Trim(),
                QuantityRequired = dto.QuantityRequired,
                RequestingLocation = dto.RequestingLocation.Trim(),
                Priority = string.IsNullOrWhiteSpace(dto.Priority) ? "High" : dto.Priority.Trim(),
                Reason = dto.Reason.Trim(),
                Status = "Pending",
                PartnerOrganization = dto.PartnerOrganization?.Trim() ?? "Sri Lanka Red Cross",
                CreatedAt = DateTime.UtcNow
            };

            _context.PartnerSupportRequests.Add(request);
            await _context.SaveChangesAsync();

            return MapSupportToDto(request);
        }

        public async Task<List<PartnerSupportRequestDto>> GetPartnerSupportRequestsAsync()
        {
            var list = await _context.PartnerSupportRequests
                .OrderByDescending(p => p.CreatedAt)
                .AsNoTracking()
                .ToListAsync();

            return list.Select(MapSupportToDto).ToList();
        }

        public async Task<PartnerSupportRequestDto?> UpdatePartnerSupportRequestStatusAsync(int id, UpdateSupportRequestStatusDto dto)
        {
            var req = await _context.PartnerSupportRequests.FindAsync(id);
            if (req == null) return null;

            req.Status = dto.Status.Trim();
            if (!string.IsNullOrWhiteSpace(dto.PartnerOrganization))
            {
                req.PartnerOrganization = dto.PartnerOrganization.Trim();
            }

            await _context.SaveChangesAsync();
            return MapSupportToDto(req);
        }

        private static ResourceDto MapToDto(Resource r) => new()
        {
            Id = r.Id,
            Name = r.Name,
            Category = r.Category,
            AvailableQuantity = r.AvailableQuantity,
            AllocatedQuantity = r.AllocatedQuantity,
            MinimumStockLevel = r.MinimumStockLevel,
            Unit = r.Unit,
            Status = r.Status,
            UpdatedAt = r.UpdatedAt
        };

        private static PartnerSupportRequestDto MapSupportToDto(PartnerSupportRequest p) => new()
        {
            Id = p.Id,
            RequiredResource = p.RequiredResource,
            QuantityRequired = p.QuantityRequired,
            RequestingLocation = p.RequestingLocation,
            Priority = p.Priority,
            Reason = p.Reason,
            Status = p.Status,
            PartnerOrganization = p.PartnerOrganization,
            CreatedAt = p.CreatedAt
        };
    }
}
