using Xunit;
using ResQnet.UnifiedApi.Models;
using ResQnet.UnifiedApi.Services;

namespace ResQnet.Tests
{
    public class StatusTransitionUnitTests
    {
        private readonly StatusTransitionService _service = new();

        [Fact]
        public void Valid_Transitions_Should_Succeed()
        {
            Assert.True(_service.IsValidTransition(AssistanceRequestStatus.Submitted, AssistanceRequestStatus.UnderReview));
            Assert.True(_service.IsValidTransition(AssistanceRequestStatus.UnderReview, AssistanceRequestStatus.Verified));
            Assert.True(_service.IsValidTransition(AssistanceRequestStatus.Verified, AssistanceRequestStatus.Prioritised));
            Assert.True(_service.IsValidTransition(AssistanceRequestStatus.Prioritised, AssistanceRequestStatus.Assigned));
            Assert.True(_service.IsValidTransition(AssistanceRequestStatus.Assigned, AssistanceRequestStatus.InProgress));
            Assert.True(_service.IsValidTransition(AssistanceRequestStatus.InProgress, AssistanceRequestStatus.Fulfilled));
            Assert.True(_service.IsValidTransition(AssistanceRequestStatus.Fulfilled, AssistanceRequestStatus.Closed));
        }

        [Fact]
        public void Invalid_Transitions_Should_Fail()
        {
            Assert.False(_service.IsValidTransition(AssistanceRequestStatus.Submitted, AssistanceRequestStatus.Closed));
            Assert.False(_service.IsValidTransition(AssistanceRequestStatus.Submitted, AssistanceRequestStatus.Fulfilled));
            Assert.False(_service.IsValidTransition(AssistanceRequestStatus.Closed, AssistanceRequestStatus.Submitted));
        }

        [Fact]
        public void Terminal_State_Closed_Allows_No_Transitions()
        {
            foreach (AssistanceRequestStatus target in System.Enum.GetValues(typeof(AssistanceRequestStatus)))
            {
                Assert.False(_service.IsValidTransition(AssistanceRequestStatus.Closed, target));
            }
        }
    }
}
