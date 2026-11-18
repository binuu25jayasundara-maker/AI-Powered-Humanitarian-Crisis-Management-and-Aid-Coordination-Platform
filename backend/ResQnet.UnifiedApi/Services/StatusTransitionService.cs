using System;
using System.Collections.Generic;
using ResQnet.UnifiedApi.Models;

namespace ResQnet.UnifiedApi.Services
{
    public interface IStatusTransitionService
    {
        bool IsValidTransition(AssistanceRequestStatus from, AssistanceRequestStatus to);
        bool NoteRequired(AssistanceRequestStatus to);
        bool TryParseStatus(string displayName, out AssistanceRequestStatus status);
        string ToDisplayString(AssistanceRequestStatus status);
        string ToCitizenStage(AssistanceRequestStatus status);
    }

    public class StatusTransitionService : IStatusTransitionService
    {
        private static readonly HashSet<(AssistanceRequestStatus From, AssistanceRequestStatus To)> AllowedTransitions = new()
        {
            (AssistanceRequestStatus.Submitted, AssistanceRequestStatus.UnderReview),
            (AssistanceRequestStatus.UnderReview, AssistanceRequestStatus.NeedsInformation),
            (AssistanceRequestStatus.NeedsInformation, AssistanceRequestStatus.UnderReview),
            (AssistanceRequestStatus.UnderReview, AssistanceRequestStatus.Verified),
            (AssistanceRequestStatus.Verified, AssistanceRequestStatus.Prioritised),
            (AssistanceRequestStatus.Prioritised, AssistanceRequestStatus.Assigned),
            (AssistanceRequestStatus.Assigned, AssistanceRequestStatus.InProgress),
            (AssistanceRequestStatus.InProgress, AssistanceRequestStatus.Fulfilled),
            (AssistanceRequestStatus.Fulfilled, AssistanceRequestStatus.Closed),
            (AssistanceRequestStatus.UnderReview, AssistanceRequestStatus.Rejected),
            (AssistanceRequestStatus.Verified, AssistanceRequestStatus.Rejected)
        };

        private static readonly Dictionary<AssistanceRequestStatus, string> DisplayNames = new()
        {
            { AssistanceRequestStatus.Submitted, "Submitted" },
            { AssistanceRequestStatus.UnderReview, "Under Review" },
            { AssistanceRequestStatus.NeedsInformation, "Needs Information" },
            { AssistanceRequestStatus.Verified, "Verified" },
            { AssistanceRequestStatus.Prioritised, "Prioritised" },
            { AssistanceRequestStatus.Assigned, "Assigned" },
            { AssistanceRequestStatus.InProgress, "In Progress" },
            { AssistanceRequestStatus.Fulfilled, "Fulfilled" },
            { AssistanceRequestStatus.Closed, "Closed" },
            { AssistanceRequestStatus.Rejected, "Rejected" }
        };

        private static readonly Dictionary<string, AssistanceRequestStatus> ParseLookup;

        static StatusTransitionService()
        {
            ParseLookup = new Dictionary<string, AssistanceRequestStatus>(StringComparer.OrdinalIgnoreCase);
            foreach (var kv in DisplayNames)
            {
                ParseLookup[kv.Value] = kv.Key;
                ParseLookup[kv.Value.Replace(" ", "")] = kv.Key;
                ParseLookup[kv.Key.ToString()] = kv.Key;
            }
        }

        public bool IsValidTransition(AssistanceRequestStatus from, AssistanceRequestStatus to)
        {
            return AllowedTransitions.Contains((from, to));
        }

        public bool NoteRequired(AssistanceRequestStatus to)
        {
            return to == AssistanceRequestStatus.NeedsInformation || to == AssistanceRequestStatus.Rejected;
        }

        public bool TryParseStatus(string displayName, out AssistanceRequestStatus status)
        {
            if (string.IsNullOrWhiteSpace(displayName))
            {
                status = default;
                return false;
            }

            return ParseLookup.TryGetValue(displayName.Trim(), out status);
        }

        public string ToDisplayString(AssistanceRequestStatus status)
        {
            return DisplayNames.TryGetValue(status, out var name) ? name : status.ToString();
        }

        public string ToCitizenStage(AssistanceRequestStatus status) => status switch
        {
            AssistanceRequestStatus.Submitted => "Received",
            AssistanceRequestStatus.UnderReview => "Received",
            AssistanceRequestStatus.NeedsInformation => "Received",
            AssistanceRequestStatus.Verified => "Received",
            AssistanceRequestStatus.Prioritised => "Received",
            AssistanceRequestStatus.Assigned => "Assigned",
            AssistanceRequestStatus.InProgress => "On the way",
            AssistanceRequestStatus.Fulfilled => "Delivered",
            AssistanceRequestStatus.Closed => "Delivered",
            AssistanceRequestStatus.Rejected => "Rejected",
            _ => "Received"
        };
    }
}