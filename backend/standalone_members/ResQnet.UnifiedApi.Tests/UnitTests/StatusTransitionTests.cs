using ResQnet.UnifiedApi.Models;
using ResQnet.UnifiedApi.Services;
using Xunit;

namespace ResQnet.UnifiedApi.Tests.UnitTests
{
    public class StatusTransitionTests
    {
        private readonly StatusTransitionService _service = new();

        [Theory]
        [InlineData(AssistanceRequestStatus.Submitted, AssistanceRequestStatus.UnderReview)]
        [InlineData(AssistanceRequestStatus.UnderReview, AssistanceRequestStatus.NeedsInformation)]
        [InlineData(AssistanceRequestStatus.NeedsInformation, AssistanceRequestStatus.UnderReview)]
        [InlineData(AssistanceRequestStatus.UnderReview, AssistanceRequestStatus.Verified)]
        [InlineData(AssistanceRequestStatus.Verified, AssistanceRequestStatus.Prioritised)]
        [InlineData(AssistanceRequestStatus.Prioritised, AssistanceRequestStatus.Assigned)]
        [InlineData(AssistanceRequestStatus.Assigned, AssistanceRequestStatus.InProgress)]
        [InlineData(AssistanceRequestStatus.InProgress, AssistanceRequestStatus.Fulfilled)]
        [InlineData(AssistanceRequestStatus.Fulfilled, AssistanceRequestStatus.Closed)]
        [InlineData(AssistanceRequestStatus.UnderReview, AssistanceRequestStatus.Rejected)]
        [InlineData(AssistanceRequestStatus.Verified, AssistanceRequestStatus.Rejected)]
        public void ValidTransitions_ShouldReturnTrue(AssistanceRequestStatus from, AssistanceRequestStatus to)
        {
            var result = _service.IsValidTransition(from, to);
            Assert.True(result);
        }

        [Theory]
        [InlineData(AssistanceRequestStatus.Submitted, AssistanceRequestStatus.Verified)]
        [InlineData(AssistanceRequestStatus.Submitted, AssistanceRequestStatus.Prioritised)]
        [InlineData(AssistanceRequestStatus.Submitted, AssistanceRequestStatus.Fulfilled)]
        [InlineData(AssistanceRequestStatus.Submitted, AssistanceRequestStatus.Closed)]
        [InlineData(AssistanceRequestStatus.Submitted, AssistanceRequestStatus.Rejected)]
        [InlineData(AssistanceRequestStatus.Prioritised, AssistanceRequestStatus.Rejected)]
        [InlineData(AssistanceRequestStatus.Assigned, AssistanceRequestStatus.Rejected)]
        [InlineData(AssistanceRequestStatus.InProgress, AssistanceRequestStatus.Rejected)]
        [InlineData(AssistanceRequestStatus.Fulfilled, AssistanceRequestStatus.Submitted)]
        [InlineData(AssistanceRequestStatus.Closed, AssistanceRequestStatus.Submitted)]
        [InlineData(AssistanceRequestStatus.Rejected, AssistanceRequestStatus.UnderReview)]
        [InlineData(AssistanceRequestStatus.NeedsInformation, AssistanceRequestStatus.Verified)]
        public void InvalidTransitions_ShouldReturnFalse(AssistanceRequestStatus from, AssistanceRequestStatus to)
        {
            var result = _service.IsValidTransition(from, to);
            Assert.False(result);
        }

        [Theory]
        [InlineData(AssistanceRequestStatus.NeedsInformation, true)]
        [InlineData(AssistanceRequestStatus.Rejected, true)]
        [InlineData(AssistanceRequestStatus.Submitted, false)]
        [InlineData(AssistanceRequestStatus.UnderReview, false)]
        [InlineData(AssistanceRequestStatus.Verified, false)]
        [InlineData(AssistanceRequestStatus.Prioritised, false)]
        [InlineData(AssistanceRequestStatus.Assigned, false)]
        [InlineData(AssistanceRequestStatus.InProgress, false)]
        [InlineData(AssistanceRequestStatus.Fulfilled, false)]
        [InlineData(AssistanceRequestStatus.Closed, false)]
        public void NoteRequired_ShouldMatchRequirements(AssistanceRequestStatus status, bool expected)
        {
            var result = _service.NoteRequired(status);
            Assert.Equal(expected, result);
        }

        [Theory]
        [InlineData("Submitted", AssistanceRequestStatus.Submitted)]
        [InlineData("Under Review", AssistanceRequestStatus.UnderReview)]
        [InlineData("UnderReview", AssistanceRequestStatus.UnderReview)]
        [InlineData("under review", AssistanceRequestStatus.UnderReview)]
        [InlineData("Needs Information", AssistanceRequestStatus.NeedsInformation)]
        [InlineData("NeedsInformation", AssistanceRequestStatus.NeedsInformation)]
        [InlineData("Verified", AssistanceRequestStatus.Verified)]
        [InlineData("Prioritised", AssistanceRequestStatus.Prioritised)]
        [InlineData("Assigned", AssistanceRequestStatus.Assigned)]
        [InlineData("In Progress", AssistanceRequestStatus.InProgress)]
        [InlineData("InProgress", AssistanceRequestStatus.InProgress)]
        [InlineData("Fulfilled", AssistanceRequestStatus.Fulfilled)]
        [InlineData("Closed", AssistanceRequestStatus.Closed)]
        [InlineData("Rejected", AssistanceRequestStatus.Rejected)]
        public void TryParseStatus_ValidStrings_ShouldParseCorrectly(string input, AssistanceRequestStatus expected)
        {
            var success = _service.TryParseStatus(input, out var status);
            Assert.True(success);
            Assert.Equal(expected, status);
        }

        [Theory]
        [InlineData("")]
        [InlineData(null)]
        [InlineData("InvalidStatus")]
        [InlineData("Unknown")]
        public void TryParseStatus_InvalidStrings_ShouldReturnFalse(string? input)
        {
            var success = _service.TryParseStatus(input!, out _);
            Assert.False(success);
        }

        [Theory]
        [InlineData(AssistanceRequestStatus.Submitted, "Received")]
        [InlineData(AssistanceRequestStatus.UnderReview, "Received")]
        [InlineData(AssistanceRequestStatus.NeedsInformation, "Received")]
        [InlineData(AssistanceRequestStatus.Verified, "Received")]
        [InlineData(AssistanceRequestStatus.Prioritised, "Received")]
        [InlineData(AssistanceRequestStatus.Assigned, "Assigned")]
        [InlineData(AssistanceRequestStatus.InProgress, "On the way")]
        [InlineData(AssistanceRequestStatus.Fulfilled, "Delivered")]
        [InlineData(AssistanceRequestStatus.Closed, "Delivered")]
        [InlineData(AssistanceRequestStatus.Rejected, "Rejected")]
        public void ToCitizenStage_ShouldMapCorrectly(AssistanceRequestStatus status, string expected)
        {
            var stage = _service.ToCitizenStage(status);
            Assert.Equal(expected, stage);
        }
    }
}