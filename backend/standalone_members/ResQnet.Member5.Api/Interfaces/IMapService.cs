using System.Collections.Generic;
using System.Threading.Tasks;
using ResQnet.Member5.Api.DTOs;

namespace ResQnet.Member5.Api.Interfaces
{
    public interface IMapService
    {
        Task<OperationalCoverageDto> GetCoverageAsync();
        Task<List<ShelterDto>> GetMapSheltersAsync(string? filter);
        Task<List<EmergencyRequestDto>> GetMapEmergenciesAsync();
        Task<List<FloodZoneDto>> GetMapFloodZonesAsync();
        Task<RouteResultDto> CalculateRouteAsync(double originLat, double originLng, double destLat, double destLng, string? originName, string? destName);
    }
}
