using System;
using System.ComponentModel.DataAnnotations;

namespace ResQnet.Member5.Api.DTOs
{
    public class CreateAllocationDto
    {
        [Required]
        public int ResourceId { get; set; }

        [Required]
        public string DestinationType { get; set; } = "Shelter"; // "Shelter" or "EmergencyRequest"

        public int? DestinationShelterId { get; set; }

        public string? DestinationShelterName { get; set; }

        public string? EmergencyRequestId { get; set; }

        [Range(1, int.MaxValue, ErrorMessage = "Allocation quantity must be at least 1.")]
        public int Quantity { get; set; }

        public string AllocatedBy { get; set; } = "Resource Manager";

        public string Notes { get; set; } = string.Empty;
    }

    public class ResourceAllocationDto
    {
        public int Id { get; set; }
        public int ResourceId { get; set; }
        public string ResourceName { get; set; } = string.Empty;
        public string DestinationType { get; set; } = string.Empty;
        public int? DestinationShelterId { get; set; }
        public string? DestinationShelterName { get; set; }
        public string? EmergencyRequestId { get; set; }
        public int Quantity { get; set; }
        public string AllocatedBy { get; set; } = string.Empty;
        public string Notes { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public DateTime AllocatedAt { get; set; }
    }
}
