using System;
using System.ComponentModel.DataAnnotations;

namespace ResQnet.Member5.Api.Models
{
    public class FloodZoneReference
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [MaxLength(150)]
        public string ZoneName { get; set; } = string.Empty;

        [MaxLength(80)]
        public string SeverityLevel { get; set; } = "High Risk"; // "High Risk", "Moderate Risk", "Severe Inundation"

        [MaxLength(80)]
        public string WaterLevelTrend { get; set; } = "Rising (+0.3m/hr)";

        public int EstimatedAffectedPopulation { get; set; }

        [MaxLength(100)]
        public string EvacuationStatus { get; set; } = "Mandatory Evacuation";

        // GeoJSON coordinate points string [ [lat, lng], [lat, lng], ... ]
        public string PolygonCoordinatesJson { get; set; } = "[]";

        public double CenterLatitude { get; set; }

        public double CenterLongitude { get; set; }

        public DateTime LastUpdated { get; set; } = DateTime.UtcNow;
    }
}
