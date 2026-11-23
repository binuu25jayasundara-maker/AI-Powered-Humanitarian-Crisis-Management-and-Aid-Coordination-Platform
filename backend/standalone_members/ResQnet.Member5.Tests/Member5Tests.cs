using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using ResQnet.Member5.Api.Data;
using ResQnet.Member5.Api.DTOs;
using ResQnet.Member5.Api.Models;
using ResQnet.Member5.Api.Services;
using Xunit;

namespace ResQnet.Member5.Tests
{
    public class ResourceServiceTests : IAsyncLifetime
    {
        private ApplicationDbContext _context = null!;
        private ResourceService _service = null!;

        public async Task InitializeAsync()
        {
            var options = new DbContextOptionsBuilder<ApplicationDbContext>()
                .UseInMemoryDatabase(Guid.NewGuid().ToString())
                .Options;
            _context = new ApplicationDbContext(options);
            _service = new ResourceService(_context);
            await SeedTestData();
        }

        public Task DisposeAsync()
        {
            _context.Dispose();
            return Task.CompletedTask;
        }

        private async Task SeedTestData()
        {
            _context.Resources.AddRange(new[]
            {
                new Resource { Name = "Water", Category = "Water", AvailableQuantity = 500, AllocatedQuantity = 100, MinimumStockLevel = 200, Unit = "L", Status = "Normal", UpdatedAt = DateTime.UtcNow },
                new Resource { Name = "Food Packs", Category = "Food Packs", AvailableQuantity = 50, AllocatedQuantity = 20, MinimumStockLevel = 100, Unit = "packs", Status = "Warning", UpdatedAt = DateTime.UtcNow },
                new Resource { Name = "Medicine Kits", Category = "Medicine Kits", AvailableQuantity = 5, AllocatedQuantity = 10, MinimumStockLevel = 50, Unit = "kits", Status = "Critical", UpdatedAt = DateTime.UtcNow }
            });
            await _context.SaveChangesAsync();
        }

        // ─────────────────────────────────────────────────────────────────────
        // RESOURCE LISTING TESTS
        // ─────────────────────────────────────────────────────────────────────

        [Fact]
        public async Task GetAllResources_NoFilter_ReturnsAll()
        {
            var result = await _service.GetAllResourcesAsync(null, null, null);
            Assert.Equal(3, result.Count);
        }

        [Fact]
        public async Task GetAllResources_FilterByCategory_ReturnsMatchingOnly()
        {
            var result = await _service.GetAllResourcesAsync("Water", null, null);
            Assert.Single(result);
            Assert.Equal("Water", result[0].Category);
        }

        [Fact]
        public async Task GetAllResources_FilterByStatus_ReturnsMatchingOnly()
        {
            var result = await _service.GetAllResourcesAsync(null, "Critical", null);
            Assert.Single(result);
            Assert.Equal("Critical", result[0].Status);
        }

        [Fact]
        public async Task GetAllResources_SearchByName_ReturnsMatchingOnly()
        {
            var result = await _service.GetAllResourcesAsync(null, null, "food");
            Assert.Single(result);
            Assert.Contains("Food", result[0].Name);
        }

        // ─────────────────────────────────────────────────────────────────────
        // RESOURCE CREATION TESTS
        // ─────────────────────────────────────────────────────────────────────

        [Fact]
        public async Task CreateResource_ValidInput_CreatesSuccessfully()
        {
            var dto = new CreateResourceDto { Name = "Blankets", Category = "Essential Supplies", AvailableQuantity = 200, MinimumStockLevel = 50, Unit = "units" };
            var result = await _service.CreateResourceAsync(dto);
            Assert.Equal("Blankets", result.Name);
            Assert.Equal(200, result.AvailableQuantity);
            Assert.Equal("Normal", result.Status);
        }

