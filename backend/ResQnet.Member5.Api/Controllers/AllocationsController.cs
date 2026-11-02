using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using ResQnet.Member5.Api.DTOs;
using ResQnet.Member5.Api.Interfaces;

namespace ResQnet.Member5.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
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
        public async Task<ActionResult<ResourceAllocationDto>> CreateAllocation([FromBody] CreateAllocationDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);
            var result = await _resourceService.AllocateResourceAsync(dto);
            return Ok(result);
        }
    }
}
