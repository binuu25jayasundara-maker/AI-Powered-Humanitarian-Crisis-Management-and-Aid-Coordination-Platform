using System;
using System.Collections.Generic;

namespace ResQnet.UnifiedApi.Models
{
    public class ApiResponse<T>
    {
        public bool Success { get; set; }
        public string Message { get; set; } = string.Empty;
        public T? Data { get; set; }
        public List<string> Errors { get; set; } = new List<string>();

        public static ApiResponse<T> Ok(T data, string message = "Operation completed successfully.")
        {
            return new ApiResponse<T>
            {
                Success = true,
                Message = message,
                Data = data
            };
        }

        public static ApiResponse<T> Fail(string message, List<string>? errors = null)
        {
            return new ApiResponse<T>
            {
                Success = false,
                Message = message,
                Errors = errors ?? new List<string>()
            };
        }
    }

    public class AuthResponse
    {
        public string Token { get; set; } = string.Empty;
        public string RefreshToken { get; set; } = string.Empty;
        public string ExpiresAt { get; set; } = string.Empty;
        public UserDto User { get; set; } = null!;
    }

    public class LoginRequest
    {
        public string Email { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
        public string? Role { get; set; }
    }

    public class RegisterRequest
    {
        public string FullName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
        public string Role { get; set; } = "Citizen";
        public string? OrganizationId { get; set; }
    }

    public class RefreshTokenRequest
    {
        public string RefreshToken { get; set; } = string.Empty;
    }

    public class UserDto
    {
        public string Id { get; set; } = string.Empty;
        public string FullName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string? PhoneNumber { get; set; }
        public string Role { get; set; } = string.Empty;
        public string? OrganizationId { get; set; }
        public string? OrganizationName { get; set; }
        public bool IsActive { get; set; }
        public bool IsDeleted { get; set; }
        public string CreatedAt { get; set; } = string.Empty;
        public string? LastLoginAt { get; set; }
        public string? DeletedAt { get; set; }
        public string? DeletedBy { get; set; }
    }

    public class CreateUserRequest
    {
        public string FullName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Password { get; set; } = "Password@123";
        public string Role { get; set; } = "Citizen";
        public string? PhoneNumber { get; set; }
        public string? OrganizationId { get; set; }
    }

    public class UpdateUserRequest
    {
        public string? FullName { get; set; }
        public string? Email { get; set; }
        public string? PhoneNumber { get; set; }
        public string? Role { get; set; }
    }

    public class OrganizationDto
    {
        public string Id { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string Code { get; set; } = string.Empty;
        public string Type { get; set; } = string.Empty;
        public string ContactEmail { get; set; } = string.Empty;
        public string ContactPhone { get; set; } = string.Empty;
        public string Address { get; set; } = string.Empty;
        public bool IsVerified { get; set; }
        public int MemberCount { get; set; }
    }

    public class CreateOrganizationRequest
    {
        public string Name { get; set; } = string.Empty;
        public string Code { get; set; } = string.Empty;
        public string Type { get; set; } = "NGO";
        public string? ContactEmail { get; set; }
        public string? ContactPhone { get; set; }
        public string? Address { get; set; }
    }

    public class RoleDto
    {
        public string Id { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public List<string> Permissions { get; set; } = new List<string>();
    }

    public class PermissionDto
    {
        public string Id { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
    }

    public class AuditEventDto
    {
        public string Id { get; set; } = string.Empty;
        public string ActorId { get; set; } = string.Empty;
        public string ActorEmail { get; set; } = string.Empty;
        public string Action { get; set; } = string.Empty;
        public string EntityName { get; set; } = string.Empty;
        public string EntityId { get; set; } = string.Empty;
        public string DetailsJson { get; set; } = string.Empty;
        public string IpAddress { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public string CreatedAt { get; set; } = string.Empty;
    }

