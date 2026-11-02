using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using ResQnet.Member5.Api.DTOs;
using ResQnet.Member5.Api.Interfaces;

namespace ResQnet.Member5.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ResourcesController : ControllerBase
    {
        private readonly IResourceService _resourceService;

        public ResourcesController(IResourceService resourceService)
        {
            _resourceService = resourceService;
        }

        [HttpGet]
        public async Task<ActionResult<List<ResourceDto>>> GetAll([FromQuery] string? category, [FromQuery] string? status, [FromQuery] string? search)
        {
            var items = await _resourceService.GetAllResourcesAsync(category, status, search);
            return Ok(items);
        }

        [HttpGet("{id:int}")]
        public async Task<ActionResult<ResourceDto>> GetById(int id)
        {
            var item = await _resourceService.GetResourceByIdAsync(id);
            if (item == null) return NotFound(new { message = $"Resource #{id} not found." });
            return Ok(item);
        }

        [HttpPost]
        public async Task<ActionResult<ResourceDto>> Create([FromBody] CreateResourceDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);
            var created = await _resourceService.CreateResourceAsync(dto);
            return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
        }

        [HttpPut("{id:int}")]
        public async Task<ActionResult<ResourceDto>> Update(int id, [FromBody] UpdateResourceDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);
            var updated = await _resourceService.UpdateResourceAsync(id, dto);
            if (updated == null) return NotFound(new { message = $"Resource #{id} not found." });
            return Ok(updated);
        }

        [HttpDelete("{id:int}")]
        public async Task<IActionResult> Delete(int id)
        {
            var success = await _resourceService.DeleteResourceAsync(id);
            if (!success) return NotFound(new { message = $"Resource #{id} not found." });
            return NoContent();
        }

        [HttpGet("summary")]
        public async Task<ActionResult<ResourceSummaryDto>> GetSummary()
        {
            var summary = await _resourceService.GetSummaryAsync();
            return Ok(summary);
        }

        [HttpGet("shortages")]
        public async Task<ActionResult<List<ShortageAlertDto>>> GetShortages()
        {
            var shortages = await _resourceService.GetShortagesAsync();
            return Ok(shortages);
        }
    }
}
