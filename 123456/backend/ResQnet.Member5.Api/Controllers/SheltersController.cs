using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using ResQnet.Member5.Api.DTOs;
using ResQnet.Member5.Api.Interfaces;

namespace ResQnet.Member5.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class SheltersController : ControllerBase
    {
        private readonly IShelterService _shelterService;

        public SheltersController(IShelterService shelterService)
        {
            _shelterService = shelterService;
        }

        [HttpGet]
        public async Task<ActionResult<List<ShelterDto>>> GetAll([FromQuery] string? search, [FromQuery] string? status, [FromQuery] string? facility)
        {
            var shelters = await _shelterService.GetAllSheltersAsync(search, status, facility);
            return Ok(shelters);
        }

        [HttpGet("nearby")]
        public async Task<ActionResult<List<NearbyShelterDto>>> GetNearby([FromQuery] double lat, [FromQuery] double lng, [FromQuery] string? filter)
        {
            var nearby = await _shelterService.GetNearbySheltersAsync(lat, lng, filter);
            return Ok(nearby);
        }

        [HttpGet("{id:int}")]
        public async Task<ActionResult<ShelterDto>> GetById(int id)
        {
            var shelter = await _shelterService.GetShelterByIdAsync(id);
            if (shelter == null) return NotFound(new { message = $"Shelter #{id} not found." });
            return Ok(shelter);
        }

        [HttpPost]
        public async Task<ActionResult<ShelterDto>> Create([FromBody] CreateShelterDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);
            var created = await _shelterService.CreateShelterAsync(dto);
            return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
        }

        [HttpPut("{id:int}")]
        public async Task<ActionResult<ShelterDto>> Update(int id, [FromBody] UpdateShelterDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);
            var updated = await _shelterService.UpdateShelterAsync(id, dto);
            if (updated == null) return NotFound(new { message = $"Shelter #{id} not found." });
            return Ok(updated);
        }

        [HttpGet("{id:int}/capacity")]
        public async Task<ActionResult<ShelterCapacityDto>> GetCapacity(int id)
        {
            var capacity = await _shelterService.GetCapacityAsync(id);
            if (capacity == null) return NotFound(new { message = $"Shelter #{id} not found." });
            return Ok(capacity);
        }

        [HttpGet("{id:int}/allocations")]
        public async Task<ActionResult<List<HouseholdAllocationDto>>> GetAllocations(int id)
        {
            var allocations = await _shelterService.GetHouseholdAllocationsAsync(id);
            return Ok(allocations);
        }

        [HttpPost("{id:int}/allocations")]
        public async Task<ActionResult<HouseholdAllocationDto>> AllocateHousehold(int id, [FromBody] CreateHouseholdAllocationDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);
            var result = await _shelterService.AllocateHouseholdAsync(id, dto);
            return Ok(result);
        }
    }
}
