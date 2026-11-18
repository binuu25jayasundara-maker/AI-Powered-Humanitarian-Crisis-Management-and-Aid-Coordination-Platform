using System;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using ResQnet.Member4.Domain.Entities;

namespace ResQnet.Member4.Infrastructure.Data
{
    public static class DbInitializer
    {
        public static async Task SeedAsync(ApplicationDbContext context)
        {
            if (await context.CrisisCases.AnyAsync())
            {
                return;
            }

            var case2341 = new CrisisCase
            {
                Id = Guid.Parse("12345678-2341-2341-2341-123456789abc"),
                CaseNumber = "#2341",
                Title = "Flood, Kandyyva",
                Location = "Kandyya, Central Province, Sri Lanka",
                RequestDetails = "Emergency shelter, food, and medical assistance required.",
                Evidence = "Photos, news reports, witness statements.",
                Status = "Assessed - awaiting approval",
                AssignedAgency = "DMC-LK"
            };

            var case2187 = new CrisisCase
            {
                Id = Guid.Parse("12345678-2187-2187-2187-123456789abc"),
                CaseNumber = "#2187",
                Title = "Flood (Kandy)",
                Location = "Kandy Municipal Area",
                RequestDetails = "Request for food rations and family tents following river overflow.",
                Evidence = "Local authority field verification report.",
                Status = "Approved",
                AssignedAgency = "SLRC"
            };

            await context.CrisisCases.AddRangeAsync(case2341, case2187);

            var rec2341 = new AiRecommendation
            {
                Id = Guid.NewGuid(),
                CaseId = case2341.Id,
                Category = "Disaster Relief",
                Urgency = "High - immediate assistance needed.",
                ViewRecommendation = "Provide shelter, food supplies, medical aid.",
                SuggestAction = "Coordinate with local authorities and NGOs.",
                PriorityScore = 88,
                Confidence = 0.94m,
                Rationale = "NLP multi-factor scoring classified as Disaster Relief based on compound terms (flood, shelter, medical). High urgency triggered due to vulnerable displaced family count and road closures.",
                ProviderStrategy = "RuleBasedStrategy"
            };

            await context.AiRecommendations.AddAsync(rec2341);

            var dupRecord = new DuplicateDetectionRecord
            {
                Id = Guid.NewGuid(),
                PrimaryCaseId = case2341.Id,
                SuspectedDuplicateNumber = "#2187 - Flood (Kandy)",
                SimilarityScore = 0.74m,
                RiskLevel = "Medium",
                Rationale = "High semantic and geographical overlap with #2187. Both cases request food and shelter aid within Kandy flood operational sector."
            };

            await context.DuplicateRecords.AddAsync(dupRecord);

            var forecasts = new[]
            {
                new DemandForecast { Id = Guid.NewGuid(), Region = "Kandyya District", DisasterType = "Monsoon Flood", ResourceCategory = "Emergency Rations", ProjectedQuantity = 15000, Unit = "Meals", Confidence = 0.89m, ForecastPeriod = "Next 72 Hours" },
                new DemandForecast { Id = Guid.NewGuid(), Region = "Kandyya District", DisasterType = "Monsoon Flood", ResourceCategory = "Family Shelters", ProjectedQuantity = 350, Unit = "Tents", Confidence = 0.84m, ForecastPeriod = "Next 72 Hours" },
                new DemandForecast { Id = Guid.NewGuid(), Region = "Kandyya District", DisasterType = "Monsoon Flood", ResourceCategory = "First Aid Trauma Kits", ProjectedQuantity = 800, Unit = "Kits", Confidence = 0.91m, ForecastPeriod = "Next 72 Hours" }
            };

            await context.DemandForecasts.AddRangeAsync(forecasts);
            await context.SaveChangesAsync();
        }
    }
}
