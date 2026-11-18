using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;

namespace ResQnet.Member5.Api.Models
{
    public class Shelter
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [MaxLength(150)]
        public string Name { get; set; } = string.Empty;

        [Required]
        [MaxLength(255)]
        public string Location { get; set; } = string.Empty;

        public double Latitude { get; set; }

        public double Longitude { get; set; }

        [Range(1, 100000, ErrorMessage = "Capacity must be at least 1.")]
        public int TotalCapacity { get; set; }

        [Range(0, 100000, ErrorMessage = "Occupancy cannot be negative.")]
        public int CurrentOccupancy { get; set; }

        [MaxLength(50)]
        public string OperationalStatus { get; set; } = "Open"; // "Open", "Almost Full", "Full", "Closed"

        // Stored as comma-separated or JSON string in DB for broad compatibility
        public string FacilitiesRaw { get; set; } = "Meals,Drinking Water,Sanitation";

        [NotMapped]
        public List<string> Facilities
        {
            get => string.IsNullOrWhiteSpace(FacilitiesRaw)
                ? new List<string>()
                : FacilitiesRaw.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries).ToList();
            set => FacilitiesRaw = value != null ? string.Join(",", value) : string.Empty;
        }

        [MaxLength(100)]
        public string ContactPerson { get; set; } = "Site Coordinator";

        [MaxLength(50)]
        public string ContactPhone { get; set; } = "+94 11 291 0000";

        public DateTime LastUpdated { get; set; } = DateTime.UtcNow;

        [NotMapped]
        public int AvailableSpaces => Math.Max(0, TotalCapacity - CurrentOccupancy);

        [NotMapped]
        public double OccupancyPercentage => TotalCapacity > 0
            ? Math.Round((double)CurrentOccupancy / TotalCapacity * 100, 1)
            : 0;

        public void RecalculateStatus()
        {
            if (OperationalStatus == "Closed") return;

            var percentage = OccupancyPercentage;
            if (CurrentOccupancy >= TotalCapacity)
            {
                OperationalStatus = "Full";
            }
            else if (percentage >= 85)
            {
                OperationalStatus = "Almost Full";
            }
            else
            {
                OperationalStatus = "Open";
            }
            LastUpdated = DateTime.UtcNow;
        }
    }
}
