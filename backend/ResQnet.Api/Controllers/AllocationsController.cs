using ResQnet.Application.Common;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ResQnet.Member5.Api.DTOs;
using ResQnet.Member5.Api.Interfaces;

namespace ResQnet.Member5.Api.Controllers
{
    // Allocations: full control = LogisticsManager; read = LogisticsManager + EmergencyCoordinator
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "LogisticsManager,EmergencyCoordinator")]
    public class AllocationsController : ControllerBase
    {
        private readonly IResourceService _resourceService;

        public AllocationsController(IResourceService resourceService)
        {
            _resourceService = resourceService;
        }

        [HttpGet]
        public async Task<ActionResult<List<ResourceAllocationDto>>> GetAll()
        {
            var allocations = await _resourceService.GetAllocationsAsync();
            return Ok(allocations);
        }

        [HttpPost]
        [Authorize(Roles = "LogisticsManager")]
        public async Task<ActionResult<ResourceAllocationDto>> CreateAllocation([FromBody] CreateAllocationDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);
            var result = await _resourceService.AllocateResourceAsync(dto);
            return Ok(result);
        }
    }
}
