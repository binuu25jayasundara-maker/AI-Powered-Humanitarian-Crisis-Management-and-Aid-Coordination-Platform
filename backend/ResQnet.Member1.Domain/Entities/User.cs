using System;

namespace ResQnet.Member1.Domain.Entities
{
    public class User : BaseEntity
    {
        public string FullName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string PasswordHash { get; set; } = string.Empty;
        public string Role { get; set; } = "Citizen"; // Citizen, EmergencyCoordinator, CaseManager, LogisticsManager, ShelterAdmin, VolunteerCoordinator, DonorOfficer, PartnerOfficer, SystemAdmin
        public Guid? OrganizationId { get; set; }
        public virtual Organization? Organization { get; set; }
        public bool IsActive { get; set; } = true;
        public DateTime? LastLoginAt { get; set; }
        public string? PhoneNumber { get; set; }
    }
}
