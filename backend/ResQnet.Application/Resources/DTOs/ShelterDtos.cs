using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace ResQnet.Member5.Api.DTOs
{
    public class ShelterDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Location { get; set; } = string.Empty;
        public double Latitude { get; set; }
        public double Longitude { get; set; }
        public int TotalCapacity { get; set; }
        public int CurrentOccupancy { get; set; }
        public int AvailableSpaces { get; set; }
        public double OccupancyPercentage { get; set; }
        public string OperationalStatus { get; set; } = string.Empty;
        public List<string> Facilities { get; set; } = new();
        public string ContactPerson { get; set; } = string.Empty;
        public string ContactPhone { get; set; } = string.Empty;
        public DateTime LastUpdated { get; set; }
    }

    public class CreateShelterDto
    {
        [Required]
        [MaxLength(150)]
        public string Name { get; set; } = string.Empty;

        [Required]
        [MaxLength(255)]
        public string Location { get; set; } = string.Empty;

        public double Latitude { get; set; }
        public double Longitude { get; set; }

        [Range(1, 100000, ErrorMessage = "Total capacity must be greater than zero.")]
        public int TotalCapacity { get; set; }

        public List<string>? Facilities { get; set; }

        public string? ContactPerson { get; set; }
        public string? ContactPhone { get; set; }
    }

    public class UpdateShelterDto
    {
        [Required]
        [MaxLength(150)]
        public string Name { get; set; } = string.Empty;

        [Required]
        [MaxLength(255)]
        public string Location { get; set; } = string.Empty;

        public double Latitude { get; set; }
        public double Longitude { get; set; }

        [Range(1, 100000)]
        public int TotalCapacity { get; set; }

        [Range(0, 100000)]
        public int CurrentOccupancy { get; set; }

        public string OperationalStatus { get; set; } = "Open";

        public List<string>? Facilities { get; set; }

        public string? ContactPerson { get; set; }
        public string? ContactPhone { get; set; }
    }

    public class ShelterCapacityDto
    {
        public int ShelterId { get; set; }
        public string ShelterName { get; set; } = string.Empty;
        public int TotalCapacity { get; set; }
        public int CurrentOccupancy { get; set; }
        public int AvailableSpaces { get; set; }
        public double OccupancyPercentage { get; set; }
        public string Status { get; set; } = string.Empty;
        public bool IsOverCapacity => CurrentOccupancy > TotalCapacity;
        public bool CanAccommodate(int count) => AvailableSpaces >= count;
    }

    public class NearbyShelterDto : ShelterDto
    {
        public double DistanceKm { get; set; }
        public int EstimatedTravelMinutes { get; set; }
    }
}
