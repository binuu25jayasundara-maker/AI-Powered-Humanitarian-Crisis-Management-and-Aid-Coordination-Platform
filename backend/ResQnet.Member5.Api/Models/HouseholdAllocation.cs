using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ResQnet.Member5.Api.Models
{
    public class HouseholdAllocation
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int ShelterId { get; set; }

        [ForeignKey(nameof(ShelterId))]
        public Shelter? Shelter { get; set; }

        [Required]
        [MaxLength(150)]
        public string HouseholdHeadName { get; set; } = string.Empty;

        [MaxLength(60)]
        public string? CaseReferenceId { get; set; } // e.g. "RQ-2041", "HH-301"

        [Range(1, 100, ErrorMessage = "Number of people must be at least 1.")]
        public int NumberOfPeople { get; set; }

        [MaxLength(255)]
        public string SpecialNeeds { get; set; } = string.Empty; // e.g., "Elderly medical, Wheelchair"

        [MaxLength(100)]
        public string AllocatedBy { get; set; } = "Shelter Admin";

        [MaxLength(50)]
        public string Status { get; set; } = "Confirmed"; // "Confirmed", "CheckedIn", "CheckedOut", "Cancelled"

        public DateTime AllocatedAt { get; set; } = DateTime.UtcNow;
    }
}
