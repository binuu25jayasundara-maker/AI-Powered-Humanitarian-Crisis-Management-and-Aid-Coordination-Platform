using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using ResQnet.Member5.Api.Data;
using ResQnet.Member5.Api.DTOs;
using ResQnet.Member5.Api.Interfaces;
using ResQnet.Member5.Api.Models;

namespace ResQnet.Member5.Api.Services
{
    public class MapService : IMapService
    {
        private readonly ApplicationDbContext _context;

        public MapService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<OperationalCoverageDto> GetCoverageAsync()
        {
            var shelters = await _context.Shelters.AsNoTracking().ToListAsync();
            var emergencies = await _context.EmergencyRequests.AsNoTracking().ToListAsync();
            var floodZones = await _context.FloodZones.AsNoTracking().ToListAsync();

            return new OperationalCoverageDto
            {
                TotalShelters = shelters.Count,
                OpenShelters = shelters.Count(s => s.OperationalStatus == "Open"),
                SheltersNearingCapacity = shelters.Count(s => s.OperationalStatus == "Almost Full" || s.OccupancyPercentage >= 85),
                SheltersFull = shelters.Count(s => s.OperationalStatus == "Full" || s.CurrentOccupancy >= s.TotalCapacity),
                ActiveEmergencyRequests = emergencies.Count(e => e.CurrentStatus != "Resolved"),
                CriticalRequestsCount = emergencies.Count(e => e.Priority.Equals("CRITICAL", StringComparison.OrdinalIgnoreCase)),
                FloodZonesActiveCount = floodZones.Count,
                TotalEvacueesSheltered = shelters.Sum(s => s.CurrentOccupancy),
                TotalShelterCapacity = shelters.Sum(s => s.TotalCapacity)
            };
        }

        public async Task<List<ShelterDto>> GetMapSheltersAsync(string? filter)
        {
            var query = _context.Shelters.AsNoTracking().AsQueryable();

            if (!string.IsNullOrWhiteSpace(filter) && filter != "All")
            {
                var f = filter.ToLower();
                if (f == "open")
                {
                    query = query.Where(s => s.OperationalStatus == "Open");
                }
                else
                {
                    query = query.Where(s => s.FacilitiesRaw.ToLower().Contains(f));
                }
            }

            var shelters = await query.ToListAsync();
            return shelters.Select(s => new ShelterDto
            {
                Id = s.Id,
                Name = s.Name,
                Location = s.Location,
                Latitude = s.Latitude,
                Longitude = s.Longitude,
                TotalCapacity = s.TotalCapacity,
                CurrentOccupancy = s.CurrentOccupancy,
                AvailableSpaces = s.AvailableSpaces,
                OccupancyPercentage = s.OccupancyPercentage,
                OperationalStatus = s.OperationalStatus,
                Facilities = s.Facilities,
                ContactPerson = s.ContactPerson,
                ContactPhone = s.ContactPhone,
                LastUpdated = s.LastUpdated
            }).ToList();
        }

        public async Task<List<EmergencyRequestDto>> GetMapEmergenciesAsync()
        {
            var emergencies = await _context.EmergencyRequests
                .OrderByDescending(e => e.Priority == "CRITICAL" ? 1 : 0)
                .ThenByDescending(e => e.ReportedAt)
                .AsNoTracking()
                .ToListAsync();

            return emergencies.Select(e => new EmergencyRequestDto
            {
                Id = e.Id,
                RequestIdentifier = e.RequestIdentifier,
                Category = e.Category,
                Location = e.Location,
                Latitude = e.Latitude,
                Longitude = e.Longitude,
                Priority = e.Priority,
                CurrentStatus = e.CurrentStatus,
                PeopleCount = e.PeopleCount,
                Description = e.Description,
                ReportedAt = e.ReportedAt
            }).ToList();
        }

        public async Task<List<FloodZoneDto>> GetMapFloodZonesAsync()
        {
            var zones = await _context.FloodZones.AsNoTracking().ToListAsync();

            return zones.Select(z => new FloodZoneDto
            {
                Id = z.Id,
                ZoneName = z.ZoneName,
                SeverityLevel = z.SeverityLevel,
                WaterLevelTrend = z.WaterLevelTrend,
                EstimatedAffectedPopulation = z.EstimatedAffectedPopulation,
                EvacuationStatus = z.EvacuationStatus,
                PolygonCoordinatesJson = z.PolygonCoordinatesJson,
                CenterLatitude = z.CenterLatitude,
                CenterLongitude = z.CenterLongitude,
                LastUpdated = z.LastUpdated
            }).ToList();
        }

        public Task<RouteResultDto> CalculateRouteAsync(double originLat, double originLng, double destLat, double destLng, string? originName, string? destName)
        {
            // Calculate Haversine distance
            const double R = 6371.0;
            var dLat = (destLat - originLat) * Math.PI / 180.0;
            var dLon = (destLng - originLng) * Math.PI / 180.0;
            var a = Math.Sin(dLat / 2) * Math.Sin(dLat / 2) +
                    Math.Cos(originLat * Math.PI / 180.0) * Math.Cos(destLat * Math.PI / 180.0) *
                    Math.Sin(dLon / 2) * Math.Sin(dLon / 2);
            var c = 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));
            var distanceKm = Math.Round(R * c, 2);

            // Travel time estimate: ~25 km/h in urban emergency zone + safety buffer
            var timeMinutes = (int)Math.Max(4, Math.Round((distanceKm / 25.0) * 60 + 3));

            // Generate intermediate waypoints for visual pathing
            var waypoints = new List<List<double>>
            {
                new() { originLat, originLng },
                new() { originLat + (destLat - originLat) * 0.33 + 0.001, originLng + (destLng - originLng) * 0.33 - 0.001 },
                new() { originLat + (destLat - originLat) * 0.66 - 0.001, originLng + (destLng - originLng) * 0.66 + 0.001 },
                new() { destLat, destLng }
            };

            var navUrl = $"https://www.google.com/maps/dir/?api=1&origin={originLat:F6},{originLng:F6}&destination={destLat:F6},{destLng:F6}&travelmode=driving";

            var result = new RouteResultDto
            {
                OriginName = string.IsNullOrWhiteSpace(originName) ? "Current Emergency Location" : originName,
                OriginLat = originLat,
                OriginLng = originLng,
                DestinationName = string.IsNullOrWhiteSpace(destName) ? "Designated Shelter" : destName,
                DestinationLat = destLat,
                DestinationLng = destLng,
                DistanceKm = distanceKm,
                TravelTimeMinutes = timeMinutes,
                RouteSummary = $"Route: {distanceKm} km ~ {timeMinutes} min via safe evacuation corridor",
                NavigationUrl = navUrl,
                Waypoints = waypoints
            };

            return Task.FromResult(result);
        }
    }
}