    public class CampaignDto
    {
        public string Id { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public decimal GoalAmount { get; set; }
        public decimal RaisedAmount { get; set; }
        public double ProgressPercent { get; set; }
        public int MedicalItemsCount { get; set; }
        public int DisposalFlagCount { get; set; }
        public int FoodAllocationPercent { get; set; }
        public int MedicalAllocationPercent { get; set; }
        public int ShelterAllocationPercent { get; set; }
        public string Status { get; set; } = string.Empty;
        public string CreatedAt { get; set; } = string.Empty;
    }

    public class CreateCampaignDto
    {
        public string Title { get; set; } = string.Empty;
        public decimal GoalAmount { get; set; }
        public int? FoodAllocationPercent { get; set; }
        public int? MedicalAllocationPercent { get; set; }
        public int? ShelterAllocationPercent { get; set; }
    }

    public class CampaignKpisDto
    {
        public decimal TotalRaisedLkr { get; set; }
        public decimal TotalGoalLkr { get; set; }
        public double OverallProgressPercent { get; set; }
        public int TotalSuppliesAndItemsCount { get; set; }
        public int ActiveWasteFlagsCount { get; set; }
        public CampaignDto? ActiveCampaign { get; set; }
    }

    public class DonationDto
    {
        public string Id { get; set; } = string.Empty;
        public string CampaignTitle { get; set; } = string.Empty;
        public string DonorName { get; set; } = string.Empty;
        public decimal Amount { get; set; }
        public int ItemCount { get; set; }
        public string Flag { get; set; } = "-";
        public bool IsSuspicious { get; set; }
        public string CreatedAt { get; set; } = string.Empty;
    }

    public class CreateDonationDto
    {
        public string DonorName { get; set; } = string.Empty;
        public decimal Amount { get; set; }
        public int? ItemCount { get; set; }
        public string? Flag { get; set; }
        public string? CampaignTitle { get; set; }
    }

    public class DonorProfileDto
    {
        public string Id { get; set; } = string.Empty;
        public string DonorId { get; set; } = string.Empty;
        public string FullName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string PhoneNumber { get; set; } = string.Empty;
        public string Address { get; set; } = string.Empty;
        public string CreatedAt { get; set; } = string.Empty;
    }

    public class MonetaryDonationDto
    {
        public string Id { get; set; } = string.Empty;
        public string DonationReference { get; set; } = string.Empty;
        public string DonorId { get; set; } = string.Empty;
        public string DonorName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string ContactNumber { get; set; } = string.Empty;
        public decimal Amount { get; set; }
        public string Currency { get; set; } = "LKR";
        public string Purpose { get; set; } = string.Empty;
        public string PaymentMethod { get; set; } = string.Empty;
        public string? BankReference { get; set; }
        public string PaymentGatewayStatus { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public string? RejectionReason { get; set; }
        public string SubmittedAt { get; set; } = string.Empty;
        public string? VerifiedAt { get; set; }
        public string? VerifiedBy { get; set; }
    }

    public class CreateMonetaryDonationDto
    {
        public string FullName { get; set; } = string.Empty;
        public string ContactNumber { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public decimal Amount { get; set; }
        public string? Currency { get; set; } = "LKR";
        public string? Purpose { get; set; }
        public string PaymentMethod { get; set; } = "Bank Transfer";
        public string? BankReference { get; set; }
    }

    public class VerifyMonetaryDonationDto
    {
        public bool IsApproved { get; set; }
        public string? RejectionReason { get; set; }
    }

    public class GoodsItemDto
    {
        public string? Id { get; set; }
        public string Category { get; set; } = string.Empty;
        public string ItemName { get; set; } = string.Empty;
        public int Quantity { get; set; }
        public string Unit { get; set; } = "units";
        public string Condition { get; set; } = "New";
        public string? Notes { get; set; }
    }

