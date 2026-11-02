using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ResQnet.Member5.Api.Models
{
    public class ShelterSupplyRequest
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int ShelterId { get; set; }

        [ForeignKey(nameof(ShelterId))]
        public Shelter? Shelter { get; set; }

        [Required]
        [MaxLength(150)]
        public string ShelterName { get; set; } = string.Empty;

        [Required]
        [MaxLength(100)]
        public string RequestedResource { get; set; } = string.Empty;

        [Range(1, int.MaxValue, ErrorMessage = "Requested quantity must be positive.")]
        public int Quantity { get; set; }

        [Required]
        [MaxLength(40)]
        public string Priority { get; set; } = "High"; // "Normal", "High", "Critical"

        [MaxLength(500)]
        public string Reason { get; set; } = string.Empty;

        [MaxLength(50)]
        public string Status { get; set; } = "Pending"; // "Pending", "Approved", "Dispatched", "Delivered", "Rejected"

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