        [Fact]
        public async Task CreateResource_NegativeQuantity_ThrowsArgumentException()
        {
            var dto = new CreateResourceDto { Name = "Bad Resource", Category = "Water", AvailableQuantity = -10, MinimumStockLevel = 0, Unit = "L" };
            await Assert.ThrowsAsync<ArgumentException>(() => _service.CreateResourceAsync(dto));
        }

        // ─────────────────────────────────────────────────────────────────────
        // RESOURCE SUMMARY TESTS
        // ─────────────────────────────────────────────────────────────────────

        [Fact]
        public async Task GetSummary_ReturnsCorrectTotals()
        {
            var summary = await _service.GetSummaryAsync();
            Assert.Equal(500, summary.TotalWaterAvailable);
            Assert.Equal(50, summary.TotalFoodPacksAvailable);
            Assert.Equal(1, summary.CriticalStockCount);
            Assert.Equal(1, summary.WarningStockCount);
            Assert.Equal(1, summary.NormalStockCount);
        }

        // ─────────────────────────────────────────────────────────────────────
        // ALLOCATION TESTS - CORE BUSINESS RULES
        // ─────────────────────────────────────────────────────────────────────

        [Fact]
        public async Task AllocateResource_ValidQuantity_DeductsFromAvailable()
        {
            var resource = await _context.Resources.FirstAsync(r => r.Name == "Water");
            var dto = new CreateAllocationDto
            {
                ResourceId = resource.Id,
                DestinationType = "Shelter",
                DestinationShelterName = "Test Shelter",
                Quantity = 100,
                AllocatedBy = "Test"
            };

            var result = await _service.AllocateResourceAsync(dto);

            var updatedResource = await _context.Resources.FindAsync(resource.Id);
            Assert.NotNull(updatedResource);
            Assert.Equal(400, updatedResource!.AvailableQuantity); // 500 - 100
            Assert.Equal(200, updatedResource.AllocatedQuantity);   // 100 + 100
            Assert.Equal(100, result.Quantity);
        }

        [Fact]
        public async Task AllocateResource_QuantityExceedsAvailable_ThrowsInvalidOperationException()
        {
            var resource = await _context.Resources.FirstAsync(r => r.Name == "Water");
            var dto = new CreateAllocationDto
            {
                ResourceId = resource.Id,
                DestinationType = "Shelter",
                Quantity = 10000,  // Way more than 500 available
                AllocatedBy = "Test"
            };

            await Assert.ThrowsAsync<InvalidOperationException>(() => _service.AllocateResourceAsync(dto));
        }

        [Fact]
        public async Task AllocateResource_ZeroQuantity_ThrowsArgumentException()
        {
            var resource = await _context.Resources.FirstAsync(r => r.Name == "Water");
            var dto = new CreateAllocationDto
            {
                ResourceId = resource.Id,
                DestinationType = "Shelter",
                Quantity = 0,
                AllocatedBy = "Test"
            };

            await Assert.ThrowsAsync<ArgumentException>(() => _service.AllocateResourceAsync(dto));
        }

        [Fact]
        public async Task AllocateResource_NegativeQuantity_ThrowsArgumentException()
        {
            var resource = await _context.Resources.FirstAsync(r => r.Name == "Water");
            var dto = new CreateAllocationDto
            {
                ResourceId = resource.Id,
                DestinationType = "Shelter",
                Quantity = -5,
                AllocatedBy = "Test"
            };

            await Assert.ThrowsAsync<ArgumentException>(() => _service.AllocateResourceAsync(dto));
        }

        [Fact]
        public async Task AllocateResource_NonExistentResource_ThrowsKeyNotFoundException()
        {
            var dto = new CreateAllocationDto
            {
                ResourceId = 99999,
                DestinationType = "Shelter",
                Quantity = 10,
                AllocatedBy = "Test"
            };

            await Assert.ThrowsAsync<KeyNotFoundException>(() => _service.AllocateResourceAsync(dto));
        }

