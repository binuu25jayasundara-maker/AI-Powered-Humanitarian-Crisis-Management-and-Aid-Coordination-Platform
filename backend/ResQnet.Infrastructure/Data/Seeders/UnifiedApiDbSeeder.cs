using ResQnet.Infrastructure.Data;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using ResQnet.UnifiedApi.Models;

namespace ResQnet.UnifiedApi.Data
{
    public static class CoreDbSeeder
    {
        public static async Task SeedAsync(ResQnetDbContext context)
        {
            if (await context.CrisisEvents.AnyAsync())
            {
                return;
            }

            var floodId = Guid.Parse("11111111-0001-0000-0000-000000000000");
            var slideId = Guid.Parse("11111111-0002-0000-0000-000000000000");
            var droughtId = Guid.Parse("11111111-0003-0000-0000-000000000000");

            var events = new List<CrisisEvent>
            {
                new CrisisEvent
                {
                    Id = floodId,
                    Name = "Kelani River Flood 2026",
                    Type = "Flood",
                    Severity = EventSeverity.Critical,
                    Status = EventStatus.Active,
                    Description = "Severe flooding along the Kelani River basin following sustained monsoon rainfall.",
                    StartedAt = DateTime.UtcNow.AddHours(-52),
                    Areas = new List<OperationalArea>
                    {
                        new OperationalArea { Id = Guid.NewGuid(), CrisisEventId = floodId, Name = "Kolonnawa", District = "Colombo", PopulationAtRisk = 18000, Status = AreaStatus.Affected },
                        new OperationalArea { Id = Guid.NewGuid(), CrisisEventId = floodId, Name = "Hanwella", District = "Colombo", PopulationAtRisk = 9500, Status = AreaStatus.Responding },
                        new OperationalArea { Id = Guid.NewGuid(), CrisisEventId = floodId, Name = "Biyagama", District = "Gampaha", PopulationAtRisk = 7200, Status = AreaStatus.Responding }
                    }
                },
                new CrisisEvent
                {
                    Id = slideId,
                    Name = "Ratnapura Landslide Alert",
                    Type = "Landslide",
                    Severity = EventSeverity.High,
                    Status = EventStatus.Monitoring,
                    Description = "Landslide in Kuruwita area with ongoing risk of further slope failure.",
                    StartedAt = DateTime.UtcNow.AddHours(-20),
                    Areas = new List<OperationalArea>
                    {
                        new OperationalArea { Id = Guid.NewGuid(), CrisisEventId = slideId, Name = "Kuruwita", District = "Ratnapura", PopulationAtRisk = 3400, Status = AreaStatus.Stabilised }
                    }
                },
                new CrisisEvent
                {
                    Id = droughtId,
                    Name = "Hambantota Drought Response",
                    Type = "Drought",
                    Severity = EventSeverity.Moderate,
                    Status = EventStatus.Planned,
                    Description = "Preparedness plan for forecast water scarcity in the southern dry zone.",
                    StartedAt = DateTime.UtcNow.AddHours(72),
                    Areas = new List<OperationalArea>()
                }
            };

            await context.CrisisEvents.AddRangeAsync(events);

            var citizenEmail = "citizen@resqnet.org";
            var coordinatorEmail = "coordinator@resqnet.org";
            var caseManagerEmail = "casemanager@resqnet.org";

            var req1Id = Guid.Parse("22222222-0001-0000-0000-000000000000");
            var req2Id = Guid.Parse("22222222-0002-0000-0000-000000000000");
            var req3Id = Guid.Parse("22222222-0003-0000-0000-000000000000");

            var requests = new List<AssistanceRequest>
            {
                new AssistanceRequest
                {
                    Id = req1Id,
                    Reference = "REQ-2026-00001",
                    SequenceNumber = 1,
                    CitizenEmail = citizenEmail,
                    Category = "Food & Water",
                    Urgency = "High",
                    Description = "Family of 5 without drinking water since yesterday.",
                    LocationText = "Rivagama, Western Province",
                    Latitude = 6.9215,
                    Longitude = 79.9140,
                    ContactPhone = "+94 77 123 4501",
                    HouseholdSize = 5,
                    Status = AssistanceRequestStatus.InProgress,
                    CreatedAt = DateTime.UtcNow.AddHours(-12),
                    UpdatedAt = DateTime.UtcNow.AddHours(-2)
                },
                new AssistanceRequest
                {
                    Id = req2Id,
                    Reference = "REQ-2026-00002",
                    SequenceNumber = 2,
                    CitizenEmail = citizenEmail,
                    Category = "Medical",
                    Urgency = "Medium",
                    Description = "Need blood pressure medicine for an elderly person.",
                    LocationText = "Peradeniya Road, Kandy",
                    Latitude = 7.2750,
                    Longitude = 80.6050,
                    ContactPhone = "+94 77 123 4502",
                    HouseholdSize = 2,
                    Status = AssistanceRequestStatus.Fulfilled,
                    CreatedAt = DateTime.UtcNow.AddHours(-36),
                    UpdatedAt = DateTime.UtcNow.AddHours(-6)
                },
                new AssistanceRequest
                {
                    Id = req3Id,
                    Reference = "REQ-2026-00003",
                    SequenceNumber = 3,
                    CitizenEmail = citizenEmail,
                    Category = "Shelter",
                    Urgency = "High",
                    Description = "House damaged by floodwater, temporary shelter needed.",
                    LocationText = "Biyagama South, Gampaha District",
                    Latitude = 6.9421,
                    Longitude = 79.9482,
                    ContactPhone = "+94 77 123 4503",
                    HouseholdSize = 4,
                    Status = AssistanceRequestStatus.UnderReview,
                    CreatedAt = DateTime.UtcNow.AddHours(-4),
                    UpdatedAt = DateTime.UtcNow.AddHours(-3)
                }
            };

            await context.AssistanceRequests.AddRangeAsync(requests);

            var histories = new List<RequestStatusHistory>
            {
                // Req 1
                new RequestStatusHistory { Id = Guid.NewGuid(), RequestId = req1Id, OldStatus = AssistanceRequestStatus.Submitted, NewStatus = AssistanceRequestStatus.Submitted, ChangedByEmail = citizenEmail, Note = "Request submitted by citizen", Timestamp = DateTime.UtcNow.AddHours(-12) },
                new RequestStatusHistory { Id = Guid.NewGuid(), RequestId = req1Id, OldStatus = AssistanceRequestStatus.Submitted, NewStatus = AssistanceRequestStatus.UnderReview, ChangedByEmail = caseManagerEmail, Note = "Initial intake review", Timestamp = DateTime.UtcNow.AddHours(-10) },
                new RequestStatusHistory { Id = Guid.NewGuid(), RequestId = req1Id, OldStatus = AssistanceRequestStatus.UnderReview, NewStatus = AssistanceRequestStatus.Verified, ChangedByEmail = caseManagerEmail, Note = "Caller confirmed needs", Timestamp = DateTime.UtcNow.AddHours(-8) },
                new RequestStatusHistory { Id = Guid.NewGuid(), RequestId = req1Id, OldStatus = AssistanceRequestStatus.Verified, NewStatus = AssistanceRequestStatus.Prioritised, ChangedByEmail = coordinatorEmail, Note = "High flood priority", Timestamp = DateTime.UtcNow.AddHours(-6) },
                new RequestStatusHistory { Id = Guid.NewGuid(), RequestId = req1Id, OldStatus = AssistanceRequestStatus.Prioritised, NewStatus = AssistanceRequestStatus.Assigned, ChangedByEmail = coordinatorEmail, Note = "Assigned to water dispatch team", Timestamp = DateTime.UtcNow.AddHours(-4) },
                new RequestStatusHistory { Id = Guid.NewGuid(), RequestId = req1Id, OldStatus = AssistanceRequestStatus.Assigned, NewStatus = AssistanceRequestStatus.InProgress, ChangedByEmail = coordinatorEmail, Note = "Relief bowser en route", Timestamp = DateTime.UtcNow.AddHours(-2) },

                // Req 2
                new RequestStatusHistory { Id = Guid.NewGuid(), RequestId = req2Id, OldStatus = AssistanceRequestStatus.Submitted, NewStatus = AssistanceRequestStatus.Submitted, ChangedByEmail = citizenEmail, Note = "Request submitted by citizen", Timestamp = DateTime.UtcNow.AddHours(-36) },
                new RequestStatusHistory { Id = Guid.NewGuid(), RequestId = req2Id, OldStatus = AssistanceRequestStatus.Submitted, NewStatus = AssistanceRequestStatus.UnderReview, ChangedByEmail = caseManagerEmail, Timestamp = DateTime.UtcNow.AddHours(-30) },
                new RequestStatusHistory { Id = Guid.NewGuid(), RequestId = req2Id, OldStatus = AssistanceRequestStatus.UnderReview, NewStatus = AssistanceRequestStatus.Verified, ChangedByEmail = caseManagerEmail, Timestamp = DateTime.UtcNow.AddHours(-24) },
                new RequestStatusHistory { Id = Guid.NewGuid(), RequestId = req2Id, OldStatus = AssistanceRequestStatus.Verified, NewStatus = AssistanceRequestStatus.Prioritised, ChangedByEmail = coordinatorEmail, Timestamp = DateTime.UtcNow.AddHours(-20) },
                new RequestStatusHistory { Id = Guid.NewGuid(), RequestId = req2Id, OldStatus = AssistanceRequestStatus.Prioritised, NewStatus = AssistanceRequestStatus.Assigned, ChangedByEmail = coordinatorEmail, Timestamp = DateTime.UtcNow.AddHours(-16) },
                new RequestStatusHistory { Id = Guid.NewGuid(), RequestId = req2Id, OldStatus = AssistanceRequestStatus.Assigned, NewStatus = AssistanceRequestStatus.InProgress, ChangedByEmail = coordinatorEmail, Timestamp = DateTime.UtcNow.AddHours(-10) },
                new RequestStatusHistory { Id = Guid.NewGuid(), RequestId = req2Id, OldStatus = AssistanceRequestStatus.InProgress, NewStatus = AssistanceRequestStatus.Fulfilled, ChangedByEmail = caseManagerEmail, Note = "Medication handed over to resident", Timestamp = DateTime.UtcNow.AddHours(-6) },

                // Req 3
                new RequestStatusHistory { Id = Guid.NewGuid(), RequestId = req3Id, OldStatus = AssistanceRequestStatus.Submitted, NewStatus = AssistanceRequestStatus.Submitted, ChangedByEmail = citizenEmail, Note = "Request submitted by citizen", Timestamp = DateTime.UtcNow.AddHours(-4) },
                new RequestStatusHistory { Id = Guid.NewGuid(), RequestId = req3Id, OldStatus = AssistanceRequestStatus.Submitted, NewStatus = AssistanceRequestStatus.UnderReview, ChangedByEmail = caseManagerEmail, Note = "Shelter capacity check in progress", Timestamp = DateTime.UtcNow.AddHours(-3) }
            };

            await context.RequestStatusHistories.AddRangeAsync(histories);
            await context.SaveChangesAsync();
        }
    }
}