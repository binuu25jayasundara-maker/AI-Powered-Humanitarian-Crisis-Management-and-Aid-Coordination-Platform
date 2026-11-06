using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using ResQnet.Member5.Api.DTOs;
using ResQnet.Member5.Api.Interfaces;

namespace ResQnet.Member5.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class RoutesController : ControllerBase
    {
        private readonly IMapService _mapService;

        public RoutesController(IMapService mapService)
        {
            _mapService = mapService;
        }

        [HttpGet]
        public async Task<ActionResult<RouteResultDto>> GetRoute(
            [FromQuery] double originLat,
            [FromQuery] double originLng,
            [FromQuery] double destLat,
            [FromQuery] double destLng,
            [FromQuery] string? originName,
            [FromQuery] string? destName)
        {
            if (originLat == 0 && originLng == 0)
            {
                // Default origin: Kelaniya flood basin (6.9535, 79.9167)
                originLat = 6.9535;
                originLng = 79.9167;
                originName = "Kelaniya Crisis Center";
            }

            var result = await _mapService.CalculateRouteAsync(originLat, originLng, destLat, destLng, originName, destName);
            return Ok(result);
        }
    }
}
