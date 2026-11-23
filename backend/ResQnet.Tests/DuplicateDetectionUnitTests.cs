using System.Threading.Tasks;
using Xunit;
using ResQnet.Member4.Application.Strategies;

namespace ResQnet.Tests
{
    public class DuplicateDetectionUnitTests
    {
        [Fact]
        public async Task RuleBasedAiStrategy_DetectsHighSimilarityDuplicates()
        {
            var strategy = new RuleBasedAiStrategy();
            var textA = "Emergency shelter and medical supplies needed in Kandy flood zone";
            var textB = "Medical supplies and emergency shelter required in Kandy flood area";

            var duplicate = await strategy.CheckDuplicateAsync(textA, textB, "#2187");

            Assert.NotNull(duplicate);
            Assert.True(duplicate.SimilarityScore > 0.5m);
        }

        [Fact]
        public async Task RuleBasedAiStrategy_IgnoresDissimilarRequests()
        {
            var strategy = new RuleBasedAiStrategy();
            var textA = "Boat rescue for stranded residents in flood";
            var textB = "Donation of warm clothing in dry highland zone";

            var duplicate = await strategy.CheckDuplicateAsync(textA, textB, "#1001");

            Assert.Null(duplicate);
        }
    }
}