    public class GoodsDonationDto
    {
        public string Id { get; set; } = string.Empty;
        public string RequestReference { get; set; } = string.Empty;
        public string DonorId { get; set; } = string.Empty;
        public string DonorName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string ContactNumber { get; set; } = string.Empty;
        public string Address { get; set; } = string.Empty;
        public string? Notes { get; set; }
        public List<GoodsItemDto> Items { get; set; } = new List<GoodsItemDto>();
        public string Status { get; set; } = string.Empty;
        public string? RejectionReason { get; set; }
        public string? EarliestHandoverDate { get; set; }
        public string? LatestHandoverDate { get; set; }
        public string? HandoverLocation { get; set; }
        public List<string>? AvailableTimeSlots { get; set; }
        public string? SelectedHandoverDate { get; set; }
        public string? SelectedTimeSlot { get; set; }
        public string? HandoverConfirmedAt { get; set; }
        public string? ReceivedAt { get; set; }
        public string? ReceivedBy { get; set; }
        public string CreatedAt { get; set; } = string.Empty;
    }

    public class CreateGoodsDonationDto
    {
        public string FullName { get; set; } = string.Empty;
        public string ContactNumber { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Address { get; set; } = string.Empty;
        public string? Notes { get; set; }
        public List<GoodsItemDto> Items { get; set; } = new List<GoodsItemDto>();
    }

    public class ApproveGoodsDonationDto
    {
        public string EarliestHandoverDate { get; set; } = string.Empty;
        public string LatestHandoverDate { get; set; } = string.Empty;
        public string HandoverLocation { get; set; } = string.Empty;
        public List<string> AvailableTimeSlots { get; set; } = new List<string>();
    }

    public class RejectGoodsDonationDto
    {
        public string Reason { get; set; } = string.Empty;
    }

    public class ScheduleGoodsHandoverDto
    {
        public string SelectedDate { get; set; } = string.Empty;
        public string SelectedTimeSlot { get; set; } = string.Empty;
    }

    public class ConfirmGoodsReceivedDto
    {
        public string? OfficerName { get; set; }
    }

    public class VolunteerDto
    {
        public string Id { get; set; } = string.Empty;
        public string VolunteerId { get; set; } = string.Empty;
        public string FullName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string PhoneNumber { get; set; } = string.Empty;
        public string Skills { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public int TotalHours { get; set; }
        public List<string> WeeklyAvailability { get; set; } = new List<string>();
        public string CreatedAt { get; set; } = string.Empty;
    }

    public class CreateVolunteerDto
    {
        public string FullName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string PhoneNumber { get; set; } = string.Empty;
        public string Skills { get; set; } = string.Empty;
    }

    public class TaskMatchingRecommendationDto
    {
        public string TaskId { get; set; } = string.Empty;
        public string TaskTitle { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty;
        public string Location { get; set; } = string.Empty;
        public string RequiredSkill { get; set; } = string.Empty;
        public string CandidateVolunteerId { get; set; } = string.Empty;
        public string CandidateName { get; set; } = string.Empty;
        public string CandidateEmail { get; set; } = string.Empty;
        public string CandidatePhone { get; set; } = string.Empty;
        public string CandidateSkills { get; set; } = string.Empty;
        public int MatchScorePercent { get; set; }
        public string MatchRationale { get; set; } = string.Empty;
    }

    public class AssignTaskDto
    {
        public string TaskId { get; set; } = string.Empty;
        public string VolunteerId { get; set; } = string.Empty;
    }

    public class VolunteerRegistrationDto
    {
        public string Id { get; set; } = string.Empty;
        public string VolunteerId { get; set; } = string.Empty;
        public string RegistrationReference { get; set; } = string.Empty;
        public string FullName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string PhoneNumber { get; set; } = string.Empty;
        public string Address { get; set; } = string.Empty;
        public List<string> PreferredLocations { get; set; } = new List<string>();
        public List<string> PreferredDates { get; set; } = new List<string>();
        public string AvailableStartTime { get; set; } = string.Empty;
        public string AvailableEndTime { get; set; } = string.Empty;
        public List<string> PreferredDaysOfWeek { get; set; } = new List<string>();
        public List<string> ActivityTypes { get; set; } = new List<string>();
        public string Skills { get; set; } = string.Empty;
        public string? AdditionalNotes { get; set; }
        public string Status { get; set; } = string.Empty;
        public string? RejectionReason { get; set; }
        public int TotalHours { get; set; }
        public string CreatedAt { get; set; } = string.Empty;
    }