        [Fact]
        public async Task AllocateResource_ExactlyAvailableQuantity_Succeeds()
        {
            var resource = await _context.Resources.FirstAsync(r => r.Name == "Water");
            var availableQuantity = resource.AvailableQuantity;

            var dto = new CreateAllocationDto
            {
                ResourceId = resource.Id,
                DestinationType = "EmergencyRequest",
                EmergencyRequestId = "RQ-TEST-001",
                Quantity = availableQuantity,  // Exactly all available
                AllocatedBy = "Test"
            };

            var result = await _service.AllocateResourceAsync(dto);

            var updatedResource = await _context.Resources.FindAsync(resource.Id);
            Assert.Equal(0, updatedResource!.AvailableQuantity);
            Assert.Equal("Critical", updatedResource.Status);
        }

        // ─────────────────────────────────────────────────────────────────────
        // SHORTAGE DETECTION TESTS
        // ─────────────────────────────────────────────────────────────────────

        [Fact]
        public async Task GetShortages_ReturnsResourcesBelowMinimumStock()
        {
            var shortages = await _service.GetShortagesAsync();
            // Food Packs (50 avail, 100 min) and Medicine Kits (5 avail, 50 min) should be in shortages
            Assert.True(shortages.Count >= 2);
            Assert.Contains(shortages, s => s.ResourceName == "Food Packs");
            Assert.Contains(shortages, s => s.ResourceName == "Medicine Kits");
        }

        [Fact]
        public async Task GetShortages_NormalStockResource_NotInShortages()
        {
            var shortages = await _service.GetShortagesAsync();
            // Water (500 avail, 200 min) should NOT appear
            Assert.DoesNotContain(shortages, s => s.ResourceName == "Water");
        }

        // ─────────────────────────────────────────────────────────────────────
        // PARTNER SUPPORT REQUEST TESTS
        // ─────────────────────────────────────────────────────────────────────

        [Fact]
        public async Task CreatePartnerSupportRequest_ValidInput_CreatesWithPendingStatus()
        {
            var dto = new CreatePartnerSupportRequestDto
            {
                RequiredResource = "Medicine Kits",
                QuantityRequired = 100,
                RequestingLocation = "Kelaniya Hub",
                Priority = "Critical",
                Reason = "Local stock exhausted",
                PartnerOrganization = "Red Cross"
            };

            var result = await _service.CreatePartnerSupportRequestAsync(dto);

            Assert.Equal("Pending", result.Status);
            Assert.Equal("Medicine Kits", result.RequiredResource);
            Assert.Equal(100, result.QuantityRequired);
        }

        [Fact]
        public async Task CreatePartnerSupportRequest_ZeroQuantity_ThrowsArgumentException()
        {
            var dto = new CreatePartnerSupportRequestDto
            {
                RequiredResource = "Water",
                QuantityRequired = 0,
                RequestingLocation = "Test",
                Priority = "High",
                Reason = "Test reason"
            };

            await Assert.ThrowsAsync<ArgumentException>(() => _service.CreatePartnerSupportRequestAsync(dto));
        }

