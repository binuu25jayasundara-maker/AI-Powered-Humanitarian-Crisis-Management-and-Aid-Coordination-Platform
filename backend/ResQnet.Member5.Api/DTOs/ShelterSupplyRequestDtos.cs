using System;
using System.ComponentModel.DataAnnotations;

namespace ResQnet.Member5.Api.DTOs
{
    public class CreateShelterSupplyRequestDto
    {
        [Required]
        public int ShelterId { get; set; }

        [Required]
        [MaxLength(100)]
        public string RequestedResource { get; set; } = string.Empty;

        [Range(1, int.MaxValue, ErrorMessage = "Requested quantity must be at least 1.")]
        public int Quantity { get; set; }

        public string Priority { get; set; } = "High"; // "Normal", "High", "Critical"

        [MaxLength(500)]
        public string Reason { get; set; } = string.Empty;
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
        public DateTime CreatedAt { get; set; }
    }

    public class UpdateShelterSupplyStatusDto
    {
        [Required]
        public string Status { get; set; } = "Approved";
    }
}