    public class CreateVolunteerRegistrationDto
    {
        public string FullName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string PhoneNumber { get; set; } = string.Empty;
        public string Address { get; set; } = string.Empty;
        public List<string> PreferredLocations { get; set; } = new List<string>();
        public List<string> PreferredDates { get; set; } = new List<string>();
        public string AvailableStartTime { get; set; } = string.Empty;
        public string AvailableEndTime { get; set; } = string.Empty;
        public List<string> PreferredDaysOfWeek { get; set; } = new List<string>();
        public List<string> ActivityTypes { get; set; } = new List<string>();
        public string Skills { get; set; } = string.Empty;
        public string? AdditionalNotes { get; set; }
    }

    public class RejectVolunteerRegistrationDto
    {
        public string Reason { get; set; } = string.Empty;
    }

    public class VolunteerScheduleDto
    {
        public string Id { get; set; } = string.Empty;
        public string VolunteerId { get; set; } = string.Empty;
        public string VolunteerName { get; set; } = string.Empty;
        public string Date { get; set; } = string.Empty;
        public string StartTime { get; set; } = string.Empty;
        public string EndTime { get; set; } = string.Empty;
        public string Location { get; set; } = string.Empty;
        public string Activity { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public string CreatedAt { get; set; } = string.Empty;
    }

    public class CreateVolunteerScheduleDto
    {
        public string VolunteerId { get; set; } = string.Empty;
        public string VolunteerName { get; set; } = string.Empty;
        public string Date { get; set; } = string.Empty;
        public string StartTime { get; set; } = string.Empty;
        public string EndTime { get; set; } = string.Empty;
        public string Location { get; set; } = string.Empty;
        public string Activity { get; set; } = string.Empty;
    }

    public class VolunteerScheduleResponseDto
    {
        public VolunteerScheduleDto Schedule { get; set; } = null!;
        public bool HasConflictWarning { get; set; }
    }

    public class InAppNotificationDto
    {
        public string Id { get; set; } = string.Empty;
        public string RecipientRole { get; set; } = string.Empty;
        public string? RecipientEmail { get; set; }
        public string Type { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string Message { get; set; } = string.Empty;
        public string? ReferenceId { get; set; }
        public string Timestamp { get; set; } = string.Empty;
        public bool IsRead { get; set; }
    }

    public class CreateInAppNotificationDto
    {
        public string RecipientRole { get; set; } = "All";
        public string? RecipientEmail { get; set; }
        public string Type { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string Message { get; set; } = string.Empty;
        public string? ReferenceId { get; set; }
    }

    public class SendNotificationDto
    {
        public string Recipient { get; set; } = string.Empty;
        public string Channel { get; set; } = "Email";
        public string Subject { get; set; } = string.Empty;
        public string Body { get; set; } = string.Empty;
        public string? IdempotencyKey { get; set; }
    }

    public class NotificationResultDto
    {
        public bool IsSuccess { get; set; }
        public string MessageId { get; set; } = string.Empty;
        public string ChannelUsed { get; set; } = string.Empty;
        public string Recipient { get; set; } = string.Empty;
        public bool WasDuplicateSuppressed { get; set; }
        public string DispatchedAt { get; set; } = string.Empty;
    }

    public class NotificationRecordDto
    {
        public string Id { get; set; } = string.Empty;
        public string Recipient { get; set; } = string.Empty;
        public string Channel { get; set; } = string.Empty;
        public string Subject { get; set; } = string.Empty;
        public string Body { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public int RetryCount { get; set; }
        public string SentAt { get; set; } = string.Empty;
    }

