using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ResQnet.Member5.Api.Models
{
    public class ResourceAllocation
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int ResourceId { get; set; }

        [ForeignKey(nameof(ResourceId))]
        public Resource? Resource { get; set; }

        [Required]
        [MaxLength(50)]
        public string DestinationType { get; set; } = "Shelter"; // "Shelter" or "EmergencyRequest"

        public int? DestinationShelterId { get; set; }

        [MaxLength(150)]
        public string? DestinationShelterName { get; set; }

        [MaxLength(50)]
        public string? EmergencyRequestId { get; set; }

        [Range(1, int.MaxValue, ErrorMessage = "Allocated quantity must be greater than zero.")]
        public int Quantity { get; set; }

        [MaxLength(100)]
        public string AllocatedBy { get; set; } = "Staff";

        [MaxLength(255)]
        public string Notes { get; set; } = string.Empty;

        [MaxLength(40)]
        public string Status { get; set; } = "Allocated"; // "Allocated", "InTransit", "Delivered"

        public DateTime AllocatedAt { get; set; } = DateTime.UtcNow;
    }
}
