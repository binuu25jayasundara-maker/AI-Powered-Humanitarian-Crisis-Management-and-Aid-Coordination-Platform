using ResQnet.Application.Common;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ResQnet.UnifiedApi.Models;
using ResQnet.UnifiedApi.Services;

namespace ResQnet.UnifiedApi.Controllers
{
    [ApiController]
    [Route("api/events")]
    [Authorize]
    public class EventsController : ControllerBase
    {
        private readonly ICrisisEventService _eventService;

        private const string EventReadRoles =
            "EmergencyCoordinator,CaseManager,VolunteerCoordinator,DonorOfficer,LogisticsManager,ShelterAdmin,PartnerOfficer,SystemAdmin";

        public EventsController(ICrisisEventService eventService)
        {
            _eventService = eventService;
        }

        [HttpGet]
        [Authorize(Roles = EventReadRoles)]
        public async Task<IActionResult> GetAll()
        {
            var results = await _eventService.GetAllAsync();
            return Ok(ApiResponse<List<CrisisEventDto>>.Ok(results));
        }

        [HttpGet("{id:guid}")]
        [Authorize(Roles = EventReadRoles)]
        public async Task<IActionResult> GetById(Guid id)
        {
            var result = await _eventService.GetByIdAsync(id);
            if (result == null)
            {
                return NotFound(ApiResponse<object>.Fail("Crisis event not found."));
            }

            return Ok(ApiResponse<CrisisEventDto>.Ok(result));
        }

        [HttpPost]
        [Authorize(Roles = "EmergencyCoordinator")]
        public async Task<IActionResult> Create([FromBody] CreateCrisisEventDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Name))
            {
                return BadRequest(ApiResponse<object>.Fail("Name is required."));
            }

            if (string.IsNullOrWhiteSpace(dto.Type))
            {
                return BadRequest(ApiResponse<object>.Fail("Type is required."));
            }

            if (string.IsNullOrWhiteSpace(dto.Severity))
            {
                return BadRequest(ApiResponse<object>.Fail("Severity is required."));
            }

            try
            {
                var result = await _eventService.CreateAsync(dto);
                return StatusCode(201, ApiResponse<CrisisEventDto>.Ok(result, "Crisis event created successfully."));
            }
            catch (ArgumentException ex)
            {
                return BadRequest(ApiResponse<object>.Fail(ex.Message));
            }
        }

        [HttpPut("{id:guid}")]
        [Authorize(Roles = "EmergencyCoordinator")]
        public async Task<IActionResult> Update(Guid id, [FromBody] UpdateCrisisEventDto dto)
        {
            try
            {
                var result = await _eventService.UpdateAsync(id, dto);
                if (result == null)
                {
                    return NotFound(ApiResponse<object>.Fail("Crisis event not found."));
                }

                return Ok(ApiResponse<CrisisEventDto>.Ok(result, "Crisis event updated successfully."));
            }
            catch (ArgumentException ex)
            {
                return BadRequest(ApiResponse<object>.Fail(ex.Message));
            }
        }

        [HttpPut("{id:guid}/status")]
        [Authorize(Roles = "EmergencyCoordinator")]
        public async Task<IActionResult> SetStatus(Guid id, [FromBody] SetEventStatusDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Status))
            {
                return BadRequest(ApiResponse<object>.Fail("Status is required."));
            }

            try
            {
                var result = await _eventService.SetStatusAsync(id, dto.Status);
                if (result == null)
                {
                    return NotFound(ApiResponse<object>.Fail("Crisis event not found."));
                }

                return Ok(ApiResponse<CrisisEventDto>.Ok(result, "Crisis event status updated successfully."));
            }
            catch (ArgumentException ex)
            {
                return BadRequest(ApiResponse<object>.Fail(ex.Message));
            }
        }

        [HttpPost("{id:guid}/areas")]
        [Authorize(Roles = "EmergencyCoordinator")]
        public async Task<IActionResult> AddArea(Guid id, [FromBody] AddOperationalAreaDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Name))
            {
                return BadRequest(ApiResponse<object>.Fail("Area name is required."));
            }

            if (string.IsNullOrWhiteSpace(dto.District))
            {
                return BadRequest(ApiResponse<object>.Fail("District is required."));
            }

            try
            {
                var result = await _eventService.AddAreaAsync(id, dto);
                if (result == null)
                {
                    return NotFound(ApiResponse<object>.Fail("Crisis event not found."));
                }

                return Ok(ApiResponse<CrisisEventDto>.Ok(result, "Operational area added successfully."));
            }
            catch (ArgumentException ex)
            {
                return BadRequest(ApiResponse<object>.Fail(ex.Message));
            }
        }
    }
}