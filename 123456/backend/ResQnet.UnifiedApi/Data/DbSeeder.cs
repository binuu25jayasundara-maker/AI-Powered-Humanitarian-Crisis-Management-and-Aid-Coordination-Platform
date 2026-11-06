using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using ResQnet.UnifiedApi.Models;
using ResQnet.UnifiedApi.Security;

namespace ResQnet.UnifiedApi.Data
{
    public static class DbSeeder
    {
        public static async Task SeedAsync(AppDbContext context, IPasswordHasher hasher)
        {
            if (await context.Users.AnyAsync())
            {
                return; // Database already seeded
            }

            var defaultPasswordHash = hasher.HashPassword("Password@123");

            // 1. Seed Organizations
            var orgs = new List<Organization>
            {
                new Organization
                {
                    Id = "11111111-1111-1111-1111-111111111111",
                    Name = "National Disaster Management Centre",
                    Code = "DMC-LK",
                    Type = "Government",
                    ContactEmail = "ops@dmc.gov.lk",
                    ContactPhone = "+94 11 213 6136",
                    Address = "Vidya Mawatha, Colombo 07",
                    IsVerified = true,
                    MemberCount = 14
                },
                new Organization
                {
                    Id = "22222222-2222-2222-2222-222222222222",
                    Name = "Sri Lanka Red Cross Society",
                    Code = "SLRC",
                    Type = "NGO",
                    ContactEmail = "info@redcross.lk",
                    ContactPhone = "+94 11 269 1095",
                    Address = "Dharmapala Mawatha, Colombo 07",
                    IsVerified = true,
                    MemberCount = 28
                },
                new Organization
                {
                    Id = "33333333-3333-3333-3333-333333333333",
                    Name = "Sarvodaya Shramadana Movement",
                    Code = "SARVODAYA",
                    Type = "NGO",
                    ContactEmail = "relief@sarvodaya.org",
                    ContactPhone = "+94 11 265 5255",
                    Address = "Rawatawatte Road, Moratuwa",
                    IsVerified = true,
                    MemberCount = 42
                }
            };
            await context.Organizations.AddRangeAsync(orgs);

            // 2. Seed Users
            var users = new List<User>
            {
                new User
                {
                    Id = "u-1",
                    FullName = "Platform Administrator",
                    Email = "admin@resqnet.org",
                    PasswordHash = defaultPasswordHash,
                    Role = "SystemAdmin",
                    OrganizationId = orgs[0].Id,
                    OrganizationName = orgs[0].Name,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow.AddDays(-30),
                    LastLoginAt = DateTime.UtcNow.AddHours(-1)
                },
                new User
                {
                    Id = "u-2",
                    FullName = "Chaminda Silva",
                    Email = "coordinator@resqnet.org",
                    PasswordHash = defaultPasswordHash,
                    Role = "EmergencyCoordinator",
                    OrganizationId = orgs[0].Id,
                    OrganizationName = orgs[0].Name,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow.AddDays(-28),
                    LastLoginAt = DateTime.UtcNow.AddHours(-2)
                },
                new User
                {
                    Id = "u-3",
                    FullName = "Nadeesha Perera",
                    Email = "casemanager@resqnet.org",
                    PasswordHash = defaultPasswordHash,
                    Role = "CaseManager",
                    OrganizationId = orgs[0].Id,
                    OrganizationName = orgs[0].Name,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow.AddDays(-25),
                    LastLoginAt = DateTime.UtcNow.AddHours(-3)
                },
                new User
                {
                    Id = "u-4",
                    FullName = "Kasun Jayawardena",
                    Email = "volunteer.coord@resqnet.org",
                    PasswordHash = defaultPasswordHash,
                    Role = "VolunteerCoordinator",
                    OrganizationId = orgs[1].Id,
                    OrganizationName = orgs[1].Name,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow.AddDays(-20),
                    LastLoginAt = DateTime.UtcNow.AddHours(-4)
                },
                new User
                {
                    Id = "u-5",
                    FullName = "Anura Fernando",
                    Email = "donor.officer@resqnet.org",
                    PasswordHash = defaultPasswordHash,
                    Role = "DonorOfficer",
                    OrganizationId = orgs[1].Id,
                    OrganizationName = orgs[1].Name,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow.AddDays(-18),
                    LastLoginAt = DateTime.UtcNow.AddHours(-5)
                },
                new User
                {
                    Id = "u-6",
                    FullName = "Sunil Weerasinghe",
                    Email = "citizen@resqnet.org",
                    PasswordHash = defaultPasswordHash,
                    Role = "Citizen",
                    OrganizationId = null,
                    OrganizationName = null,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow.AddDays(-15),
                    LastLoginAt = DateTime.UtcNow.AddHours(-6)
                },
                new User
                {
                    Id = "u-7",
                    FullName = "Dilan Perera",
                    Email = "donor@resqnet.org",
                    PasswordHash = defaultPasswordHash,
                    Role = "DonorAndVolunteer",
                    OrganizationId = null,
                    OrganizationName = null,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow.AddDays(-10),
                    LastLoginAt = DateTime.UtcNow.AddHours(-7)
                },
                new User
                {
                    Id = "u-8",
                    FullName = "Sanduni Fernando",
                    Email = "volunteer@resqnet.org",
                    PasswordHash = defaultPasswordHash,
                    Role = "DonorAndVolunteer",
                    OrganizationId = null,
                    OrganizationName = null,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow.AddDays(-8),
                    LastLoginAt = DateTime.UtcNow.AddHours(-8)
                }
            };
            await context.Users.AddRangeAsync(users);

            // 3. Seed Roles
            var roles = new List<RoleEntity>
            {
                new RoleEntity { Id = "r-1", Name = "SystemAdmin", Description = "Full system administration and user management.", PermissionsJson = "[\"users:read\",\"users:write\",\"users:delete\",\"orgs:read\",\"orgs:write\",\"audit:read\",\"settings:all\"]" },
                new RoleEntity { Id = "r-2", Name = "EmergencyCoordinator", Description = "Coordinates incident response, case dispatch, shelter & resource allocation.", PermissionsJson = "[\"cases:all\",\"shelters:all\",\"resources:all\",\"volunteers:assign\",\"reports:all\"]" },
                new RoleEntity { Id = "r-3", Name = "CaseManager", Description = "Triages incoming emergency cases and executes aid responses.", PermissionsJson = "[\"cases:read\",\"cases:write\",\"cases:decision\",\"shelters:read\"]" },
                new RoleEntity { Id = "r-4", Name = "VolunteerCoordinator", Description = "Schedules and coordinates volunteer workforce & task matching.", PermissionsJson = "[\"volunteers:all\",\"schedules:all\",\"tasks:assign\"]" },
                new RoleEntity { Id = "r-5", Name = "DonorOfficer", Description = "Manages financial campaigns, donor verification and physical relief goods intake.", PermissionsJson = "[\"donations:all\",\"campaigns:all\",\"goods:all\"]" },
                new RoleEntity { Id = "r-6", Name = "DonorAndVolunteer", Description = "Public contributor capable of making donations and volunteering for relief.", PermissionsJson = "[\"donations:submit\",\"volunteers:register\",\"profile:edit\"]" },
                new RoleEntity { Id = "r-7", Name = "Citizen", Description = "Public citizen reporting emergencies and requesting safety assistance.", PermissionsJson = "[\"requests:submit\",\"shelters:view\",\"alerts:view\"]" }
            };
            await context.Roles.AddRangeAsync(roles);

            // 4. Seed Audit Events
            var auditEvents = new List<AuditEventEntity>
            {
                new AuditEventEntity { Id = "aud-1", ActorId = "u-1", ActorEmail = "admin@resqnet.org", Action = "USER_CREATED", EntityName = "User", EntityId = "u-6", DetailsJson = "{\"email\":\"citizen@resqnet.org\",\"role\":\"Citizen\"}", IpAddress = "192.168.1.10", Status = "Success", CreatedAt = DateTime.UtcNow.AddHours(-5) },
                new AuditEventEntity { Id = "aud-2", ActorId = "u-2", ActorEmail = "coordinator@resqnet.org", Action = "AI_RECOMMENDATION_APPROVED", EntityName = "Case", EntityId = "#2341", DetailsJson = "{\"caseNumber\":\"#2341\",\"action\":\"Approved\",\"urgency\":\"High\"}", IpAddress = "192.168.1.25", Status = "Success", CreatedAt = DateTime.UtcNow.AddHours(-4) },
                new AuditEventEntity { Id = "aud-3", ActorId = "u-4", ActorEmail = "volunteer.coord@resqnet.org", Action = "VOLUNTEER_TASK_ASSIGNED", EntityName = "VolunteerTask", EntityId = "VT-882", DetailsJson = "{\"volunteer\":\"Ruwan D.\",\"task\":\"Distribute meals - Rivagama\"}", IpAddress = "192.168.1.44", Status = "Success", CreatedAt = DateTime.UtcNow.AddHours(-3) },
                new AuditEventEntity { Id = "aud-4", ActorId = "u-5", ActorEmail = "donor.officer@resqnet.org", Action = "DONATION_RECORDED", EntityName = "Donation", EntityId = "DON-1044", DetailsJson = "{\"donor\":\"Org X\",\"amount\":300000,\"flag\":\"Urgent\"}", IpAddress = "192.168.1.60", Status = "Success", CreatedAt = DateTime.UtcNow.AddHours(-2) },
                new AuditEventEntity { Id = "aud-5", ActorId = "system", ActorEmail = "system@resqnet.org", Action = "SYSTEM_INITIALIZED", EntityName = "System", EntityId = "V1.0", DetailsJson = "{\"status\":\"Production baseline seeded\"}", IpAddress = "127.0.0.1", Status = "Success", CreatedAt = DateTime.UtcNow.AddHours(-24) }
            };
            await context.AuditEvents.AddRangeAsync(auditEvents);

            // 5. Seed Cases
            var mockRec2341 = new AiRecommendationDto
            {
                Id = "rec-2341",
                Category = "Disaster Relief",
                Urgency = "High - immediate assistance needed.",
                View = "Provide shelter, food supplies, medical aid.",
                Suggest = "Coordinate with local authorities and NGOs.",
                PriorityScore = 88,
                Confidence = 0.94,
                Rationale = "NLP multi-factor scoring classified as Disaster Relief based on compound terms (flood, shelter, medical). High urgency triggered due to vulnerable displaced family count and road closures.",
                ProviderStrategy = "RuleBasedStrategy (Deterministic Fallback)",
                Fallback = true
            };

            var cases = new List<CrisisCase>
            {
                new CrisisCase
                {
                    Id = "12345678-2341-2341-2341-123456789abc",
                    CaseNumber = "#2341",
                    Title = "Flood, Kandyyva",
                    Location = "Kandyya, Central Province, Sri Lanka",
                    RequestDetails = "Emergency shelter, food, and medical assistance required for 45 displaced villagers.",
                    Evidence = "Photos, news reports, witness statements.",
                    Status = "Assessed - awaiting approval",
                    Urgency = "High",
                    AssignedAgency = "DMC-LK",
                    PeopleAffected = 45,
                    Category = "Disaster Relief",
                    DueAt = DateTime.UtcNow.AddHours(12),
                    CreatedAt = DateTime.UtcNow.AddHours(-18),
                    PossibleDuplicate = "#2187 - Flood (Kandy)",
                    DuplicateRiskLevel = "Medium",
                    RecommendationJson = JsonSerializer.Serialize(mockRec2341)
                },
                new CrisisCase
                {
                    Id = "12345678-2041-2041-2041-123456789abc",
                    CaseNumber = "#2041",
                    Title = "Kelaniya Basin Surge Inundation",
                    Location = "Kelaniya River Road, Pilapitiya, Western Province",
                    RequestDetails = "Elderly diabetic patient trapped on second floor due to 4ft water level.",
                    Evidence = "Direct citizen mobile dispatch with GPS tag.",
                    Status = "Active",
                    Urgency = "Critical",
                    AssignedAgency = "SLRC",
                    PeopleAffected = 5,
                    Category = "Medical & Evacuation",
                    DueAt = DateTime.UtcNow.AddHours(4),
                    CreatedAt = DateTime.UtcNow.AddHours(-6)
                },
                new CrisisCase
                {
                    Id = "12345678-2042-2042-2042-123456789abc",
                    CaseNumber = "#2042",
                    Title = "Biyagama Rooftop Evacuation",
                    Location = "Biyagama North, Siyambalape, Western Province",
                    RequestDetails = "Three families isolated on rooftop; no food or potable water since yesterday evening.",
                    Evidence = "Local volunteer spot report.",
                    Status = "Active",
                    Urgency = "High",
                    AssignedAgency = "SARVODAYA",
                    PeopleAffected = 14,
                    Category = "Food & Clean Water",
                    DueAt = DateTime.UtcNow.AddHours(8),
                    CreatedAt = DateTime.UtcNow.AddHours(-10)
                },
                new CrisisCase
                {
                    Id = "12345678-2187-2187-2187-123456789abc",
                    CaseNumber = "#2187",
                    Title = "Peradeniya Riverbank Landslide",
                    Location = "Peradeniya Road, Kandy, Central Province",
                    RequestDetails = "Landslide blocked access to St. Mary shelter sector; medical transport delayed.",
                    Evidence = "Police field report.",
                    Status = "Resolved",
                    Urgency = "High",
                    AssignedAgency = "DMC-LK",
                    PeopleAffected = 28,
                    Category = "Search & Rescue",
                    DueAt = DateTime.UtcNow.AddHours(-12),
                    CreatedAt = DateTime.UtcNow.AddDays(-2)
                }
            };
            await context.Cases.AddRangeAsync(cases);

            // 6. Seed Shelters
            var shelters = new List<ShelterEntity>
            {
                new ShelterEntity
                {
                    Id = 1,
                    Name = "Kelaniya Maha Vidyalaya Center",
                    Location = "Kelaniya, Gampaha District, Western Province",
                    Latitude = 6.9538,
                    Longitude = 79.9167,
                    TotalCapacity = 450,
                    CurrentOccupancy = 369,
                    AvailableSpaces = 81,
                    OccupancyPercentage = 82,
                    OperationalStatus = "Open",
                    FacilitiesJson = "[\"Accessibility\",\"Meals\",\"Medical Assistance\",\"Drinking Water\",\"Sanitation\"]",
                    ContactPerson = "Sunil Wickramasinghe",
                    ContactPhone = "+94 77 123 4567",
                    LastUpdated = DateTime.UtcNow
                },
                new ShelterEntity
                {
                    Id = 2,
                    Name = "Biyagama Community Hall",
                    Location = "Biyagama South, Gampaha District, Western Province",
                    Latitude = 6.9421,
                    Longitude = 79.9482,
                    TotalCapacity = 300,
                    CurrentOccupancy = 192,
                    AvailableSpaces = 108,
                    OccupancyPercentage = 64,
                    OperationalStatus = "Open",
                    FacilitiesJson = "[\"Meals\",\"Medical Assistance\",\"Sanitation\",\"Drinking Water\"]",
                    ContactPerson = "Malini Perera",
                    ContactPhone = "+94 71 234 5678",
                    LastUpdated = DateTime.UtcNow
                },
                new ShelterEntity
                {
                    Id = 3,
                    Name = "Kaduwela Town Hall Center",
                    Location = "Kaduwela Junction, Colombo District, Western Province",
                    Latitude = 6.9344,
                    Longitude = 79.9839,
                    TotalCapacity = 250,
                    CurrentOccupancy = 245,
                    AvailableSpaces = 5,
                    OccupancyPercentage = 98,
                    OperationalStatus = "Almost Full",
                    FacilitiesJson = "[\"Accessibility\",\"Meals\",\"Drinking Water\",\"Sanitation\"]",
                    ContactPerson = "Ruwan Jayasuriya",
                    ContactPhone = "+94 76 345 6789",
                    LastUpdated = DateTime.UtcNow
                },
                new ShelterEntity
                {
                    Id = 4,
                    Name = "Wellampitiya Youth Club",
                    Location = "Wellampitiya, Colombo District, Western Province",
                    Latitude = 6.9481,
                    Longitude = 79.8894,
                    TotalCapacity = 180,
                    CurrentOccupancy = 180,
                    AvailableSpaces = 0,
                    OccupancyPercentage = 100,
                    OperationalStatus = "Full",
                    FacilitiesJson = "[\"Meals\",\"Sanitation\",\"Drinking Water\"]",
                    ContactPerson = "Ananda Silva",
                    ContactPhone = "+94 70 456 7890",
                    LastUpdated = DateTime.UtcNow
                },
                new ShelterEntity
                {
                    Id = 5,
                    Name = "Peliyagoda Central College",
                    Location = "Peliyagoda, Gampaha District, Western Province",
                    Latitude = 6.9688,
                    Longitude = 79.8972,
                    TotalCapacity = 350,
                    CurrentOccupancy = 110,
                    AvailableSpaces = 240,
                    OccupancyPercentage = 31,
                    OperationalStatus = "Open",
                    FacilitiesJson = "[\"Accessibility\",\"Meals\",\"Medical Assistance\",\"Drinking Water\",\"Sanitation\"]",
                    ContactPerson = "Kanthi Rajapaksha",
                    ContactPhone = "+94 72 567 8901",
                    LastUpdated = DateTime.UtcNow
                },
                new ShelterEntity
                {
                    Id = 6,
                    Name = "Rivagama Relief Center",
                    Location = "Rivagama, Western Province",
                    Latitude = 6.9215,
                    Longitude = 79.9140,
                    TotalCapacity = 300,
                    CurrentOccupancy = 120,
                    AvailableSpaces = 180,
                    OccupancyPercentage = 40,
                    OperationalStatus = "Open",
                    FacilitiesJson = "[\"Accessibility\",\"Meals\",\"Medical Assistance\",\"Drinking Water\",\"Sanitation\"]",
                    ContactPerson = "Dhammika Fernando",
                    ContactPhone = "+94 77 890 1234",
                    LastUpdated = DateTime.UtcNow
                },
                new ShelterEntity
                {
                    Id = 7,
                    Name = "St. Mary School Shelter",
                    Location = "Peradeniya Road, Kandy, Central District",
                    Latitude = 7.2750,
                    Longitude = 80.6050,
                    TotalCapacity = 150,
                    CurrentOccupancy = 128,
                    AvailableSpaces = 22,
                    OccupancyPercentage = 85,
                    OperationalStatus = "Almost Full",
                    FacilitiesJson = "[\"Meals\",\"Drinking Water\",\"Medical Assistance\",\"Sanitation\"]",
                    ContactPerson = "Sister Theresa",
                    ContactPhone = "+94 81 234 5678",
                    LastUpdated = DateTime.UtcNow
                },
                new ShelterEntity
                {
                    Id = 8,
                    Name = "Town Hall Safe Zone",
                    Location = "Kandy Town Hall, Central District",
                    Latitude = 7.2906,
                    Longitude = 80.6337,
                    TotalCapacity = 200,
                    CurrentOccupancy = 196,
                    AvailableSpaces = 4,
                    OccupancyPercentage = 98,
                    OperationalStatus = "Almost Full",
                    FacilitiesJson = "[\"Medical Assistance\",\"Accessibility\",\"Drinking Water\",\"Beds\"]",
                    ContactPerson = "Sarath Bandara",
                    ContactPhone = "+94 81 345 6789",
                    LastUpdated = DateTime.UtcNow
                },
                new ShelterEntity
                {
                    Id = 9,
                    Name = "Community Hall Gampaha",
                    Location = "Main Street, Gampaha District, Western Province",
                    Latitude = 7.0840,
                    Longitude = 79.9925,
                    TotalCapacity = 120,
                    CurrentOccupancy = 40,
                    AvailableSpaces = 80,
                    OccupancyPercentage = 33,
                    OperationalStatus = "Open",
                    FacilitiesJson = "[\"Meals\",\"Drinking Water\",\"Accessibility\",\"Beds\"]",
                    ContactPerson = "Nimali Senanayake",
                    ContactPhone = "+94 33 456 7890",
                    LastUpdated = DateTime.UtcNow
                }
            };
            await context.Shelters.AddRangeAsync(shelters);

            // 7. Seed Resources
            var resources = new List<ResourceEntity>
            {
                new ResourceEntity { Id = 1, Name = "Bottled Drinking Water (5L)", Category = "Water", AvailableQuantity = 12400, AllocatedQuantity = 3200, MinimumStockLevel = 2500, Unit = "Liters", Status = "Normal", UpdatedAt = DateTime.UtcNow },
                new ResourceEntity { Id = 2, Name = "Family Food Ration Packs", Category = "Food Packs", AvailableQuantity = 3200, AllocatedQuantity = 1100, MinimumStockLevel = 800, Unit = "Packs", Status = "Normal", UpdatedAt = DateTime.UtcNow },
                new ResourceEntity { Id = 3, Name = "Emergency Medicine Kits", Category = "Medicine Kits", AvailableQuantity = 310, AllocatedQuantity = 95, MinimumStockLevel = 400, Unit = "Kits", Status = "Warning", UpdatedAt = DateTime.UtcNow },
                new ResourceEntity { Id = 4, Name = "First Aid Trauma Kits", Category = "First Aid Kits", AvailableQuantity = 180, AllocatedQuantity = 65, MinimumStockLevel = 100, Unit = "Kits", Status = "Normal", UpdatedAt = DateTime.UtcNow },
                new ResourceEntity { Id = 5, Name = "Purification Tablets (Box of 100)", Category = "Water", AvailableQuantity = 850, AllocatedQuantity = 400, MinimumStockLevel = 300, Unit = "Boxes", Status = "Normal", UpdatedAt = DateTime.UtcNow },
                new ResourceEntity { Id = 6, Name = "Infant Nutrition Formula", Category = "Food Packs", AvailableQuantity = 85, AllocatedQuantity = 60, MinimumStockLevel = 150, Unit = "Tins", Status = "Critical", UpdatedAt = DateTime.UtcNow },
                new ResourceEntity { Id = 7, Name = "Emergency Blankets & Tarpaulins", Category = "Essential Supplies", AvailableQuantity = 1450, AllocatedQuantity = 620, MinimumStockLevel = 500, Unit = "Sets", Status = "Normal", UpdatedAt = DateTime.UtcNow }
            };
            await context.Resources.AddRangeAsync(resources);

            // 8. Seed Resource Allocations
            var allocations = new List<ResourceAllocationEntity>
            {
                new ResourceAllocationEntity { Id = 1, ResourceId = 1, ResourceName = "Bottled Drinking Water (5L)", ResourceCategory = "Water", DestinationType = "Shelter", DestinationShelterId = 1, DestinationShelterName = "Kelaniya Maha Vidyalaya Center", DestinationName = "Kelaniya Maha Vidyalaya Center", Quantity = 1200, AllocatedBy = "Chaminda Silva", Notes = "Initial intake water supply", Status = "Fulfilled", AllocatedAt = DateTime.UtcNow.AddHours(-4) },
                new ResourceAllocationEntity { Id = 2, ResourceId = 2, ResourceName = "Family Food Ration Packs", ResourceCategory = "Food Packs", DestinationType = "Shelter", DestinationShelterId = 2, DestinationShelterName = "Biyagama Community Hall", DestinationName = "Biyagama Community Hall", Quantity = 450, AllocatedBy = "Nadeesha Perera", Notes = "Evening meal packs", Status = "Fulfilled", AllocatedAt = DateTime.UtcNow.AddHours(-2) },
                new ResourceAllocationEntity { Id = 3, ResourceId = 3, ResourceName = "Emergency Medicine Kits", ResourceCategory = "Medicine Kits", DestinationType = "EmergencyRequest", EmergencyRequestId = "RQ-2041", DestinationName = "Emergency Request RQ-2041", Quantity = 25, AllocatedBy = "Chaminda Silva", Notes = "Flood surge medical kit dispatch", Status = "Fulfilled", AllocatedAt = DateTime.UtcNow.AddMinutes(-30) }
            };
            await context.ResourceAllocations.AddRangeAsync(allocations);

            // 9. Seed Support Requests
            var supportRequests = new List<SupportRequestEntity>
            {
                new SupportRequestEntity { Id = 1, RequiredResource = "Ambulance Units & Emergency Paramedics", QuantityRequired = 3, RequestingLocation = "Kelaniya Basin Flood Zone", Priority = "High", Reason = "High flood water preventing regular transport for 8 stranded dialysis patients.", Status = "Pending", PartnerOrganization = "Sri Lanka Red Cross Society", CreatedAt = DateTime.UtcNow.AddHours(-3) },
                new SupportRequestEntity { Id = 2, RequiredResource = "Clean Drinking Water Tankers (10,000L)", QuantityRequired = 2, RequestingLocation = "Biyagama Community Hall Shelter", Priority = "High", Reason = "Municipal water supply contaminated by river flood surge.", Status = "Accepted", PartnerOrganization = "National Water Supply & Drainage Board", CreatedAt = DateTime.UtcNow.AddHours(-6) }
            };
            await context.SupportRequests.AddRangeAsync(supportRequests);

            // 10. Seed Shelter Supply Requests
            var supplyRequests = new List<ShelterSupplyRequestEntity>
            {
                new ShelterSupplyRequestEntity { Id = 1, ShelterId = 1, ShelterName = "Kelaniya Maha Vidyalaya Center", RequestedResource = "Family Food Ration Packs", Quantity = 200, Priority = "High", Reason = "Evening influx of 45 newly evacuated families from river bank.", Status = "Pending", CreatedAt = DateTime.UtcNow.AddHours(-2) },
                new ShelterSupplyRequestEntity { Id = 2, ShelterId = 2, ShelterName = "Biyagama Community Hall", RequestedResource = "Infant Nutrition Formula", Quantity = 40, Priority = "Critical", Reason = "8 infants among evacuees requiring immediate formula feed.", Status = "Approved", CreatedAt = DateTime.UtcNow.AddHours(-3) }
            };
            await context.ShelterSupplyRequests.AddRangeAsync(supplyRequests);

            // 11. Seed Campaigns
            var campaigns = new List<CampaignEntity>
            {
                new CampaignEntity
                {
                    Id = "44444444-4444-4444-4444-444444444444",
                    Title = "Flood Relief 2024",
                    GoalAmount = 5000000,
                    RaisedAmount = 4200000,
                    ProgressPercent = 84.0,
                    MedicalItemsCount = 1284,
                    DisposalFlagCount = 3,
                    FoodAllocationPercent = 40,
                    MedicalAllocationPercent = 35,
                    ShelterAllocationPercent = 25,
                    Status = "Active",
                    CreatedAt = DateTime.UtcNow.AddDays(-15)
                },
                new CampaignEntity
                {
                    Id = "55555555-5555-5555-5555-555555555555",
                    Title = "Kandy Landslide Emergency Support",
                    GoalAmount = 2500000,
                    RaisedAmount = 1800000,
                    ProgressPercent = 72.0,
                    MedicalItemsCount = 450,
                    DisposalFlagCount = 1,
                    FoodAllocationPercent = 30,
                    MedicalAllocationPercent = 50,
                    ShelterAllocationPercent = 20,
                    Status = "Active",
                    CreatedAt = DateTime.UtcNow.AddDays(-10)
                }
            };
            await context.Campaigns.AddRangeAsync(campaigns);

            // 12. Seed Donations
            var donations = new List<DonationEntity>
            {
                new DonationEntity { Id = "1", CampaignTitle = "Flood Relief 2024", DonorName = "A. Silva", Amount = 25000, ItemCount = 0, Flag = "-", IsSuspicious = false, CreatedAt = DateTime.UtcNow.AddHours(-2) },
                new DonationEntity { Id = "2", CampaignTitle = "Flood Relief 2024", DonorName = "Org X", Amount = 300000, ItemCount = 500, Flag = "Urgent", IsSuspicious = false, CreatedAt = DateTime.UtcNow.AddHours(-6) },
                new DonationEntity { Id = "3", CampaignTitle = "Flood Relief 2024", DonorName = "K. Perera", Amount = 5000, ItemCount = 0, Flag = "-", IsSuspicious = false, CreatedAt = DateTime.UtcNow.AddHours(-18) }
            };
            await context.Donations.AddRangeAsync(donations);

            // 13. Seed Donors
            var donors = new List<DonorProfileEntity>
            {
                new DonorProfileEntity { Id = "d-1", DonorId = "DON-0001", FullName = "A. Silva", Email = "a.silva@resqnet.org", PhoneNumber = "+94 77 123 4567", Address = "Colombo 03", CreatedAt = DateTime.UtcNow.AddDays(-20) },
                new DonorProfileEntity { Id = "d-2", DonorId = "DON-0002", FullName = "Org X Relief Consortium", Email = "relief@orgx.org", PhoneNumber = "+94 11 234 5678", Address = "Kollupitiya, Colombo 03", CreatedAt = DateTime.UtcNow.AddDays(-15) },
                new DonorProfileEntity { Id = "d-3", DonorId = "DON-0003", FullName = "K. Perera", Email = "k.perera@resqnet.org", PhoneNumber = "+94 77 345 6789", Address = "Moratuwa", CreatedAt = DateTime.UtcNow.AddDays(-10) }
            };
            await context.DonorProfiles.AddRangeAsync(donors);

            // 14. Seed Monetary Donations
            var monetary = new List<MonetaryDonationEntity>
            {
                new MonetaryDonationEntity
                {
                    Id = "mon-1",
                    DonationReference = "REQ-MON-1001",
                    DonorId = "DON-0001",
                    DonorName = "A. Silva",
                    Email = "a.silva@resqnet.org",
                    ContactNumber = "+94 77 123 4567",
                    Amount = 25000,
                    Currency = "LKR",
                    Purpose = "Flood Relief 2024 - Urgent Medicals",
                    PaymentMethod = "Bank Transfer",
                    BankReference = "BOC-TXN-882190",
                    PaymentGatewayStatus = "Pending Verification",
                    Status = "Payment Verification",
                    SubmittedAt = DateTime.UtcNow.AddHours(-4)
                },
                new MonetaryDonationEntity
                {
                    Id = "mon-2",
                    DonationReference = "REQ-MON-1002",
                    DonorId = "DON-0002",
                    DonorName = "Org X Relief Consortium",
                    Email = "relief@orgx.org",
                    ContactNumber = "+94 11 234 5678",
                    Amount = 300000,
                    Currency = "LKR",
                    Purpose = "Emergency Shelter Operations",
                    PaymentMethod = "Online Card Payment",
                    PaymentGatewayStatus = "Verified",
                    Status = "Confirmed",
                    SubmittedAt = DateTime.UtcNow.AddHours(-24),
                    VerifiedAt = DateTime.UtcNow.AddHours(-23),
                    VerifiedBy = "Coordinator System"
                }
            };
            await context.MonetaryDonations.AddRangeAsync(monetary);

            // 15. Seed Goods Donations
            var goodsItems1 = new List<GoodsItemDto>
            {
                new GoodsItemDto { Id = "item-1", Category = "Medical supplies", ItemName = "First Aid Packs & Gauze", Quantity = 300, Unit = "packs", Condition = "New", Notes = "Sterilized" },
                new GoodsItemDto { Id = "item-2", Category = "Hygiene products", ItemName = "Antiseptic Solution 500ml", Quantity = 200, Unit = "units", Condition = "New" }
            };
            var goodsItems2 = new List<GoodsItemDto>
            {
                new GoodsItemDto { Id = "item-3", Category = "Food and water", ItemName = "Dry Ration Rice & Dhal Packs", Quantity = 50, Unit = "boxes", Condition = "New" },
                new GoodsItemDto { Id = "item-4", Category = "Clothing", ItemName = "Adult Raincoats & Blankets", Quantity = 40, Unit = "units", Condition = "New" }
            };

            var goods = new List<GoodsDonationEntity>
            {
                new GoodsDonationEntity
                {
                    Id = "gds-1",
                    RequestReference = "REQ-GDS-1001",
                    DonorId = "DON-0002",
                    DonorName = "Org X Relief Consortium",
                    Email = "relief@orgx.org",
                    ContactNumber = "+94 11 234 5678",
                    Address = "Consortium Warehouse, Colombo 03",
                    Notes = "Urgent medical and hygiene relief supplies ready for inspection.",
                    ItemsJson = JsonSerializer.Serialize(goodsItems1),
                    Status = "Approved",
                    EarliestHandoverDate = DateTime.UtcNow.ToString("yyyy-MM-dd"),
                    LatestHandoverDate = DateTime.UtcNow.AddDays(7).ToString("yyyy-MM-dd"),
                    HandoverLocation = "Rivagama Relief Center Warehouse",
                    AvailableTimeSlotsJson = "[\"09:00 AM - 12:00 PM\",\"02:00 PM - 05:00 PM\"]",
                    SelectedHandoverDate = DateTime.UtcNow.AddDays(1).ToString("yyyy-MM-dd"),
                    SelectedTimeSlot = "09:00 AM - 12:00 PM",
                    HandoverConfirmedAt = DateTime.UtcNow.AddHours(-12),
                    CreatedAt = DateTime.UtcNow.AddHours(-48)
                },
                new GoodsDonationEntity
                {
                    Id = "gds-2",
                    RequestReference = "REQ-GDS-1002",
                    DonorId = "DON-0003",
                    DonorName = "K. Perera",
                    Email = "k.perera@resqnet.org",
                    ContactNumber = "+94 77 345 6789",
                    Address = "14 Rawatawatte, Moratuwa",
                    Notes = "Packaged dry rations and clean clothing.",
                    ItemsJson = JsonSerializer.Serialize(goodsItems2),
                    Status = "Pending Approval",
                    CreatedAt = DateTime.UtcNow.AddHours(-6)
                }
            };
            await context.GoodsDonations.AddRangeAsync(goods);

            // 16. Seed Volunteers
            var volunteers = new List<VolunteerEntity>
            {
                new VolunteerEntity { Id = "11111111-1111-1111-1111-111111111111", VolunteerId = "VOL-0002", FullName = "Nimal P.", Email = "nimal@resqnet.org", PhoneNumber = "+94 77 111 2222", Skills = "First aid, driving", Status = "Available", TotalHours = 48, WeeklyAvailabilityJson = "[\"Mon\",\"Tue\",\"Wed\",\"Thu\",\"Fri\"]", CreatedAt = DateTime.UtcNow.AddDays(-20) },
                new VolunteerEntity { Id = "22222222-2222-2222-2222-222222222222", VolunteerId = "VOL-0003", FullName = "Kavya S.", Email = "kavya@resqnet.org", PhoneNumber = "+94 77 222 3333", Skills = "Translation", Status = "On Task", TotalHours = 72, WeeklyAvailabilityJson = "[\"Tue\",\"Wed\",\"Thu\"]", CreatedAt = DateTime.UtcNow.AddDays(-15) },
                new VolunteerEntity { Id = "33333333-3333-3333-3333-333333333333", VolunteerId = "VOL-0001", FullName = "Ruwan D.", Email = "ruwan@resqnet.org", PhoneNumber = "+94 77 333 4444", Skills = "Logistics", Status = "Available", TotalHours = 95, WeeklyAvailabilityJson = "[\"Mon\",\"Wed\",\"Fri\",\"Sat\",\"Sun\"]", CreatedAt = DateTime.UtcNow.AddDays(-25) },
                new VolunteerEntity { Id = "44444444-4444-4444-4444-444444444444", VolunteerId = "VOL-0004", FullName = "Amal T.", Email = "amal@resqnet.org", PhoneNumber = "+94 77 444 5555", Skills = "Medical", Status = "On Leave", TotalHours = 30, WeeklyAvailabilityJson = "[\"Sat\",\"Sun\"]", CreatedAt = DateTime.UtcNow.AddDays(-10) }
            };
            await context.Volunteers.AddRangeAsync(volunteers);

            // 17. Seed Volunteer Registrations
            var volRegistrations = new List<VolunteerRegistrationEntity>
            {
                new VolunteerRegistrationEntity
                {
                    Id = "vr-1",
                    VolunteerId = "VOL-0001",
                    RegistrationReference = "REG-VOL-1001",
                    FullName = "Ruwan D.",
                    Email = "ruwan@resqnet.org",
                    PhoneNumber = "+94 77 333 4444",
                    Address = "Rivagama Town, Western Province",
                    PreferredLocationsJson = "[\"Western Province\",\"Rivagama Relief Center\"]",
                    PreferredDatesJson = "[\"2026-11-01\",\"2026-11-05\"]",
                    AvailableStartTime = "09:00 AM",
                    AvailableEndTime = "05:00 PM",
                    PreferredDaysOfWeekJson = "[\"Mon\",\"Wed\",\"Fri\",\"Sat\"]",
                    ActivityTypesJson = "[\"Logistics\",\"Meal Distribution\"]",
                    Skills = "Logistics, heavy vehicle driving, inventory sorting",
                    Status = "Approved",
                    TotalHours = 95,
                    CreatedAt = DateTime.UtcNow.AddHours(-72)
                },
                new VolunteerRegistrationEntity
                {
                    Id = "vr-2",
                    VolunteerId = "VOL-0002",
                    RegistrationReference = "REG-VOL-1002",
                    FullName = "Nimal P.",
                    Email = "nimal@resqnet.org",
                    PhoneNumber = "+94 77 111 2222",
                    Address = "Dehiwala, Western Province",
                    PreferredLocationsJson = "[\"Western Province\",\"Colombo Central\"]",
                    PreferredDatesJson = "[\"2026-11-02\",\"2026-11-06\"]",
                    AvailableStartTime = "08:00 AM",
                    AvailableEndTime = "02:00 PM",
                    PreferredDaysOfWeekJson = "[\"Mon\",\"Tue\",\"Wed\",\"Thu\"]",
                    ActivityTypesJson = "[\"First Aid\",\"Meal Distribution\"]",
                    Skills = "First aid certified, defensive driving",
                    Status = "Approved",
                    TotalHours = 48,
                    CreatedAt = DateTime.UtcNow.AddHours(-36)
                },
                new VolunteerRegistrationEntity
                {
                    Id = "vr-3",
                    VolunteerId = "VOL-0003",
                    RegistrationReference = "REG-VOL-1003",
                    FullName = "Kavya S.",
                    Email = "kavya@resqnet.org",
                    PhoneNumber = "+94 77 222 3333",
                    Address = "Bambalapitiya, Colombo",
                    PreferredLocationsJson = "[\"Colombo Central\",\"Shelter Camps\"]",
                    PreferredDatesJson = "[\"2026-11-03\"]",
                    AvailableStartTime = "10:00 AM",
                    AvailableEndTime = "04:00 PM",
                    PreferredDaysOfWeekJson = "[\"Tue\",\"Wed\",\"Thu\"]",
                    ActivityTypesJson = "[\"Translation & Helpdesk\",\"Shelter Management\"]",
                    Skills = "Tamil/Sinhala/English translation, counseling",
                    Status = "Pending Approval",
                    TotalHours = 72,
                    CreatedAt = DateTime.UtcNow.AddHours(-10)
                }
            };
            await context.VolunteerRegistrations.AddRangeAsync(volRegistrations);

            // 18. Seed Volunteer Schedules
            var schedules = new List<VolunteerScheduleEntity>
            {
                new VolunteerScheduleEntity
                {
                    Id = "sch-1",
                    VolunteerId = "VOL-0001",
                    VolunteerName = "Ruwan D.",
                    Date = DateTime.UtcNow.ToString("yyyy-MM-dd"),
                    StartTime = "09:00 AM",
                    EndTime = "12:00 PM",
                    Location = "Rivagama Relief Center",
                    Activity = "Distribute meals - Rivagama",
                    Status = "Approved",
                    CreatedAt = DateTime.UtcNow.AddHours(-24)
                },
                new VolunteerScheduleEntity
                {
                    Id = "sch-2",
                    VolunteerId = "VOL-0002",
                    VolunteerName = "Nimal P.",
                    Date = DateTime.UtcNow.AddDays(1).ToString("yyyy-MM-dd"),
                    StartTime = "08:00 AM",
                    EndTime = "01:00 PM",
                    Location = "Colombo Central Depot",
                    Activity = "First Aid Triage & Water Dispatch",
                    Status = "Confirmed",
                    CreatedAt = DateTime.UtcNow.AddHours(-18)
                }
            };
            await context.VolunteerSchedules.AddRangeAsync(schedules);

            // 19. Seed In-App Notifications
            var inAppNotifications = new List<InAppNotificationEntity>
            {
                new InAppNotificationEntity
                {
                    Id = "notif-1",
                    RecipientRole = "Coordinator",
                    Type = "Donation_Submitted",
                    Title = "New Monetary Donation Pending Verification",
                    Message = "Donor A. Silva (DON-0001) submitted LKR 25,000 via Bank Transfer (Ref: BOC-TXN-882190).",
                    ReferenceId = "REQ-MON-1001",
                    Timestamp = DateTime.UtcNow.AddHours(-4),
                    IsRead = false
                },
                new InAppNotificationEntity
                {
                    Id = "notif-2",
                    RecipientRole = "Officer",
                    RecipientEmail = "relief@orgx.org",
                    Type = "Donation_Approved",
                    Title = "Goods Donation Approved for Handover",
                    Message = "Request REQ-GDS-1001 approved. Please select your handover date between Nov 1 and Nov 7 at Rivagama Relief Center.",
                    ReferenceId = "REQ-GDS-1001",
                    Timestamp = DateTime.UtcNow.AddHours(-12),
                    IsRead = false
                },
                new InAppNotificationEntity
                {
                    Id = "notif-3",
                    RecipientRole = "Coordinator",
                    Type = "Volunteer_Submitted",
                    Title = "New Volunteer Application",
                    Message = "Kavya S. (VOL-0003) submitted volunteer registration for Translation & Helpdesk.",
                    ReferenceId = "REG-VOL-1003",
                    Timestamp = DateTime.UtcNow.AddHours(-10),
                    IsRead = false
                }
            };
            await context.InAppNotifications.AddRangeAsync(inAppNotifications);

            // 20. Seed Notification History
            var notifRecords = new List<NotificationRecordEntity>
            {
                new NotificationRecordEntity
                {
                    Id = "1",
                    Recipient = "volunteers-alert@resqnet.org",
                    Channel = "Email",
                    Subject = "Emergency Dispatch Alert: Flood Relief 2024",
                    Body = "New distribution teams mobilized for Rivagama area.",
                    Status = "Sent",
                    RetryCount = 0,
                    SentAt = DateTime.UtcNow.AddHours(-10)
                }
            };
            await context.NotificationRecords.AddRangeAsync(notifRecords);

            // 21. Seed Demand Forecasts
            var forecasts = new List<DemandForecastEntity>
            {
                new DemandForecastEntity { Id = "fc-1", Region = "Kandyya District", DisasterType = "Monsoon Flood", ResourceCategory = "Emergency Rations", ProjectedQuantity = 15000, Unit = "Meals", Confidence = 0.89, ForecastPeriod = "Next 72 Hours" },
                new DemandForecastEntity { Id = "fc-2", Region = "Kandyya District", DisasterType = "Monsoon Flood", ResourceCategory = "Family Shelters", ProjectedQuantity = 350, Unit = "Tents", Confidence = 0.84, ForecastPeriod = "Next 72 Hours" },
                new DemandForecastEntity { Id = "fc-3", Region = "Kandyya District", DisasterType = "Monsoon Flood", ResourceCategory = "First Aid Trauma Kits", ProjectedQuantity = 800, Unit = "Kits", Confidence = 0.91, ForecastPeriod = "Next 72 Hours" },
                new DemandForecastEntity { Id = "fc-4", Region = "Ratnapura District", DisasterType = "Flash Flood & Landslide", ResourceCategory = "Clean Drinking Water", ProjectedQuantity = 24000, Unit = "Liters", Confidence = 0.93, ForecastPeriod = "Next 48 Hours" }
            };
            await context.DemandForecasts.AddRangeAsync(forecasts);

            await context.SaveChangesAsync();
        }
    }
}
