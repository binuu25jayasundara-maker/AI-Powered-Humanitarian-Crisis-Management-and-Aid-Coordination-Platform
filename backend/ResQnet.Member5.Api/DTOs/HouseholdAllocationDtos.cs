using System;
using System.ComponentModel.DataAnnotations;

namespace ResQnet.Member5.Api.DTOs
{
    public class CreateHouseholdAllocationDto
    {
        [Required]
        [MaxLength(150)]
        public string HouseholdHeadName { get; set; } = string.Empty;

        public string? CaseReferenceId { get; set; }

        [Range(1, 100, ErrorMessage = "Number of people must be between 1 and 100.")]
        public int NumberOfPeople { get; set; }

        public string SpecialNeeds { get; set; } = string.Empty;

        public string AllocatedBy { get; set; } = "Shelter Admin";
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
        public DateTime AllocatedAt { get; set; }
    }
}
