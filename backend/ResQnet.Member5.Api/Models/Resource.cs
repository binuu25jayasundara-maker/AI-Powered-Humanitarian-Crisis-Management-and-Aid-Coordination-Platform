using System;
using System.ComponentModel.DataAnnotations;

namespace ResQnet.Member5.Api.Models
{
    public class Resource
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [MaxLength(120)]
        public string Name { get; set; } = string.Empty;

        [Required]
        [MaxLength(80)]
        public string Category { get; set; } = string.Empty; // "Water", "Food Packs", "Medicine Kits", "First Aid Kits", "Essential Supplies"

        [Range(0, int.MaxValue, ErrorMessage = "Available quantity cannot be negative.")]
        public int AvailableQuantity { get; set; }

        [Range(0, int.MaxValue, ErrorMessage = "Allocated quantity cannot be negative.")]
        public int AllocatedQuantity { get; set; }

        [Range(0, int.MaxValue, ErrorMessage = "Minimum stock level cannot be negative.")]
        public int MinimumStockLevel { get; set; }

        [MaxLength(30)]
        public string Unit { get; set; } = "units"; // "L", "packs", "kits", "units"

        [MaxLength(40)]
        public string Status { get; set; } = "Normal"; // "Normal", "Warning", "Critical"

        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        public void RecalculateStatus()
        {
            if (AvailableQuantity <= 0 || AvailableQuantity <= MinimumStockLevel * 0.4)
            {
                Status = "Critical";
            }
            else if (AvailableQuantity <= MinimumStockLevel)
            {
                Status = "Warning";
            }
            else
            {
                Status = "Normal";
            }
            UpdatedAt = DateTime.UtcNow;
        }
    }
}
