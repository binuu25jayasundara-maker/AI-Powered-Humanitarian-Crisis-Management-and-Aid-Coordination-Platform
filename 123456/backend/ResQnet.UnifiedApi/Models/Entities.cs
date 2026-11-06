using System;
using System.Collections.Generic;

namespace ResQnet.UnifiedApi.Models
{
    public class User
    {
        public string Id { get; set; } = Guid.NewGuid().ToString();
        public string FullName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string PasswordHash { get; set; } = string.Empty;
        public string? PhoneNumber { get; set; }
        public string Role { get; set; } = "Citizen";
        public string? OrganizationId { get; set; }
        public string? OrganizationName { get; set; }
        public bool IsActive { get; set; } = true;
        public bool IsDeleted { get; set; } = false;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? LastLoginAt { get; set; }
        public DateTime? DeletedAt { get; set; }
        public string? DeletedBy { get; set; }
    }

    public class Organization
    {
        public string Id { get; set; } = Guid.NewGuid().ToString();
        public string Name { get; set; } = string.Empty;
        public string Code { get; set; } = string.Empty;
        public string Type { get; set; } = "NGO"; // "Government", "NGO", etc.
        public string ContactEmail { get; set; } = string.Empty;
        public string ContactPhone { get; set; } = string.Empty;
        public string Address { get; set; } = string.Empty;
        public bool IsVerified { get; set; } = true;
        public int MemberCount { get; set; } = 1;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }

    public class RoleEntity
    {
        public string Id { get; set; } = Guid.NewGuid().ToString();
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string PermissionsJson { get; set; } = "[]";
    }

    public class AuditEventEntity
    {
        public string Id { get; set; } = Guid.NewGuid().ToString();
        public string ActorId { get; set; } = "system";
        public string ActorEmail { get; set; } = "system@resqnet.org";
        public string Action { get; set; } = string.Empty;
        public string EntityName { get; set; } = string.Empty;
        public string EntityId { get; set; } = string.Empty;
        public string DetailsJson { get; set; } = "{}";
        public string IpAddress { get; set; } = "127.0.0.1";
        public string Status { get; set; } = "Success";
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }

    public class DeletedUserRecordEntity
    {
        public string Id { get; set; } = Guid.NewGuid().ToString();
        public string UserId { get; set; } = string.Empty;
        public string FullName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty;
        public string? OrganizationName { get; set; }
        public DateTime DeletedAt { get; set; } = DateTime.UtcNow;
        public string DeletedBy { get; set; } = string.Empty;
        public string RestorationStatus { get; set; } = "Deleted"; // "Deleted", "Restored"
        public DateTime? RestoredAt { get; set; }
        public string? RestoredBy { get; set; }
    }

    public class CrisisCase
    {
        public string Id { get; set; } = Guid.NewGuid().ToString();
        public string CaseNumber { get; set; } = string.Empty; // e.g., "#2341"
        public string Title { get; set; } = string.Empty;
        public string Location { get; set; } = string.Empty;
        public string RequestDetails { get; set; } = string.Empty;
        public string Evidence { get; set; } = string.Empty;
        public string Status { get; set; } = "Pending"; // "Pending", "Active", "Resolved", "Closed", "Assessed - awaiting approval"
        public string Urgency { get; set; } = "Medium"; // "Critical", "High", "Medium", "Low"
        public string AssignedAgency { get; set; } = "DMC-LK";
        public int PeopleAffected { get; set; } = 1;
        public string Category { get; set; } = "Disaster Relief";
        public DateTime DueAt { get; set; } = DateTime.UtcNow.AddHours(24);
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public string? PossibleDuplicate { get; set; }
        public string? DuplicateRiskLevel { get; set; }
        public string? RecommendationJson { get; set; }
    }

