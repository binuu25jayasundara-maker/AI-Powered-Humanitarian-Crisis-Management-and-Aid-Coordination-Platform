using System;
using System.ComponentModel.DataAnnotations;

namespace ResQnet.Member5.Api.Models
{
    public class EmergencyRequestReference
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [MaxLength(50)]
        public string RequestIdentifier { get; set; } = string.Empty; // e.g., "RQ-2041"

        [Required]
        [MaxLength(80)]
        public string Category { get; set; } = "Medical"; // "Medical", "Rescue / Evac", "Food & Water", "Shelter"

        [Required]
        [MaxLength(200)]
        public string Location { get; set; } = string.Empty;

        public double Latitude { get; set; }

        public double Longitude { get; set; }

        [MaxLength(40)]
        public string Priority { get; set; } = "CRITICAL"; // "CRITICAL", "HIGH", "MEDIUM", "LOW"

        [MaxLength(50)]
        public string CurrentStatus { get; set; } = "Pending"; // "Pending", "Responder Assigned", "In Progress", "Resolved"

        public int PeopleCount { get; set; } = 1;

        [MaxLength(500)]
        public string Description { get; set; } = string.Empty;

        public DateTime ReportedAt { get; set; } = DateTime.UtcNow;
    }
}