    public class AiRecommendationDto
    {
        public string Id { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty;
        public string Urgency { get; set; } = string.Empty;
        public string View { get; set; } = string.Empty;
        public string Suggest { get; set; } = string.Empty;
        public int PriorityScore { get; set; }
        public double Confidence { get; set; }
        public string Rationale { get; set; } = string.Empty;
        public string ProviderStrategy { get; set; } = string.Empty;
        public bool Fallback { get; set; } = true;
    }

    public class CaseReviewDto
    {
        public string Id { get; set; } = string.Empty;
        public string CaseNumber { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string Location { get; set; } = string.Empty;
        public string RequestDetails { get; set; } = string.Empty;
        public string Evidence { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public string AssignedAgency { get; set; } = string.Empty;
        public string? PossibleDuplicate { get; set; }
        public string? DuplicateRiskLevel { get; set; }
        public AiRecommendationDto? Recommendation { get; set; }
        public string Urgency { get; set; } = "Medium";
        public int PeopleAffected { get; set; } = 1;
        public string DueAt { get; set; } = string.Empty;
        public string CreatedAt { get; set; } = string.Empty;
    }

    public class CreateCaseDto
    {
        public string Title { get; set; } = string.Empty;
        public string Location { get; set; } = string.Empty;
        public string RequestDetails { get; set; } = string.Empty;
        public string? Evidence { get; set; }
        public string? Urgency { get; set; } = "Medium";
        public string? Category { get; set; } = "Disaster Relief";
        public int PeopleAffected { get; set; } = 1;
    }

    public class UpdateCaseDto
    {
        public string? Title { get; set; }
        public string? Location { get; set; }
        public string? RequestDetails { get; set; }
        public string? Evidence { get; set; }
        public string? Status { get; set; }
        public string? Urgency { get; set; }
        public string? AssignedAgency { get; set; }
        public int? PeopleAffected { get; set; }
    }

    public class HumanDecisionRequest
    {
        public string Action { get; set; } = string.Empty; // "Approved", "Rejected", "Modified"
        public string? Notes { get; set; }
    }

    public class AiStatusDto
    {
        public string Status { get; set; } = "Online";
        public string ActiveStrategy { get; set; } = "IAiGateway (External Cloud LLM + Local Strategy)";
        public bool IsFallback { get; set; } = false;
        public int LatencyMs { get; set; } = 42;
        public string LastChecked { get; set; } = string.Empty;
        public double UptimePercent { get; set; } = 99.8;
        public string ProviderName { get; set; } = "ResQnet AI Gateway v2.4 (ASP.NET Core Web API)";
        public List<string> SupportedLanguages { get; set; } = new List<string> { "en", "si", "ta" };
    }

    public class DemandForecastDto
    {
        public string Id { get; set; } = string.Empty;
        public string Region { get; set; } = string.Empty;
        public string DisasterType { get; set; } = string.Empty;
        public string ResourceCategory { get; set; } = string.Empty;
        public int ProjectedQuantity { get; set; }
        public string Unit { get; set; } = string.Empty;
        public double Confidence { get; set; }
        public string ForecastPeriod { get; set; } = string.Empty;
    }

    public class ChatRequest
    {
        public string Question { get; set; } = string.Empty;
        public string? Language { get; set; } = "en";
    }

    public class ChatResponse
    {
        public string Answer { get; set; } = string.Empty;
        public string Language { get; set; } = "en";
        public double Confidence { get; set; } = 0.95;
        public string Source { get; set; } = "ResQnet AI Assistant Knowledgebase";
    }

    public class DuplicateCheckRequest
    {
        public string NewText { get; set; } = string.Empty;
        public string ExistingText { get; set; } = string.Empty;
        public string ExistingCaseNumber { get; set; } = string.Empty;
    }

    public class DuplicateCheckResult
    {
        public string SuspectedCaseNumber { get; set; } = string.Empty;
        public string SimilarityLevel { get; set; } = string.Empty;
        public string RiskLevel { get; set; } = string.Empty;
        public string Rationale { get; set; } = string.Empty;
    }

    public class ShelterDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Location { get; set; } = string.Empty;
        public double Latitude { get; set; }
        public double Longitude { get; set; }
        public int TotalCapacity { get; set; }
        public int CurrentOccupancy { get; set; }
        public int AvailableSpaces { get; set; }
        public int OccupancyPercentage { get; set; }
        public string OperationalStatus { get; set; } = "Open";
        public List<string> Facilities { get; set; } = new List<string>();
        public string ContactPerson { get; set; } = string.Empty;
        public string ContactPhone { get; set; } = string.Empty;
        public string LastUpdated { get; set; } = string.Empty;
    }

