using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ResQnet.Member5.Api.DTOs;
using ResQnet.Member5.Api.Interfaces;

namespace ResQnet.Member5.Api.Controllers
{
    // Map situational awareness — any authenticated user
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class MapController : ControllerBase
    {
        private readonly IMapService _mapService;

        public MapController(IMapService mapService)
        {
            _mapService = mapService;
        }

        [HttpGet("shelters")]
        public async Task<ActionResult<List<ShelterDto>>> GetShelters([FromQuery] string? filter)
        {
            var shelters = await _mapService.GetMapSheltersAsync(filter);
            return Ok(shelters);
        }

        [HttpGet("emergency-requests")]
        [Authorize(Roles = "EmergencyCoordinator,CaseManager,LogisticsManager,VolunteerCoordinator")]
        public async Task<ActionResult<List<EmergencyRequestDto>>> GetEmergencies()
        {
            var emergencies = await _mapService.GetMapEmergenciesAsync();
            return Ok(emergencies);
        }

        [HttpGet("flood-zones")]
        public async Task<ActionResult<List<FloodZoneDto>>> GetFloodZones()
        {
            var zones = await _mapService.GetMapFloodZonesAsync();
            return Ok(zones);
        }

        [HttpGet("coverage")]
        public async Task<ActionResult<OperationalCoverageDto>> GetCoverage()
        {
            var coverage = await _mapService.GetCoverageAsync();
            return Ok(coverage);
        }
    }
}
