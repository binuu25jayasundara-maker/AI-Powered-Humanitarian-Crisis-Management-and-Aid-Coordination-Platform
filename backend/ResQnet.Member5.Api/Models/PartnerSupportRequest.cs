using System;
using System.ComponentModel.DataAnnotations;

namespace ResQnet.Member5.Api.Models
{
    public class PartnerSupportRequest
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [MaxLength(120)]
        public string RequiredResource { get; set; } = string.Empty;

        [Range(1, int.MaxValue, ErrorMessage = "Requested quantity must be positive.")]
        public int QuantityRequired { get; set; }

        [Required]
        [MaxLength(150)]
        public string RequestingLocation { get; set; } = string.Empty;

        [Required]
        [MaxLength(40)]
        public string Priority { get; set; } = "High"; // "Normal", "High", "Critical"

        [Required]
        [MaxLength(500)]
        public string Reason { get; set; } = string.Empty;

        [MaxLength(50)]
        public string Status { get; set; } = "Pending"; // "Pending", "Approved", "Dispatched", "Fulfilled", "Rejected"

        [MaxLength(120)]
        public string? PartnerOrganization { get; set; } // e.g. "Sri Lanka Red Cross", "UNICEF", "WFP"

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
