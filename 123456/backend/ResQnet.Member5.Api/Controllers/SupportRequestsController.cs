using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using ResQnet.Member5.Api.DTOs;
using ResQnet.Member5.Api.Interfaces;

namespace ResQnet.Member5.Api.Controllers
{
    [ApiController]
    [Route("api/support-requests")]
    public class SupportRequestsController : ControllerBase
    {
        private readonly IResourceService _resourceService;

        public SupportRequestsController(IResourceService resourceService)
        {
            _resourceService = resourceService;
        }

        [HttpGet]
        public async Task<ActionResult<List<PartnerSupportRequestDto>>> GetAll()
        {
            var requests = await _resourceService.GetPartnerSupportRequestsAsync();
            return Ok(requests);
        }

        [HttpPost]
        public async Task<ActionResult<PartnerSupportRequestDto>> Create([FromBody] CreatePartnerSupportRequestDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);
            var result = await _resourceService.CreatePartnerSupportRequestAsync(dto);
            return Ok(result);
        }

        [HttpPut("{id:int}/status")]
        public async Task<ActionResult<PartnerSupportRequestDto>> UpdateStatus(int id, [FromBody] UpdateSupportRequestStatusDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);
            var updated = await _resourceService.UpdatePartnerSupportRequestStatusAsync(id, dto);
            if (updated == null) return NotFound(new { message = $"Support Request #{id} not found." });
            return Ok(updated);
        }
    }
}
