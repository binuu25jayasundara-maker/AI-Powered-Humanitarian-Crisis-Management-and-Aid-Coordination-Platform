using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using ResQnet.Member5.Api.DTOs;
using ResQnet.Member5.Api.Interfaces;

namespace ResQnet.Member5.Api.Controllers
{
    [ApiController]
    [Route("api/shelter-supply-requests")]
    public class ShelterSupplyRequestsController : ControllerBase
    {
        private readonly IShelterService _shelterService;

        public ShelterSupplyRequestsController(IShelterService shelterService)
        {
            _shelterService = shelterService;
        }

        [HttpGet]
        public async Task<ActionResult<List<ShelterSupplyRequestDto>>> GetAll([FromQuery] int? shelterId)
        {
            var requests = await _shelterService.GetSupplyRequestsAsync(shelterId);
            return Ok(requests);
        }

        [HttpPost]
        public async Task<ActionResult<ShelterSupplyRequestDto>> Create([FromBody] CreateShelterSupplyRequestDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);
            var result = await _shelterService.CreateSupplyRequestAsync(dto);
            return Ok(result);
        }

        [HttpPut("{id:int}/status")]
        public async Task<ActionResult<ShelterSupplyRequestDto>> UpdateStatus(int id, [FromBody] UpdateShelterSupplyStatusDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);
            var updated = await _shelterService.UpdateSupplyRequestStatusAsync(id, dto);
            if (updated == null) return NotFound(new { message = $"Supply Request #{id} not found." });
            return Ok(updated);
        }
    }
}