        [Fact]
        public async Task UpdatePartnerSupportRequestStatus_ValidUpdate_ChangesStatus()
        {
            // Create a request first
            var dto = new CreatePartnerSupportRequestDto
            {
                RequiredResource = "Water",
                QuantityRequired = 500,
                RequestingLocation = "Biyagama",
                Priority = "High",
                Reason = "Shortage",
                PartnerOrganization = "UNICEF"
            };
            var created = await _service.CreatePartnerSupportRequestAsync(dto);

            var updateDto = new UpdateSupportRequestStatusDto { Status = "Approved", PartnerOrganization = "UNICEF" };
            var updated = await _service.UpdatePartnerSupportRequestStatusAsync(created.Id, updateDto);

            Assert.NotNull(updated);
            Assert.Equal("Approved", updated!.Status);
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // SHELTER SERVICE TESTS
    // ─────────────────────────────────────────────────────────────────────────

    public class ShelterServiceTests : IAsyncLifetime
    {
        private ApplicationDbContext _context = null!;
        private ShelterService _service = null!;

        public async Task InitializeAsync()
        {
            var options = new DbContextOptionsBuilder<ApplicationDbContext>()
                .UseInMemoryDatabase(Guid.NewGuid().ToString())
                .Options;
            _context = new ApplicationDbContext(options);
            _service = new ShelterService(_context);
            await SeedTestData();
        }

        public Task DisposeAsync()
        {
            _context.Dispose();
            return Task.CompletedTask;
        }

        private async Task SeedTestData()
        {
            _context.Shelters.AddRange(new[]
            {
                new Shelter { Name = "Shelter Alpha", Location = "Kelaniya", Latitude = 6.95, Longitude = 79.92, TotalCapacity = 100, CurrentOccupancy = 60, OperationalStatus = "Open", FacilitiesRaw = "Meals,Drinking Water,Accessible", LastUpdated = DateTime.UtcNow },
                new Shelter { Name = "Shelter Beta", Location = "Biyagama", Latitude = 6.94, Longitude = 79.99, TotalCapacity = 50, CurrentOccupancy = 50, OperationalStatus = "Full", FacilitiesRaw = "Meals,Sanitation", LastUpdated = DateTime.UtcNow },
                new Shelter { Name = "Shelter Gamma", Location = "Kaduwela", Latitude = 6.93, Longitude = 79.98, TotalCapacity = 80, CurrentOccupancy = 70, OperationalStatus = "Almost Full", FacilitiesRaw = "Meals,Medical,Drinking Water", LastUpdated = DateTime.UtcNow }
            });
            await _context.SaveChangesAsync();
        }

        // ─────────────────────────────────────────────────────────────────────
        // SHELTER LISTING TESTS
        // ─────────────────────────────────────────────────────────────────────

        [Fact]
        public async Task GetAllShelters_NoFilter_ReturnsAll()
        {
            var result = await _service.GetAllSheltersAsync(null, null, null);
            Assert.Equal(3, result.Count);
        }

        [Fact]
        public async Task GetAllShelters_FilterByOpenStatus_ReturnsOnlyOpen()
        {
            var result = await _service.GetAllSheltersAsync(null, "Open", null);
            Assert.Single(result);
            Assert.Equal("Open", result[0].OperationalStatus);
        }

        [Fact]
        public async Task GetAllShelters_FilterByFacility_ReturnsMatchingOnly()
        {
            var result = await _service.GetAllSheltersAsync(null, null, "Medical");
            Assert.Single(result);
            Assert.Contains("Medical", result[0].Facilities);
        }

        [Fact]
        public async Task GetAllShelters_SearchByName_ReturnsMatchingOnly()
        {
            var result = await _service.GetAllSheltersAsync("Alpha", null, null);
            Assert.Single(result);
            Assert.Contains("Alpha", result[0].Name);
        }

        // ─────────────────────────────────────────────────────────────────────
        // CAPACITY VALIDATION TESTS - CRITICAL BUSINESS RULES
        // ─────────────────────────────────────────────────────────────────────

        [Fact]
        public async Task AllocateHousehold_ValidAllocation_IncreasesOccupancy()
        {
            var shelter = await _context.Shelters.FirstAsync(s => s.Name == "Shelter Alpha");
            var initialOccupancy = shelter.CurrentOccupancy;

            var dto = new CreateHouseholdAllocationDto
            {
                HouseholdHeadName = "Test Family",
                CaseReferenceId = "TEST-001",
                NumberOfPeople = 5
            };

            var result = await _service.AllocateHouseholdAsync(shelter.Id, dto);

            var updatedShelter = await _context.Shelters.FindAsync(shelter.Id);
            Assert.Equal(initialOccupancy + 5, updatedShelter!.CurrentOccupancy);
            Assert.Equal("Confirmed", result.Status);
        }

        [Fact]
        public async Task AllocateHousehold_ExceedsCapacity_ThrowsInvalidOperationException()
        {
            var shelter = await _context.Shelters.FirstAsync(s => s.Name == "Shelter Alpha");
            // Shelter Alpha: 100 capacity, 60 occupied → 40 spaces left
            var dto = new CreateHouseholdAllocationDto
            {
                HouseholdHeadName = "Too Many People",
                NumberOfPeople = 50  // Exceeds 40 available spaces
            };

            var ex = await Assert.ThrowsAsync<InvalidOperationException>(() =>
                _service.AllocateHouseholdAsync(shelter.Id, dto));

            Assert.Contains("Insufficient shelter capacity", ex.Message);
        }

        [Fact]
        public async Task AllocateHousehold_ToFullShelter_ThrowsInvalidOperationException()
        {
            var shelter = await _context.Shelters.FirstAsync(s => s.Name == "Shelter Beta");
            // Shelter Beta is FULL (50/50)
            var dto = new CreateHouseholdAllocationDto
            {
                HouseholdHeadName = "Any Family",
                NumberOfPeople = 1
            };

            await Assert.ThrowsAsync<InvalidOperationException>(() =>
                _service.AllocateHouseholdAsync(shelter.Id, dto));
        }

        [Fact]
        public async Task AllocateHousehold_ToClosedShelter_ThrowsInvalidOperationException()
        {
            var shelter = await _context.Shelters.FirstAsync(s => s.Name == "Shelter Alpha");
            shelter.OperationalStatus = "Closed";
            await _context.SaveChangesAsync();

            var dto = new CreateHouseholdAllocationDto
            {
                HouseholdHeadName = "Test Family",
                NumberOfPeople = 2
            };

            await Assert.ThrowsAsync<InvalidOperationException>(() =>
                _service.AllocateHouseholdAsync(shelter.Id, dto));
        }

        [Fact]
        public async Task AllocateHousehold_ZeroPeople_ThrowsArgumentException()
        {
            var shelter = await _context.Shelters.FirstAsync(s => s.Name == "Shelter Alpha");
            var dto = new CreateHouseholdAllocationDto
            {
                HouseholdHeadName = "Test Family",
                NumberOfPeople = 0
            };

            await Assert.ThrowsAsync<ArgumentException>(() =>
                _service.AllocateHouseholdAsync(shelter.Id, dto));
        }

        [Fact]
        public async Task AllocateHousehold_DuplicateCaseReference_ThrowsInvalidOperationException()
        {
            var shelter = await _context.Shelters.FirstAsync(s => s.Name == "Shelter Alpha");

            // First allocation
            var dto1 = new CreateHouseholdAllocationDto
            {
                HouseholdHeadName = "First Family",
                CaseReferenceId = "RQ-DUPLICATE",
                NumberOfPeople = 2
            };
            await _service.AllocateHouseholdAsync(shelter.Id, dto1);

            // Duplicate allocation for same case reference
            var dto2 = new CreateHouseholdAllocationDto
            {
                HouseholdHeadName = "Second Family",
                CaseReferenceId = "RQ-DUPLICATE",
                NumberOfPeople = 3
            };

            await Assert.ThrowsAsync<InvalidOperationException>(() =>
                _service.AllocateHouseholdAsync(shelter.Id, dto2));
        }

        [Fact]
        public async Task AllocateHousehold_ExactlyAvailableSpaces_Succeeds()
        {
            var shelter = await _context.Shelters.FirstAsync(s => s.Name == "Shelter Alpha");
            var availableSpaces = shelter.TotalCapacity - shelter.CurrentOccupancy; // 40 spaces

            var dto = new CreateHouseholdAllocationDto
            {
                HouseholdHeadName = "Exactly Right Family",
                CaseReferenceId = "RQ-EXACT",
                NumberOfPeople = availableSpaces
            };

            var result = await _service.AllocateHouseholdAsync(shelter.Id, dto);

            var updatedShelter = await _context.Shelters.FindAsync(shelter.Id);
            Assert.Equal(shelter.TotalCapacity, updatedShelter!.CurrentOccupancy);
            Assert.True(updatedShelter.OperationalStatus == "Full" || updatedShelter.OperationalStatus == "Almost Full");
        }

        // ─────────────────────────────────────────────────────────────────────
        // CAPACITY INFO TESTS
        // ─────────────────────────────────────────────────────────────────────

        [Fact]
        public async Task GetCapacity_ValidId_ReturnsCorrectCapacityInfo()
        {
            var shelter = await _context.Shelters.FirstAsync(s => s.Name == "Shelter Alpha");
            var result = await _service.GetCapacityAsync(shelter.Id);

            Assert.NotNull(result);
            Assert.Equal(100, result!.TotalCapacity);
            Assert.Equal(60, result.CurrentOccupancy);
            Assert.Equal(40, result.AvailableSpaces);
            Assert.Equal(60.0, result.OccupancyPercentage);
        }

        [Fact]
        public async Task GetCapacity_InvalidId_ReturnsNull()
        {
            var result = await _service.GetCapacityAsync(99999);
            Assert.Null(result);
        }

        // ─────────────────────────────────────────────────────────────────────
        // SHELTER SUPPLY REQUEST TESTS
        // ─────────────────────────────────────────────────────────────────────

        [Fact]
        public async Task CreateSupplyRequest_ValidInput_CreatesWithPendingStatus()
        {
            var shelter = await _context.Shelters.FirstAsync(s => s.Name == "Shelter Alpha");
            var dto = new CreateShelterSupplyRequestDto
            {
                ShelterId = shelter.Id,
                RequestedResource = "Water Purification Tablets",
                Quantity = 100,
                Priority = "High",
                Reason = "Well contaminated"
            };

            var result = await _service.CreateSupplyRequestAsync(dto);

            Assert.Equal("Pending", result.Status);
            Assert.Equal("Water Purification Tablets", result.RequestedResource);
            Assert.Equal(shelter.Name, result.ShelterName);
        }

        [Fact]
        public async Task CreateSupplyRequest_ZeroQuantity_ThrowsArgumentException()
        {
            var shelter = await _context.Shelters.FirstAsync(s => s.Name == "Shelter Alpha");
            var dto = new CreateShelterSupplyRequestDto
            {
                ShelterId = shelter.Id,
                RequestedResource = "Blankets",
                Quantity = 0,
                Priority = "Normal",
                Reason = "Test"
            };

            await Assert.ThrowsAsync<ArgumentException>(() => _service.CreateSupplyRequestAsync(dto));
        }

        [Fact]
        public async Task CreateSupplyRequest_NonExistentShelter_ThrowsKeyNotFoundException()
        {
            var dto = new CreateShelterSupplyRequestDto
            {
                ShelterId = 99999,
                RequestedResource = "Blankets",
                Quantity = 10,
                Priority = "Normal",
                Reason = "Test"
            };

            await Assert.ThrowsAsync<KeyNotFoundException>(() => _service.CreateSupplyRequestAsync(dto));
        }

        // ─────────────────────────────────────────────────────────────────────
        // NEARBY SHELTER TESTS
        // ─────────────────────────────────────────────────────────────────────

        [Fact]
        public async Task GetNearbyShelters_ReturnsOrderedByDistance()
        {
            var result = await _service.GetNearbySheltersAsync(6.95, 79.92, null);
            Assert.NotEmpty(result);
            // Verify they are sorted by distance
            for (int i = 1; i < result.Count; i++)
            {
                Assert.True(result[i].DistanceKm >= result[i - 1].DistanceKm);
            }
        }

        [Fact]
        public async Task GetNearbyShelters_FilterByOpen_ExcludesFullShelters()
        {
            var result = await _service.GetNearbySheltersAsync(6.95, 79.92, "Open");
            Assert.All(result, s => Assert.Equal("Open", s.OperationalStatus));
        }
    }
}
