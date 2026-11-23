using System.Collections.Generic;
using System.Net.Http;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;
using Xunit;
using ResQnet.Member4.Application.Strategies;

namespace ResQnet.Tests
{
    /// <summary>
    /// Verifies the graceful fallback behaviour of the external AI strategy.
    /// </summary>
    public class AiFallbackUnitTests
    {
        private static ExternalLlmAiStrategy BuildStrategy(string apiKey, string endpoint)
        {
            var configuration = new ConfigurationBuilder()
                .AddInMemoryCollection(new Dictionary<string, string?>
                {
                    { "AI:ApiKey", apiKey },
                    { "AI:Endpoint", endpoint },
                    { "AI:Model", "gpt-4o-mini" },
                    { "AI:TimeoutSeconds", "4" }
                })
                .Build();

            return new ExternalLlmAiStrategy(
                new HttpClient(),
                configuration,
                NullLogger<ExternalLlmAiStrategy>.Instance);
        }

        [Fact]
        public async Task ExternalAi_WithNoApiKey_FallsBackToSimulated()
        {
            var strategy = BuildStrategy(string.Empty, "https://api.openai.com/v1/chat/completions");

            var result = await strategy.GenerateRecommendationAsync(
                "Family trapped by rising flood water in Kandy",
                "Kandy, Sri Lanka",
                "photo evidence");

            Assert.Equal("simulated", result.ProviderStrategy);
            Assert.False(string.IsNullOrWhiteSpace(result.Category));
            Assert.False(string.IsNullOrWhiteSpace(result.Rationale));
            Assert.InRange(result.PriorityScore, 1, 100);
            Assert.InRange(result.Confidence, 0.40m, 0.95m);
        }

        [Fact]
        public async Task ExternalAi_WithApiKeyButNoEndpoint_FallsBackToRuleBased()
        {
            var strategy = BuildStrategy("sk-test-key", string.Empty);

            var result = await strategy.GenerateRecommendationAsync(
                "Shelter and food required for displaced families",
                "Galle, Sri Lanka",
                string.Empty);

            Assert.Equal("rule-based (fallback)", result.ProviderStrategy);
            Assert.False(string.IsNullOrWhiteSpace(result.Category));
        }

        [Fact]
        public void MaskPii_RedactsEmailAddresses()
        {
            var masked = ExternalLlmAiStrategy.MaskPii("Contact nimal@example.com for details.");

            Assert.Contains("[REDACTED_EMAIL]", masked);
            Assert.DoesNotContain("nimal@example.com", masked);
        }

        [Fact]
        public void MaskPii_RedactsPhoneNumbers()
        {
            var masked = ExternalLlmAiStrategy.MaskPii("Call 0771234567 immediately.");

            Assert.Contains("[REDACTED_PHONE]", masked);
            Assert.DoesNotContain("0771234567", masked);
        }
    }
}
