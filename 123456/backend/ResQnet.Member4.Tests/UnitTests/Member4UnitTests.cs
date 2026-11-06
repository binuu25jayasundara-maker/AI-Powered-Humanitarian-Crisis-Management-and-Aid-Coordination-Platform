using System;
using System.Collections.Generic;
using System.Net.Http;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;
using ResQnet.Member4.Application.DTOs;
using ResQnet.Member4.Application.Strategies;
using ResQnet.Member4.Domain.Entities;
using ResQnet.Member4.Infrastructure.Data;
using ResQnet.Member4.Infrastructure.Services;
using Xunit;

namespace ResQnet.Member4.Tests.UnitTests
{
    public class Member4UnitTests
    {
        private ApplicationDbContext CreateInMemoryDbContext()
        {
            var options = new DbContextOptionsBuilder<ApplicationDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;
            return new ApplicationDbContext(options);
        }

        [Fact]
        public async Task RuleBasedStrategy_GenerateRecommendation_CorrectlyClassifiesDisasterRelief()
        {
            // Arrange
            var strategy = new RuleBasedAiStrategy();
            var details = "Emergency shelter, food, and medical assistance required.";
            var location = "Kandyya, Sri Lanka";
            var evidence = "Photos, news reports, witness statements.";

            // Act
            var rec = await strategy.GenerateRecommendationAsync(details, location, evidence);

            // Assert
            Assert.NotNull(rec);
            Assert.Equal("Disaster Relief", rec.Category);
            Assert.Contains("immediate assistance", rec.Urgency);
            Assert.True(rec.Confidence >= 0.90m);
            Assert.True(rec.PriorityScore >= 80);
            Assert.NotEmpty(rec.Rationale);
        }

        [Fact]
        public async Task RuleBasedStrategy_AnswerChat_ReturnsExpectedKandyyaResponses()
        {
            // Arrange
            var strategy = new RuleBasedAiStrategy();

            // Act
            var response1 = await strategy.AnswerChatAsync("Where is the affected area?", "#2341", "en");
            var response2 = await strategy.AnswerChatAsync("What are the immediate needs?", "#2341", "en");

            // Assert (Exact matching dialogue from Screenshot 9)
            Assert.Contains("Kandyya, Sri Lanka", response1.Reply);
            Assert.Contains("food, clean water, medical aid, and temporary shelter", response2.Reply);
            Assert.True(response1.Confidence >= 0.95m);
        }

        [Fact]
        public async Task RuleBasedStrategy_CheckDuplicate_IdentifiesOverlapCorrectly()
        {
            // Arrange
            var strategy = new RuleBasedAiStrategy();
            var newText = "Kandyya flood relief shelter and food rations";
            var existingText = "Flood (Kandy) request for food rations and family tents";

            // Act
            var dup = await strategy.CheckDuplicateAsync(newText, existingText, "#2187 - Flood (Kandy)");

            // Assert
            Assert.NotNull(dup);
            Assert.Equal("Medium", dup.RiskLevel);
            Assert.Equal("#2187 - Flood (Kandy)", dup.SuspectedDuplicate);
            Assert.True(dup.SimilarityScore > 0.50m);
        }

        [Fact]
        public async Task ExternalLlmStrategy_WithoutApiKey_GracefullyFallsBackToRuleBased()
        {
            // Arrange
            var inMemoryConfig = new Dictionary<string, string?>
            {
                { "AI:ApiKey", "" },
                { "AI:Endpoint", "" }
            };
            var config = new ConfigurationBuilder().AddInMemoryCollection(inMemoryConfig).Build();
            var client = new HttpClient();
            var logger = NullLogger<ExternalLlmAiStrategy>.Instance;
            var strategy = new ExternalLlmAiStrategy(client, config, logger);

            // Act
            var rec = await strategy.GenerateRecommendationAsync("Trapped flood victims need evacuation", "Kandyya", "Drone feed");

            // Assert
            Assert.NotNull(rec);
            Assert.Contains("RuleBasedFallback", rec.ProviderStrategy);
            Assert.True(rec.Confidence > 0);
        }

        [Fact]
        public async Task CaseReviewService_SubmitHumanDecision_CreatesAuditAndUpdatesCaseStatus()
        {
            // Arrange
            using var context = CreateInMemoryDbContext();
            var service = new CaseReviewService(context);

            var caseEntity = new CrisisCase
            {
                CaseNumber = "#2341",
                Title = "Flood, Kandyyva",
                Location = "Kandyya",
                RequestDetails = "Emergency shelter, food, and medical assistance required.",
                Evidence = "Photos",
                Status = "Assessed - awaiting approval"
            };
            await context.CrisisCases.AddAsync(caseEntity);
            await context.SaveChangesAsync();

            // Act
            var decision = new HumanDecisionRequest
            {
                Action = "Approve",
                ReviewerEmail = "coordinator@resqnet.org",
                Justification = "Validated by field officer Chaminda Silva"
            };
            var result = await service.SubmitHumanDecisionAsync("#2341", decision);

            // Assert
            Assert.True(result);
            var updated = await service.GetCaseByNumberAsync("#2341");
            Assert.NotNull(updated);
            Assert.Equal("Approved", updated.Status);

            var auditCount = await context.HumanDecisionAudits.CountAsync();
            Assert.Equal(1, auditCount);
            var audit = await context.HumanDecisionAudits.FirstAsync();
            Assert.Equal("Approve", audit.ActionTaken);
            Assert.Equal("coordinator@resqnet.org", audit.ReviewerEmail);
        }
    }
}
