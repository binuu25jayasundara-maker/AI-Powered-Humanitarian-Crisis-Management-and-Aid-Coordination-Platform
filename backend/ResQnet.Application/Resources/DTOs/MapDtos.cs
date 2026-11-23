using System;
using System.Collections.Generic;

namespace ResQnet.Member5.Api.DTOs
{
    public class OperationalCoverageDto
    {
        public int TotalShelters { get; set; }
        public int OpenShelters { get; set; }
        public int SheltersNearingCapacity { get; set; }
        public int SheltersFull { get; set; }
        public int ActiveEmergencyRequests { get; set; }
        public int CriticalRequestsCount { get; set; }
        public int FloodZonesActiveCount { get; set; }
        public int TotalEvacueesSheltered { get; set; }
        public int TotalShelterCapacity { get; set; }
        public double OverallCapacityUsagePercent => TotalShelterCapacity > 0
            ? Math.Round((double)TotalEvacueesSheltered / TotalShelterCapacity * 100, 1)
            : 0;
    }

    public class EmergencyRequestDto
    {
        public int Id { get; set; }
        public string RequestIdentifier { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty;
        public string Location { get; set; } = string.Empty;
        public double Latitude { get; set; }
        public double Longitude { get; set; }
        public string Priority { get; set; } = string.Empty;
        public string CurrentStatus { get; set; } = string.Empty;
        public int PeopleCount { get; set; }
        public string Description { get; set; } = string.Empty;
        public DateTime ReportedAt { get; set; }
    }

    public class FloodZoneDto
    {
        public int Id { get; set; }
        public string ZoneName { get; set; } = string.Empty;
        public string SeverityLevel { get; set; } = string.Empty;
        public string WaterLevelTrend { get; set; } = string.Empty;
        public int EstimatedAffectedPopulation { get; set; }
        public string EvacuationStatus { get; set; } = string.Empty;
        public string PolygonCoordinatesJson { get; set; } = string.Empty;
        public double CenterLatitude { get; set; }
        public double CenterLongitude { get; set; }
        public DateTime LastUpdated { get; set; }
    }

    public class RouteResultDto
    {
        public string OriginName { get; set; } = string.Empty;
        public double OriginLat { get; set; }
        public double OriginLng { get; set; }
        public string DestinationName { get; set; } = string.Empty;
        public double DestinationLat { get; set; }
        public double DestinationLng { get; set; }
        public double DistanceKm { get; set; }
        public int TravelTimeMinutes { get; set; }
        public string RouteSummary { get; set; } = string.Empty;
        public string NavigationUrl { get; set; } = string.Empty;
        public List<List<double>> Waypoints { get; set; } = new();
    }
}