    public class CreateShelterDto
    {
        public string Name { get; set; } = string.Empty;
        public string Location { get; set; } = string.Empty;
        public double Latitude { get; set; }
        public double Longitude { get; set; }
        public int TotalCapacity { get; set; } = 100;
        public int CurrentOccupancy { get; set; } = 0;
        public string OperationalStatus { get; set; } = "Open";
        public List<string>? Facilities { get; set; }
        public string? ContactPerson { get; set; }
        public string? ContactPhone { get; set; }
    }

    public class UpdateShelterDto
    {
        public string? Name { get; set; }
        public string? Location { get; set; }
        public double? Latitude { get; set; }
        public double? Longitude { get; set; }
        public int? TotalCapacity { get; set; }
        public int? CurrentOccupancy { get; set; }
        public string? OperationalStatus { get; set; }
        public List<string>? Facilities { get; set; }
        public string? ContactPerson { get; set; }
        public string? ContactPhone { get; set; }
    }

    public class NearbyShelterDto : ShelterDto
    {
        public double DistanceKm { get; set; }
        public int EstimatedTravelMinutes { get; set; }
    }

    public class ShelterCapacityDto
    {
        public int ShelterId { get; set; }
        public string ShelterName { get; set; } = string.Empty;
        public int TotalCapacity { get; set; }
        public int CurrentOccupancy { get; set; }
        public int AvailableSpaces { get; set; }
        public int OccupancyPercentage { get; set; }
        public string Status { get; set; } = string.Empty;
    }

    public class CreateHouseholdAllocationDto
    {
        public int ShelterId { get; set; }
        public string HouseholdHeadName { get; set; } = string.Empty;
        public string? CaseReferenceId { get; set; }
        public int NumberOfPeople { get; set; }
        public string? SpecialNeeds { get; set; }
        public string? AllocatedBy { get; set; }
    }

    public class HouseholdAllocationDto
    {
        public int Id { get; set; }
        public int ShelterId { get; set; }
        public string ShelterName { get; set; } = string.Empty;
        public string HouseholdHeadName { get; set; } = string.Empty;
        public string? CaseReferenceId { get; set; }
        public int NumberOfPeople { get; set; }
        public string SpecialNeeds { get; set; } = string.Empty;
        public string AllocatedBy { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public string AllocatedAt { get; set; } = string.Empty;
    }

    public class ResourceDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty;
        public int AvailableQuantity { get; set; }
        public int AllocatedQuantity { get; set; }
        public int MinimumStockLevel { get; set; }
        public string Unit { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public string UpdatedAt { get; set; } = string.Empty;
    }

    public class CreateResourceDto
    {
        public string Name { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty;
        public int AvailableQuantity { get; set; }
        public int MinimumStockLevel { get; set; }
        public string Unit { get; set; } = "Units";
    }

    public class UpdateResourceDto
    {
        public string Name { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty;
        public int AvailableQuantity { get; set; }
        public int MinimumStockLevel { get; set; }
        public string Unit { get; set; } = "Units";
    }