    public class ShelterEntity
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
        public string OperationalStatus { get; set; } = "Open"; // "Open", "Almost Full", "Full", "Closed"
        public string FacilitiesJson { get; set; } = "[]";
        public string ContactPerson { get; set; } = string.Empty;
        public string ContactPhone { get; set; } = string.Empty;
        public DateTime LastUpdated { get; set; } = DateTime.UtcNow;
    }

    public class HouseholdAllocationEntity
    {
        public int Id { get; set; }
        public int ShelterId { get; set; }
        public string ShelterName { get; set; } = string.Empty;
        public string HouseholdHeadName { get; set; } = string.Empty;
        public string? CaseReferenceId { get; set; }
        public int NumberOfPeople { get; set; }
        public string SpecialNeeds { get; set; } = "None";
        public string AllocatedBy { get; set; } = string.Empty;
        public string Status { get; set; } = "Assigned";
        public DateTime AllocatedAt { get; set; } = DateTime.UtcNow;
    }

    public class ResourceEntity
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty; // "Water", "Food Packs", "Medicine Kits", etc.
        public int AvailableQuantity { get; set; }
        public int AllocatedQuantity { get; set; }
        public int MinimumStockLevel { get; set; }
        public string Unit { get; set; } = "Units";
        public string Status { get; set; } = "Normal"; // "Normal", "Warning", "Critical"
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }

    public class ResourceAllocationEntity
    {
        public int Id { get; set; }
        public int ResourceId { get; set; }
        public string ResourceName { get; set; } = string.Empty;
        public string ResourceCategory { get; set; } = string.Empty;
        public string Unit { get; set; } = "Units";
        public string DestinationType { get; set; } = "Shelter"; // "Shelter", "EmergencyRequest", "Field"
        public int? DestinationShelterId { get; set; }
        public string? DestinationShelterName { get; set; }
        public string DestinationName { get; set; } = string.Empty;
        public string? EmergencyRequestId { get; set; }
        public int Quantity { get; set; }
        public string AllocatedBy { get; set; } = string.Empty;
        public string Notes { get; set; } = string.Empty;
        public string Status { get; set; } = "Fulfilled";
        public DateTime AllocatedAt { get; set; } = DateTime.UtcNow;
    }

    public class SupportRequestEntity
    {
        public int Id { get; set; }
        public string RequiredResource { get; set; } = string.Empty;
        public int QuantityRequired { get; set; }
        public string RequestingLocation { get; set; } = string.Empty;
        public string Priority { get; set; } = "High"; // "Critical", "High", "Medium", "Low"
        public string Reason { get; set; } = string.Empty;
        public string Status { get; set; } = "Pending"; // "Pending", "Accepted", "Rejected", "In Progress"
        public string PartnerOrganization { get; set; } = "Sri Lanka Red Cross Society";
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }

    public class ShelterSupplyRequestEntity
    {
        public int Id { get; set; }
        public int ShelterId { get; set; }
        public string ShelterName { get; set; } = string.Empty;
        public string RequestedResource { get; set; } = string.Empty;
        public int Quantity { get; set; }
        public string Priority { get; set; } = "High";
        public string Reason { get; set; } = string.Empty;
        public string Status { get; set; } = "Pending"; // "Pending", "Approved", "Fulfilled", "Rejected"
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }

    public class CampaignEntity
    {
        public string Id { get; set; } = Guid.NewGuid().ToString();
        public string Title { get; set; } = string.Empty;
        public decimal GoalAmount { get; set; }
        public decimal RaisedAmount { get; set; }
        public double ProgressPercent { get; set; }
        public int MedicalItemsCount { get; set; }
        public int DisposalFlagCount { get; set; }
        public int FoodAllocationPercent { get; set; } = 40;
        public int MedicalAllocationPercent { get; set; } = 35;
        public int ShelterAllocationPercent { get; set; } = 25;
        public string Status { get; set; } = "Active"; // "Active", "Completed", "Paused"
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }

    public class DonationEntity
    {
        public string Id { get; set; } = Guid.NewGuid().ToString();
        public string CampaignTitle { get; set; } = "Flood Relief 2024";
        public string DonorName { get; set; } = string.Empty;
        public decimal Amount { get; set; }
        public int ItemCount { get; set; }
        public string Flag { get; set; } = "-";
        public bool IsSuspicious { get; set; } = false;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }

    public class DonorProfileEntity
    {
        public string Id { get; set; } = Guid.NewGuid().ToString();
        public string DonorId { get; set; } = string.Empty; // e.g. "DON-0001"
        public string FullName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string PhoneNumber { get; set; } = string.Empty;
        public string Address { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }

    public class MonetaryDonationEntity
    {
        public string Id { get; set; } = Guid.NewGuid().ToString();
        public string DonationReference { get; set; } = string.Empty; // e.g. "REQ-MON-1001"
        public string DonorId { get; set; } = string.Empty;
        public string DonorName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string ContactNumber { get; set; } = string.Empty;
        public decimal Amount { get; set; }
        public string Currency { get; set; } = "LKR";
        public string Purpose { get; set; } = "General Emergency Disaster Relief";
        public string PaymentMethod { get; set; } = "Bank Transfer";
        public string? BankReference { get; set; }
        public string PaymentGatewayStatus { get; set; } = "Pending Verification";
        public string Status { get; set; } = "Payment Verification"; // "Payment Verification", "Confirmed", "Rejected"
        public string? RejectionReason { get; set; }
        public DateTime SubmittedAt { get; set; } = DateTime.UtcNow;
        public DateTime? VerifiedAt { get; set; }
        public string? VerifiedBy { get; set; }
    }

    public class GoodsDonationEntity
    {
        public string Id { get; set; } = Guid.NewGuid().ToString();
        public string RequestReference { get; set; } = string.Empty; // e.g. "REQ-GDS-1001"
        public string DonorId { get; set; } = string.Empty;
        public string DonorName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string ContactNumber { get; set; } = string.Empty;
        public string Address { get; set; } = string.Empty;
        public string? Notes { get; set; }
        public string ItemsJson { get; set; } = "[]";
        public string Status { get; set; } = "Pending Approval"; // "Pending Approval", "Approved", "Rejected", "Handover Scheduled", "Received"
        public string? RejectionReason { get; set; }
        public string? EarliestHandoverDate { get; set; }
        public string? LatestHandoverDate { get; set; }
        public string? HandoverLocation { get; set; }
        public string? AvailableTimeSlotsJson { get; set; }
        public string? SelectedHandoverDate { get; set; }
        public string? SelectedTimeSlot { get; set; }
        public DateTime? HandoverConfirmedAt { get; set; }
        public DateTime? ReceivedAt { get; set; }
        public string? ReceivedBy { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }

    public class VolunteerEntity
    {
        public string Id { get; set; } = Guid.NewGuid().ToString();
        public string VolunteerId { get; set; } = string.Empty; // e.g. "VOL-0001"
        public string FullName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string PhoneNumber { get; set; } = string.Empty;
        public string Skills { get; set; } = string.Empty;
        public string Status { get; set; } = "Available"; // "Available", "On Task", "On Leave"
        public int TotalHours { get; set; } = 0;
        public string WeeklyAvailabilityJson { get; set; } = "[]";
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }

    public class VolunteerRegistrationEntity
    {
        public string Id { get; set; } = Guid.NewGuid().ToString();
        public string VolunteerId { get; set; } = string.Empty;
        public string RegistrationReference { get; set; } = string.Empty; // e.g. "REG-VOL-1001"
        public string FullName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string PhoneNumber { get; set; } = string.Empty;
        public string Address { get; set; } = string.Empty;
        public string PreferredLocationsJson { get; set; } = "[]";
        public string PreferredDatesJson { get; set; } = "[]";
        public string AvailableStartTime { get; set; } = string.Empty;
        public string AvailableEndTime { get; set; } = string.Empty;
        public string PreferredDaysOfWeekJson { get; set; } = "[]";
        public string ActivityTypesJson { get; set; } = "[]";
        public string Skills { get; set; } = string.Empty;
        public string? AdditionalNotes { get; set; }
        public string Status { get; set; } = "Pending Approval"; // "Pending Approval", "Approved", "Rejected"
        public string? RejectionReason { get; set; }
        public int TotalHours { get; set; } = 0;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }

    public class VolunteerScheduleEntity
    {
        public string Id { get; set; } = Guid.NewGuid().ToString();
        public string VolunteerId { get; set; } = string.Empty;
        public string VolunteerName { get; set; } = string.Empty;
        public string Date { get; set; } = string.Empty;
        public string StartTime { get; set; } = string.Empty;
        public string EndTime { get; set; } = string.Empty;
        public string Location { get; set; } = string.Empty;
        public string Activity { get; set; } = string.Empty;
        public string Status { get; set; } = "Approved"; // "Approved", "Confirmed", "Cancelled"
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }

    public class InAppNotificationEntity
    {
        public string Id { get; set; } = Guid.NewGuid().ToString();
        public string RecipientRole { get; set; } = "All"; // "Coordinator", "Officer", "All", etc.
        public string? RecipientEmail { get; set; }
        public string Type { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string Message { get; set; } = string.Empty;
        public string? ReferenceId { get; set; }
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;
        public bool IsRead { get; set; } = false;
    }

    public class NotificationRecordEntity
    {
        public string Id { get; set; } = Guid.NewGuid().ToString();
        public string Recipient { get; set; } = string.Empty;
        public string Channel { get; set; } = "Email";
        public string Subject { get; set; } = string.Empty;
        public string Body { get; set; } = string.Empty;
        public string Status { get; set; } = "Sent";
        public int RetryCount { get; set; } = 0;
        public DateTime SentAt { get; set; } = DateTime.UtcNow;
    }

    public class DemandForecastEntity
    {
        public string Id { get; set; } = Guid.NewGuid().ToString();
        public string Region { get; set; } = string.Empty;
        public string DisasterType { get; set; } = string.Empty;
        public string ResourceCategory { get; set; } = string.Empty;
        public int ProjectedQuantity { get; set; }
        public string Unit { get; set; } = string.Empty;
        public double Confidence { get; set; }
        public string ForecastPeriod { get; set; } = string.Empty;
    }
}
