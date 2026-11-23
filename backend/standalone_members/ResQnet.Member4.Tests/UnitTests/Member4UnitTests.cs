using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;
using ResQnet.Member4.Api.Controllers;
using ResQnet.Member4.Application.Common;
using ResQnet.Member4.Application.DTOs;
using ResQnet.Member4.Application.Interfaces;
using ResQnet.Member4.Application.Strategies;
using ResQnet.Member4.Domain.Entities;
using ResQnet.Member4.Infrastructure.Data;
using ResQnet.Member4.Infrastructure.Services;
using Xunit;

namespace ResQnet.Member4.Tests.UnitTests
{
    public class FakeHttpMessageHandler : HttpMessageHandler
    {
        private readonly Func<HttpRequestMessage, CancellationToken, Task<HttpResponseMessage>> _handler;

        public FakeHttpMessageHandler(Func<HttpRequestMessage, CancellationToken, Task<HttpResponseMessage>> handler)
        {
            _handler = handler;
        }

        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
        {
            return _handler(request, cancellationToken);
        }
    }

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
            // Arrange: keeping the exact old sample texts as requested by user
            var strategy = new RuleBasedAiStrategy();
            var newText = "Kandyya flood relief shelter and food rations";
            var existingText = "Flood (Kandy) request for food rations and family tents";

            // Act
            var dup = await strategy.CheckDuplicateAsync(newText, existingText, "#2187 - Flood (Kandy)");