    public class ResourceSummaryDto
    {
        public int TotalWaterAvailable { get; set; }
        public int TotalWaterAllocated { get; set; }
        public string WaterStatus { get; set; } = "Normal";
        public int TotalFoodPacksAvailable { get; set; }
        public int TotalFoodPacksAllocated { get; set; }
        public string FoodPacksStatus { get; set; } = "Normal";
        public int TotalMedicineKitsAvailable { get; set; }
        public int TotalMedicineKitsAllocated { get; set; }
        public string MedicineKitsStatus { get; set; } = "Normal";
        public int TotalItemsCount { get; set; }
        public int CriticalStockCount { get; set; }
        public int WarningStockCount { get; set; }
        public int NormalStockCount { get; set; }
    }

    public class ShortageAlertDto
    {
        public int ResourceId { get; set; }
        public string ResourceName { get; set; } = string.Empty;
        public int RequiredQuantity { get; set; }
        public int AvailableQuantity { get; set; }
        public int ShortageAmount { get; set; }
        public string AffectedShelterOrRequest { get; set; } = string.Empty;
        public string Priority { get; set; } = "Critical";
        public string SuggestedResolution { get; set; } = string.Empty;
    }

    public class CreateAllocationDto
    {
        public int ResourceId { get; set; }
        public string DestinationType { get; set; } = "Shelter";
        public int? DestinationShelterId { get; set; }
        public string? DestinationShelterName { get; set; }
        public string? EmergencyRequestId { get; set; }
        public int Quantity { get; set; }
        public string? AllocatedBy { get; set; }
        public string? Notes { get; set; }
    }

    public class ResourceAllocationDto
    {
        public int Id { get; set; }
        public int ResourceId { get; set; }
        public string ResourceName { get; set; } = string.Empty;
        public string ResourceCategory { get; set; } = string.Empty;
        public string Unit { get; set; } = string.Empty;
        public string DestinationType { get; set; } = string.Empty;
        public int? DestinationShelterId { get; set; }
        public string? DestinationShelterName { get; set; }
        public string DestinationName { get; set; } = string.Empty;
        public string? EmergencyRequestId { get; set; }
        public int Quantity { get; set; }
        public string AllocatedBy { get; set; } = string.Empty;
        public string Notes { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public string AllocatedAt { get; set; } = string.Empty;
    }

    public class SupportRequestDto
    {
        public int Id { get; set; }
        public string RequiredResource { get; set; } = string.Empty;
        public int QuantityRequired { get; set; }
        public string RequestingLocation { get; set; } = string.Empty;
        public string Priority { get; set; } = string.Empty;
        public string Reason { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public string PartnerOrganization { get; set; } = string.Empty;
        public string CreatedAt { get; set; } = string.Empty;
    }

    public class CreateSupportRequestDto
    {
        public string RequiredResource { get; set; } = string.Empty;
        public int QuantityRequired { get; set; }
        public string RequestingLocation { get; set; } = string.Empty;
        public string Priority { get; set; } = "High";
        public string Reason { get; set; } = string.Empty;
        public string? PartnerOrganization { get; set; }
    }

    public class UpdateSupportRequestDto
    {
        public string? RequiredResource { get; set; }
        public int? QuantityRequired { get; set; }
        public string? RequestingLocation { get; set; }
        public string? Priority { get; set; }
        public string? Reason { get; set; }
        public string? Status { get; set; }
        public string? PartnerOrganization { get; set; }
    }

    public class ShelterSupplyRequestDto
    {
        public int Id { get; set; }
        public int ShelterId { get; set; }
        public string ShelterName { get; set; } = string.Empty;
        public string RequestedResource { get; set; } = string.Empty;
        public int Quantity { get; set; }
        public string Priority { get; set; } = string.Empty;
        public string Reason { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public string CreatedAt { get; set; } = string.Empty;
    }

    public class CreateShelterSupplyRequestDto
    {
        public int ShelterId { get; set; }
        public string RequestedResource { get; set; } = string.Empty;
        public int Quantity { get; set; }
        public string Priority { get; set; } = "High";
        public string Reason { get; set; } = string.Empty;
    }
}
