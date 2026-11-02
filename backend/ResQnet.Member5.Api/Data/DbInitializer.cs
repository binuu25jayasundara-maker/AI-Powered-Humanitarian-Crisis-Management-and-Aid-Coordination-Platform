using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using ResQnet.Member5.Api.Models;

namespace ResQnet.Member5.Api.Data
{
    public static class DbInitializer
    {
        public static async Task SeedAsync(ApplicationDbContext context)
        {
            if (await context.Resources.AnyAsync())
            {
                return; // DB has been seeded
            }

            // 1. Seed Resources
            var resources = new List<Resource>
            {
                new Resource
                {
                    Name = "Water (L)",
                    Category = "Water",
                    AvailableQuantity = 12400,
                    AllocatedQuantity = 3200,
                    MinimumStockLevel = 2500,
                    Unit = "L",
                    Status = "Normal",
                    UpdatedAt = DateTime.UtcNow
                },
                new Resource
                {
                    Name = "Food packs",
                    Category = "Food Packs",
                    AvailableQuantity = 3200,
                    AllocatedQuantity = 1100,
                    MinimumStockLevel = 1500,
                    Unit = "packs",
                    Status = "Warning",
                    UpdatedAt = DateTime.UtcNow
                },
                new Resource
                {
                    Name = "Medicine kits",
                    Category = "Medicine Kits",
                    AvailableQuantity = 310,
                    AllocatedQuantity = 98,
                    MinimumStockLevel = 250,
                    Unit = "kits",
                    Status = "Critical",
                    UpdatedAt = DateTime.UtcNow
                },
                new Resource
                {
                    Name = "First Aid Kits",
                    Category = "First Aid Kits",
                    AvailableQuantity = 180,
                    AllocatedQuantity = 120,
                    MinimumStockLevel = 150,
                    Unit = "kits",
                    Status = "Warning",
                    UpdatedAt = DateTime.UtcNow
                },
                new Resource
                {
                    Name = "Emergency Blankets & Cots",
                    Category = "Essential Supplies",
                    AvailableQuantity = 850,
                    AllocatedQuantity = 400,
                    MinimumStockLevel = 300,
                    Unit = "units",
                    Status = "Normal",
                    UpdatedAt = DateTime.UtcNow
                },
                new Resource
                {
                    Name = "Hygiene & Sanitation Packs",
                    Category = "Essential Supplies",
                    AvailableQuantity = 640,
                    AllocatedQuantity = 210,
                    MinimumStockLevel = 200,
                    Unit = "packs",
                    Status = "Normal",
                    UpdatedAt = DateTime.UtcNow
                },
                new Resource
                {
                    Name = "Water Purification Tablets",
                    Category = "Water",
                    AvailableQuantity = 120,
                    AllocatedQuantity = 380,
                    MinimumStockLevel = 500,
                    Unit = "strips",
                    Status = "Critical",
                    UpdatedAt = DateTime.UtcNow
                }
            };

            await context.Resources.AddRangeAsync(resources);
            await context.SaveChangesAsync();

            // 2. Seed Shelters
            var shelters = new List<Shelter>
            {
                new Shelter
                {
                    Name = "Kelaniya Maha Vidyalaya",
                    Location = "Station Road, Kelaniya, Western Province",
                    Latitude = 6.9583,
                    Longitude = 79.9194,
                    TotalCapacity = 100,
                    CurrentOccupancy = 82,
                    OperationalStatus = "Open",
                    FacilitiesRaw = "Accessible,Meals,Medical,Drinking Water,Sanitation",
                    ContactPerson = "Mr. Sarath Bandara",
                    ContactPhone = "+94 11 291 1234",
                    LastUpdated = DateTime.UtcNow
                },
                new Shelter
                {
                    Name = "Biyagama Hall",
                    Location = "Main Street, Biyagama, Gampaha District",
                    Latitude = 6.9450,
                    Longitude = 79.9920,
                    TotalCapacity = 120,
                    CurrentOccupancy = 77,
                    OperationalStatus = "Open",
                    FacilitiesRaw = "Accessible,Meals,Medical,Sanitation",
                    ContactPerson = "Ms. Dilani Silva",
                    ContactPhone = "+94 11 248 5567",
                    LastUpdated = DateTime.UtcNow
                },
                new Shelter
                {
                    Name = "Kaduwela Town Hall",
                    Location = "Kaduwela Junction, Colombo Outer Ring",
                    Latitude = 6.9320,
                    Longitude = 79.9830,
                    TotalCapacity = 80,
                    CurrentOccupancy = 78,
                    OperationalStatus = "Almost Full",
                    FacilitiesRaw = "Accessible,Meals,Medical",
                    ContactPerson = "Mr. Rohana Gamage",
                    ContactPhone = "+94 11 257 8890",
                    LastUpdated = DateTime.UtcNow
                },
                new Shelter
                {
                    Name = "Wattala Grounds Center",
                    Location = "Negombo Road, Wattala",
                    Latitude = 6.9890,
                    Longitude = 79.8910,
                    TotalCapacity = 150,
                    CurrentOccupancy = 46,
                    OperationalStatus = "Open",
                    FacilitiesRaw = "Accessible,Meals,Drinking Water,Sanitation",
                    ContactPerson = "Ms. Anula Fernando",
                    ContactPhone = "+94 11 293 4455",
                    LastUpdated = DateTime.UtcNow
                },
                new Shelter
                {
                    Name = "Malwana Community Complex",
                    Location = "Pugoda Road, Malwana",
                    Latitude = 6.9410,
                    Longitude = 80.0120,
                    TotalCapacity = 70,
                    CurrentOccupancy = 70,
                    OperationalStatus = "Full",
                    FacilitiesRaw = "Meals,Drinking Water,Sanitation",
                    ContactPerson = "Mr. K. Perera",
                    ContactPhone = "+94 11 289 1122",
                    LastUpdated = DateTime.UtcNow
                }
            };

            await context.Shelters.AddRangeAsync(shelters);
            await context.SaveChangesAsync();

            // 3. Seed Resource Allocations
            var allocations = new List<ResourceAllocation>
            {
                new ResourceAllocation
                {
                    ResourceId = resources[0].Id,
                    DestinationType = "Shelter",
                    DestinationShelterId = shelters[0].Id,
                    DestinationShelterName = shelters[0].Name,
                    Quantity = 1200,
                    AllocatedBy = "Logistics Mgr",
                    Notes = "Dispatched via Truck A for incoming evacuees",
                    Status = "Delivered",
                    AllocatedAt = DateTime.UtcNow.AddHours(-4)
                },
                new ResourceAllocation
                {
                    ResourceId = resources[1].Id,
                    DestinationType = "Shelter",
                    DestinationShelterId = shelters[1].Id,
                    DestinationShelterName = shelters[1].Name,
                    Quantity = 600,
                    AllocatedBy = "Logistics Mgr",
                    Notes = "Partner NGO stock dispatch",
                    Status = "InTransit",
                    AllocatedAt = DateTime.UtcNow.AddHours(-2)
                },
                new ResourceAllocation
                {
                    ResourceId = resources[2].Id,
                    DestinationType = "EmergencyRequest",
                    EmergencyRequestId = "RQ-2041",
                    Quantity = 12,
                    AllocatedBy = "Resource Manager",
                    Notes = "Critical insulin and triage kits for Kelaniya flood survivors",
                    Status = "Allocated",
                    AllocatedAt = DateTime.UtcNow.AddMinutes(-45)
                }
            };

            await context.ResourceAllocations.AddRangeAsync(allocations);

            // 4. Seed Household Allocations
            var householdAllocations = new List<HouseholdAllocation>
            {
                new HouseholdAllocation
                {
                    ShelterId = shelters[0].Id,
                    HouseholdHeadName = "Perera Family",
                    CaseReferenceId = "RQ-2041",
                    NumberOfPeople = 4,
                    SpecialNeeds = "Elderly care and asthma medication",
                    AllocatedBy = "Shelter Admin",
                    Status = "Confirmed",
                    AllocatedAt = DateTime.UtcNow.AddHours(-3)
                },
                new HouseholdAllocation
                {
                    ShelterId = shelters[1].Id,
                    HouseholdHeadName = "Silva Family",
                    CaseReferenceId = "RQ-2042",
                    NumberOfPeople = 3,
                    SpecialNeeds = "Infant infant formula",
                    AllocatedBy = "Shelter Admin",
                    Status = "Confirmed",
                    AllocatedAt = DateTime.UtcNow.AddHours(-1)
                }
            };

            await context.HouseholdAllocations.AddRangeAsync(householdAllocations);

            // 5. Seed Partner Support Requests
            var partnerRequests = new List<PartnerSupportRequest>
            {
                new PartnerSupportRequest
                {
                    RequiredResource = "Water (L)",
                    QuantityRequired = 3000,
                    RequestingLocation = "Biyagama Distribution Hub",
                    Priority = "Critical",
                    Reason = "3 urgent requests compete for Water (stock 120 strips). Local stock exhausted.",
                    Status = "Pending",
                    PartnerOrganization = "Sri Lanka Red Cross",
                    CreatedAt = DateTime.UtcNow.AddMinutes(-90)
                },
                new PartnerSupportRequest
                {
                    RequiredResource = "Medical Ambulances & Trauma Kits",
                    QuantityRequired = 2,
                    RequestingLocation = "Kelaniya South Basin",
                    Priority = "Critical",
                    Reason = "Shortage conflict: 3 urgent requests need 1 ambulance.",
                    Status = "Approved",
                    PartnerOrganization = "St. John Ambulance / DMC",
                    CreatedAt = DateTime.UtcNow.AddMinutes(-50)
                }
            };

            await context.PartnerSupportRequests.AddRangeAsync(partnerRequests);

            // 6. Seed Shelter Supply Requests
            var supplyRequests = new List<ShelterSupplyRequest>
            {
                new ShelterSupplyRequest
                {
                    ShelterId = shelters[2].Id,
                    ShelterName = shelters[2].Name,
                    RequestedResource = "Emergency Cots & Blankets",
                    Quantity = 40,
                    Priority = "High",
                    Reason = "Shelter nearing full capacity (98%). Rapid influx expected tonight.",
                    Status = "Pending",
                    CreatedAt = DateTime.UtcNow.AddMinutes(-60)
                },
                new ShelterSupplyRequest
                {
                    ShelterId = shelters[0].Id,
                    ShelterName = shelters[0].Name,
                    RequestedResource = "Water Purification Tablets",
                    Quantity = 200,
                    Priority = "Critical",
                    Reason = "Local well water contaminated by river overflow.",
                    Status = "Dispatched",
                    CreatedAt = DateTime.UtcNow.AddHours(-2)
                }
            };

            await context.ShelterSupplyRequests.AddRangeAsync(supplyRequests);

            // 7. Seed Emergency Requests
            var emergencies = new List<EmergencyRequestReference>
            {
                new EmergencyRequestReference
                {
                    RequestIdentifier = "RQ-2041",
                    Category = "Medical / Evacuation",
                    Location = "Kelaniya South (Near Rail Bridge)",
                    Latitude = 6.9535,
                    Longitude = 79.9167,
                    Priority = "CRITICAL",
                    CurrentStatus = "Pending",
                    PeopleCount = 4,
                    Description = "Elderly diabetic resident stranded on upper floor. Water level rising.",
                    ReportedAt = DateTime.UtcNow.AddMinutes(-35)
                },
                new EmergencyRequestReference
                {
                    RequestIdentifier = "RQ-2042",
                    Category = "Rescue / Evacuation",
                    Location = "Biyagama Industrial Zone Border",
                    Latitude = 6.9412,
                    Longitude = 79.9890,
                    Priority = "CRITICAL",
                    CurrentStatus = "Responder Assigned",
                    PeopleCount = 6,
                    Description = "Family trapped by flash flood near river bank canal.",
                    ReportedAt = DateTime.UtcNow.AddMinutes(-55)
                },
                new EmergencyRequestReference
                {
                    RequestIdentifier = "RQ-2043",
                    Category = "Food & Water",
                    Location = "Kaduwela Lowland Sector C",
                    Latitude = 6.9350,
                    Longitude = 79.9750,
                    Priority = "HIGH",
                    CurrentStatus = "Pending",
                    PeopleCount = 5,
                    Description = "Clean drinking water exhausted. Road cutoff by 0.5m water.",
                    ReportedAt = DateTime.UtcNow.AddHours(-1)
                }
            };

            await context.EmergencyRequests.AddRangeAsync(emergencies);

            // 8. Seed Flood Zones (with polygon boundaries around Kelaniya/Biyagama)
            var floodZones = new List<FloodZoneReference>
            {
                new FloodZoneReference
                {
                    ZoneName = "Kelaniya River Basin - High Inundation Zone",
                    SeverityLevel = "High Risk",
                    WaterLevelTrend = "Rising (+0.4m/hr)",
                    EstimatedAffectedPopulation = 4200,
                    EvacuationStatus = "Mandatory Evacuation Ordered",
                    CenterLatitude = 6.9550,
                    CenterLongitude = 79.9200,
                    PolygonCoordinatesJson = "[[6.9650, 79.9050], [6.9680, 79.9300], [6.9500, 79.9350], [6.9450, 79.9120], [6.9650, 79.9050]]",
                    LastUpdated = DateTime.UtcNow
                },
                new FloodZoneReference
                {
                    ZoneName = "Biyagama Lowland Flash Flood Zone",
                    SeverityLevel = "Moderate Risk",
                    WaterLevelTrend = "Peak Stagnant",
                    EstimatedAffectedPopulation = 2600,
                    EvacuationStatus = "Advisory in Effect",
                    CenterLatitude = 6.9420,
                    CenterLongitude = 79.9910,
                    PolygonCoordinatesJson = "[[6.9500, 79.9780], [6.9520, 80.0050], [6.9350, 80.0020], [6.9320, 79.9800], [6.9500, 79.9780]]",
                    LastUpdated = DateTime.UtcNow
                },
                new FloodZoneReference
                {
                    ZoneName = "Kaduwela Canal Corridor",
                    SeverityLevel = "Severe Inundation",
                    WaterLevelTrend = "Receding Slowly (-0.1m/hr)",
                    EstimatedAffectedPopulation = 1850,
                    EvacuationStatus = "Active Relief & Rescue",
                    CenterLatitude = 6.9310,
                    CenterLongitude = 79.9800,
                    PolygonCoordinatesJson = "[[6.9380, 79.9680], [6.9400, 79.9900], [6.9250, 79.9880], [6.9230, 79.9700], [6.9380, 79.9680]]",
                    LastUpdated = DateTime.UtcNow
                }
            };

            await context.FloodZones.AddRangeAsync(floodZones);

            await context.SaveChangesAsync();
        }
    }
}