            // Assert: real computed Jaccard score without hardcoded 0.74 or "kandy" special-casing
            Assert.NotNull(dup);
            Assert.Equal("Low", dup.RiskLevel);
            Assert.Equal("#2187 - Flood (Kandy)", dup.SuspectedDuplicate);
            Assert.InRange(dup.SimilarityScore, 0.28m, 0.35m);
        }

        [Fact]
        public async Task RuleBasedStrategy_CheckDuplicate_HighSimilarity_ReturnsHighRisk()
        {
            // Arrange
            var strategy = new RuleBasedAiStrategy();
            var text1 = "Flash flood emergency evacuation required immediately for trapped residents on rooftop";
            var text2 = "Flash flood emergency evacuation required immediately for trapped family on rooftop";

            // Act
            var dup = await strategy.CheckDuplicateAsync(text1, text2, "#2001");

            // Assert
            Assert.NotNull(dup);
            Assert.Equal("High", dup.RiskLevel);
            Assert.True(dup.SimilarityScore >= 0.70m);
        }

        [Fact]
        public async Task RuleBasedStrategy_CheckDuplicate_MediumSimilarity_ReturnsMediumRisk()
        {
            // Arrange
            var strategy = new RuleBasedAiStrategy();
            var text1 = "Urgent medical supplies doctor antibiotics bandages required";
            var text2 = "Urgent medical supplies doctor insulin trauma kits required";

            // Act
            var dup = await strategy.CheckDuplicateAsync(text1, text2, "#2002");

            // Assert
            Assert.NotNull(dup);
            Assert.Equal("Medium", dup.RiskLevel);
            Assert.InRange(dup.SimilarityScore, 0.45m, 0.69m);
        }

        [Fact]
        public async Task RuleBasedStrategy_CheckDuplicate_LowOverlap_ReturnsNull()
        {
            // Arrange
            var strategy = new RuleBasedAiStrategy();
            var text1 = "Shelter blankets required for displaced refugees";
            var text2 = "Medical surgery blood transfusion urgently needed at hospital";

            // Act
            var dup = await strategy.CheckDuplicateAsync(text1, text2, "#2003");

            // Assert
            Assert.Null(dup);
        }

        [Fact]
        public async Task DuplicateService_CheckDuplicateAgainstCases_IdenticalTextTwice_FlaggedAsDuplicate()
        {
            // Arrange
            using var context = CreateInMemoryDbContext();
            var dupService = new DuplicateService(context);

            var existingCase = new CrisisCase
            {
                CaseNumber = "#2100",
                Title = "Disaster Relief, Kelaniya",
                Location = "Kelaniya",
                RequestDetails = "Drinking water and emergency food rations required for stranded community",
                Status = "Approved",
                CreatedAt = DateTime.UtcNow.AddHours(-2)
            };
            await context.CrisisCases.AddAsync(existingCase);
            await context.SaveChangesAsync();

            // Act: same text submitted twice
            var duplicateResult = await dupService.CheckDuplicateAgainstCasesAsync(
                "Drinking water and emergency food rations required for stranded community",
                "Kelaniya",
                DateTime.UtcNow);

            // Assert
            Assert.NotNull(duplicateResult);
            Assert.Equal("#2100", duplicateResult.SuspectedDuplicate);
            Assert.Equal("High", duplicateResult.RiskLevel);
            Assert.True(duplicateResult.SimilarityScore >= 0.85m);
        }

        [Fact]
        public async Task DuplicateService_CheckDuplicateAgainstCases_ExcludesSelf()
        {
            // Arrange
            using var context = CreateInMemoryDbContext();
            var dupService = new DuplicateService(context);

            var existingCase = new CrisisCase
            {
                CaseNumber = "#2100",
                Title = "Disaster Relief, Kelaniya",
                Location = "Kelaniya",
                RequestDetails = "Drinking water and emergency food rations required for stranded community",
                Status = "Approved",
                CreatedAt = DateTime.UtcNow
            };
            await context.CrisisCases.AddAsync(existingCase);
            await context.SaveChangesAsync();

            // Act: checking with excludeCaseNumber = "#2100"
            var duplicateResult = await dupService.CheckDuplicateAgainstCasesAsync(
                "Drinking water and emergency food rations required for stranded community",
                "Kelaniya",
                DateTime.UtcNow,
                excludeCaseNumber: "#2100");

            // Assert
            Assert.Null(duplicateResult);
        }

        [Fact]
        public async Task RuleBasedStrategy_Confidence_DynamicAndClampedBetweenBounds()
        {
            // Arrange
            var strategy = new RuleBasedAiStrategy();

            // Act 1: Text with zero recognized keywords -> base confidence clamped at 0.40m
            var lowRec = await strategy.GenerateRecommendationAsync("General notice about logistics meeting tomorrow.", "Colombo", "None");

            // Act 2: Text with multiple strong keywords -> high confidence clamped at max 0.95m
            var highRec = await strategy.GenerateRecommendationAsync(
                "Critical emergency! People trapped in rising flood water, urgent shelter and medical doctor needed immediately",
                "Galle",
                "Verified video drone footage");

            // Assert
            Assert.Equal(0.40m, lowRec.Confidence);
            Assert.Contains("Matched keywords:", lowRec.Rationale);

            Assert.True(highRec.Confidence >= 0.90m && highRec.Confidence <= 0.95m);
            Assert.Contains("Matched keywords:", highRec.Rationale);
            Assert.Contains("trapped", highRec.Rationale);
        }

        [Fact]
        public async Task CasesController_CreateCase_Validation_Returns400OnInvalidInput()
        {
            // Arrange
            using var context = CreateInMemoryDbContext();
            var caseService = new CaseReviewService(context);
            var controller = new CasesController(caseService);

            // Act 1: Description too short (<10 chars)
            var badDescResult = await controller.CreateCase(new CreateCaseRequest
            {
                Description = "Short",
                Location = "Colombo",
                Category = "Disaster Relief"
            });

            // Act 2: Missing location
            var badLocResult = await controller.CreateCase(new CreateCaseRequest
            {
                Description = "Sufficient description for emergency request",
                Location = "",
                Category = "Disaster Relief"
            });

            // Act 3: Invalid category
            var badCatResult = await controller.CreateCase(new CreateCaseRequest
            {
                Description = "Sufficient description for emergency request",
                Location = "Colombo",
                Category = "InvalidCategoryName"
            });

            // Assert
            Assert.IsType<BadRequestObjectResult>(badDescResult.Result);
            Assert.IsType<BadRequestObjectResult>(badLocResult.Result);
            Assert.IsType<BadRequestObjectResult>(badCatResult.Result);
        }

        [Fact]
        public async Task CasesController_CreateCase_ValidInput_CreatesCaseAndRecommendation()
        {
            // Arrange
            using var context = CreateInMemoryDbContext();
            // Seed a case with #2341
            await context.CrisisCases.AddAsync(new CrisisCase
            {
                CaseNumber = "#2341",
                Title = "Flood, Kandyya",
                Location = "Kandyya",
                RequestDetails = "Initial flood seed case",
                Status = "Approved"
            });
            await context.SaveChangesAsync();

            var caseService = new CaseReviewService(context);
            var controller = new CasesController(caseService);

            // Act
            var createResult = await controller.CreateCase(new CreateCaseRequest
            {
                Description = "Urgent medical supplies and shelter required for flood survivors",
                Location = "Ratnapura",
                Category = "Emergency Medical"
            });

            // Assert
            var created = Assert.IsType<CreatedAtActionResult>(createResult.Result);
            Assert.NotNull(created.Value);
            var apiResponse = Assert.IsType<ApiResponse<AiRecommendationDto>>(created.Value);
            Assert.True(apiResponse.Success);
            Assert.NotNull(apiResponse.Data);
            Assert.Equal("#2342", created.RouteValues?["caseNumber"]);

            var savedCase = await context.CrisisCases.Include(c => c.Recommendation).FirstOrDefaultAsync(c => c.CaseNumber == "#2342");
            Assert.NotNull(savedCase);
            Assert.Equal("Ratnapura", savedCase.Location);
            Assert.NotNull(savedCase.Recommendation);
        }

        [Fact]
        public async Task AiServicesController_GetOverrideMetrics_ComputesCorrectRatesExcludingDefer()
        {
            // Arrange
            using var context = CreateInMemoryDbContext();
            var caseService = new CaseReviewService(context);

            var c1 = new CrisisCase { CaseNumber = "#1", Title = "C1", Location = "L1", RequestDetails = "D1" };
            var r1 = new AiRecommendation { CaseId = c1.Id, Case = c1, Category = "Disaster Relief" };
            c1.Recommendation = r1;

            var c2 = new CrisisCase { CaseNumber = "#2", Title = "C2", Location = "L2", RequestDetails = "D2" };
            var r2 = new AiRecommendation { CaseId = c2.Id, Case = c2, Category = "Emergency Medical" };
            c2.Recommendation = r2;

            await context.CrisisCases.AddRangeAsync(c1, c2);
            await context.AiRecommendations.AddRangeAsync(r1, r2);

            // Add audits:
            // Disaster Relief: 1 Approve, 1 Modify, 1 Defer
            // Decisions = Approve (1) + Modify (1) = 2. Defer is reported separately (1). Overridden = 1. Override% = 50%
            // Emergency Medical: 1 Reject. Decisions = 1. Overridden = 1. Override% = 100%
            // Overall: Total decisions = 3. Overridden = 2. Override% = 66.67%. Deferred = 1.
            var audits = new[]
            {
                new HumanDecisionAudit { CaseId = c1.Id, Case = c1, ActionTaken = "Approve", ReviewerEmail = "rev1@test.com" },
                new HumanDecisionAudit { CaseId = c1.Id, Case = c1, ActionTaken = "Modify", ReviewerEmail = "rev2@test.com" },
                new HumanDecisionAudit { CaseId = c1.Id, Case = c1, ActionTaken = "Defer", ReviewerEmail = "rev3@test.com" },
                new HumanDecisionAudit { CaseId = c2.Id, Case = c2, ActionTaken = "Reject", ReviewerEmail = "rev4@test.com" }
            };
            await context.HumanDecisionAudits.AddRangeAsync(audits);
            await context.SaveChangesAsync();

            var controller = new AiServicesController(
                new AiAssistantService(new AiGateway(new[] { new RuleBasedAiStrategy() })),
                new ForecastingService(context),
                new AiGateway(new[] { new RuleBasedAiStrategy() }));

            // Act
            var actionResult = await controller.GetOverrideMetrics(caseService);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(actionResult.Result);
            var apiResponse = Assert.IsType<ApiResponse<OverrideMetricsDto>>(okResult.Value);
            Assert.True(apiResponse.Success);
            var metrics = apiResponse.Data;
            Assert.NotNull(metrics);

            Assert.Equal(3, metrics.TotalDecisions);
            Assert.Equal(2, metrics.ModifiedOrRejectedCount);
            Assert.Equal(1, metrics.DeferredDecisions);
            Assert.Equal(66.67m, metrics.OverridePercentage);

            Assert.True(metrics.ByCategory.ContainsKey("Disaster Relief"));
            Assert.Equal(2, metrics.ByCategory["Disaster Relief"].TotalDecisions);
            Assert.Equal(1, metrics.ByCategory["Disaster Relief"].ModifiedOrRejectedCount);
            Assert.Equal(1, metrics.ByCategory["Disaster Relief"].DeferredDecisions);
            Assert.Equal(50.00m, metrics.ByCategory["Disaster Relief"].OverridePercentage);

            Assert.True(metrics.ByCategory.ContainsKey("Emergency Medical"));
            Assert.Equal(1, metrics.ByCategory["Emergency Medical"].TotalDecisions);
            Assert.Equal(1, metrics.ByCategory["Emergency Medical"].ModifiedOrRejectedCount);
            Assert.Equal(0, metrics.ByCategory["Emergency Medical"].DeferredDecisions);
            Assert.Equal(100.00m, metrics.ByCategory["Emergency Medical"].OverridePercentage);
        }

        [Fact]
        public async Task CaseReviewService_SubmitHumanDecision_SerializesDtoWithoutCircularReference()
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
            var recEntity = new AiRecommendation
            {
                Id = Guid.NewGuid(),
                CaseId = caseEntity.Id,
                Case = caseEntity, // Circular reference on entity navigation property
                Category = "Disaster Relief",
                Urgency = "High"
            };
            caseEntity.Recommendation = recEntity;

            await context.CrisisCases.AddAsync(caseEntity);
            await context.AiRecommendations.AddAsync(recEntity);
            await context.SaveChangesAsync();

            // Act: Submit decision should NOT throw System.Text.Json circular reference exception
            var decision = new HumanDecisionRequest
            {
                Action = "Approve",
                ReviewerEmail = "coordinator@resqnet.org",
                Justification = "Validated by coordinator"
            };
            var success = await service.SubmitHumanDecisionAsync("#2341", decision);

            // Assert
            Assert.True(success);
            var audit = await context.HumanDecisionAudits.FirstAsync();
            Assert.NotNull(audit.OriginalRecommendationJson);
            // Verify serialized JSON parses cleanly
            using var doc = JsonDocument.Parse(audit.OriginalRecommendationJson);
            var categoryProp = doc.RootElement.TryGetProperty("Category", out var p1) ? p1 : doc.RootElement.GetProperty("category");
            Assert.Equal("Disaster Relief", categoryProp.GetString());
        }

        [Fact]
        public async Task ExternalLlmStrategy_WithoutApiKey_SimulatedWithoutNetworkCall()
        {
            // Arrange
            var inMemoryConfig = new Dictionary<string, string?>
            {
                { "AI:ApiKey", "" },
                { "AI:Endpoint", "https://api.openai.com/v1/chat/completions" }
            };
            var config = new ConfigurationBuilder().AddInMemoryCollection(inMemoryConfig).Build();

            // Handler should throw if called over network
            var handler = new FakeHttpMessageHandler((req, ct) => throw new InvalidOperationException("Network must not be called when API key is missing."));
            var client = new HttpClient(handler);
            var strategy = new ExternalLlmAiStrategy(client, config, NullLogger<ExternalLlmAiStrategy>.Instance);

            // Act
            var rec = await strategy.GenerateRecommendationAsync("Trapped flood victims need evacuation", "Kandyya", "Drone feed");

            // Assert
            Assert.NotNull(rec);
            Assert.Equal("simulated", rec.ProviderStrategy);
            Assert.True(rec.Confidence > 0);
        }

        [Fact]
        public async Task ExternalLlmStrategy_Timeout_FallsBackToRuleBased()
        {
            // Arrange
            var inMemoryConfig = new Dictionary<string, string?>
            {
                { "AI:ApiKey", "test-key-123" },
                { "AI:Endpoint", "https://api.openai.com/v1/chat/completions" },
                { "AI:TimeoutSeconds", "1" }
            };
            var config = new ConfigurationBuilder().AddInMemoryCollection(inMemoryConfig).Build();

            var handler = new FakeHttpMessageHandler((req, ct) => throw new TaskCanceledException("Request timed out."));
            var client = new HttpClient(handler);
            var strategy = new ExternalLlmAiStrategy(client, config, NullLogger<ExternalLlmAiStrategy>.Instance);

            // Act
            var rec = await strategy.GenerateRecommendationAsync("Trapped flood victims need evacuation", "Kandyya", "Drone feed");

            // Assert
            Assert.NotNull(rec);
            Assert.Equal("rule-based (fallback)", rec.ProviderStrategy);
            Assert.True(rec.Confidence > 0);
        }

        [Fact]
        public async Task ExternalLlmStrategy_Http500_FallsBackToRuleBased()
        {
            // Arrange
            var inMemoryConfig = new Dictionary<string, string?>
            {
                { "AI:ApiKey", "test-key-123" },
                { "AI:Endpoint", "https://api.openai.com/v1/chat/completions" }
            };
            var config = new ConfigurationBuilder().AddInMemoryCollection(inMemoryConfig).Build();

            var handler = new FakeHttpMessageHandler((req, ct) =>
                Task.FromResult(new HttpResponseMessage(HttpStatusCode.InternalServerError)));
            var client = new HttpClient(handler);
            var strategy = new ExternalLlmAiStrategy(client, config, NullLogger<ExternalLlmAiStrategy>.Instance);

            // Act
            var rec = await strategy.GenerateRecommendationAsync("Trapped flood victims need evacuation", "Kandyya", "Drone feed");

            // Assert
            Assert.NotNull(rec);
            Assert.Equal("rule-based (fallback)", rec.ProviderStrategy);
            Assert.True(rec.Confidence > 0);
        }

        [Fact]
        public async Task ExternalLlmStrategy_MasksPiiBeforeSending()
        {
            // Arrange
            string sentPayload = string.Empty;
            var inMemoryConfig = new Dictionary<string, string?>
            {
                { "AI:ApiKey", "test-key-123" },
                { "AI:Endpoint", "https://api.openai.com/v1/chat/completions" }
            };
            var config = new ConfigurationBuilder().AddInMemoryCollection(inMemoryConfig).Build();

            var fakeResponse = new
            {
                choices = new[]
                {
                    new
                    {
                        message = new
                        {
                            content = "{\"category\":\"Disaster Relief\",\"urgency\":\"High\",\"view\":\"View\",\"suggest\":\"Suggest\",\"priorityScore\":90,\"confidence\":0.9,\"rationale\":\"OK\"}"
                        }
                    }
                }
            };

            var handler = new FakeHttpMessageHandler(async (req, ct) =>
            {
                sentPayload = await req.Content!.ReadAsStringAsync(ct);
                return new HttpResponseMessage(HttpStatusCode.OK)
                {
                    Content = new StringContent(JsonSerializer.Serialize(fakeResponse))
                };
            });

            var client = new HttpClient(handler);
            var strategy = new ExternalLlmAiStrategy(client, config, NullLogger<ExternalLlmAiStrategy>.Instance);

            // Act
            var rec = await strategy.GenerateRecommendationAsync(
                "Contact coordinator chaminda@resqnet.lk or phone +94 77 123 4567 for rescue",
                "Colombo",
                "Reporter: civilian@domain.com, 071-9876543");

            // Assert
            Assert.NotNull(rec);
            Assert.DoesNotContain("chaminda@resqnet.lk", sentPayload);
            Assert.DoesNotContain("+94 77 123 4567", sentPayload);
            Assert.DoesNotContain("civilian@domain.com", sentPayload);
            Assert.DoesNotContain("071-9876543", sentPayload);
            Assert.Contains("[REDACTED_EMAIL]", sentPayload);
            Assert.Contains("[REDACTED_PHONE]", sentPayload);
        }
    }
}
