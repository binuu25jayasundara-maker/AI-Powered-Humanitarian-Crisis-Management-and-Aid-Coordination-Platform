using System;
using System.ComponentModel.DataAnnotations;

namespace ResQnet.Member5.Api.DTOs
{
    public class CreatePartnerSupportRequestDto
    {
        [Required]
        [MaxLength(120)]
        public string RequiredResource { get; set; } = string.Empty;

        [Range(1, int.MaxValue, ErrorMessage = "Requested quantity must be at least 1.")]
        public int QuantityRequired { get; set; }

        [Required]
        [MaxLength(150)]
        public string RequestingLocation { get; set; } = string.Empty;

        [Required]
        public string Priority { get; set; } = "High"; // "Normal", "High", "Critical"

        [Required]
        [MaxLength(500)]
        public string Reason { get; set; } = string.Empty;

        public string? PartnerOrganization { get; set; } = "Red Cross";
    }

    public class PartnerSupportRequestDto
    {
        public int Id { get; set; }
        public string RequiredResource { get; set; } = string.Empty;
        public int QuantityRequired { get; set; }
        public string RequestingLocation { get; set; } = string.Empty;
        public string Priority { get; set; } = string.Empty;
        public string Reason { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public string? PartnerOrganization { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public class UpdateSupportRequestStatusDto
    {
        [Required]
        public string Status { get; set; } = "Approved";

        public string? PartnerOrganization { get; set; }
    }
}
