using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using ResQnet.Member6.Application.DTOs;
using ResQnet.Member6.Application.Services;

namespace ResQnet.Member6.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class VolunteersController : ControllerBase
{
    private readonly VolunteerService _volunteerService;

    public VolunteersController(VolunteerService volunteerService)
    {
        _volunteerService = volunteerService;
    }

    private string? GetCallerEmail()
    {
        return User.FindFirst(ClaimTypes.Email)?.Value
            ?? User.FindFirst("email")?.Value;
    }

    [HttpGet]
    [Authorize(Roles = "VolunteerCoordinator")]
    public async Task<IActionResult> GetAll()
    {
        var volunteers = await _volunteerService.GetAllVolunteersAsync();
        return Ok(volunteers);
    }

    [HttpGet("{id:guid}")]
    [Authorize(Roles = "VolunteerCoordinator,DonorAndVolunteer")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var volunteer = await _volunteerService.GetVolunteerByIdAsync(id);
        if (volunteer == null) return NotFound(new { message = $"Volunteer with ID {id} not found." });

        if (User.IsInRole("DonorAndVolunteer") && !User.IsInRole("VolunteerCoordinator"))
        {
            var callerEmail = GetCallerEmail();
            if (string.IsNullOrWhiteSpace(callerEmail) || !string.Equals(callerEmail, volunteer.Email, StringComparison.OrdinalIgnoreCase))
            {
                return StatusCode(StatusCodes.Status403Forbidden, new { message = "Forbidden: You may only view your own volunteer profile." });
            }
        }

        return Ok(volunteer);
    }

    [HttpPost]
    [Authorize(Roles = "VolunteerCoordinator,DonorAndVolunteer")]
    public async Task<IActionResult> Register([FromBody] CreateVolunteerDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.FullName) || string.IsNullOrWhiteSpace(dto.Email))
        {
            return BadRequest(new { message = "Full name and email are required." });
        }

        if (User.IsInRole("DonorAndVolunteer") && !User.IsInRole("VolunteerCoordinator"))
        {
            var callerEmail = GetCallerEmail();
            if (string.IsNullOrWhiteSpace(callerEmail) || !string.Equals(callerEmail, dto.Email, StringComparison.OrdinalIgnoreCase))
            {
                return StatusCode(StatusCodes.Status403Forbidden, new { message = "Forbidden: You may only register your own volunteer profile." });
            }
        }

        var created = await _volunteerService.RegisterVolunteerAsync(dto);
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
    }

    [HttpPut("{id:guid}")]
    [Authorize(Roles = "VolunteerCoordinator,DonorAndVolunteer")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateVolunteerDto dto)
    {
        var existing = await _volunteerService.GetVolunteerByIdAsync(id);
        if (existing == null) return NotFound(new { message = $"Volunteer with ID {id} not found." });

        if (User.IsInRole("DonorAndVolunteer") && !User.IsInRole("VolunteerCoordinator"))
        {
            var callerEmail = GetCallerEmail();
            if (string.IsNullOrWhiteSpace(callerEmail) || !string.Equals(callerEmail, existing.Email, StringComparison.OrdinalIgnoreCase))
            {
                return StatusCode(StatusCodes.Status403Forbidden, new { message = "Forbidden: You may only update your own volunteer profile." });
            }
        }

        var updated = await _volunteerService.UpdateVolunteerAsync(id, dto);
        if (!updated) return NotFound(new { message = $"Volunteer with ID {id} not found." });
        return Ok(new { message = "Volunteer updated successfully." });
    }

    [HttpGet("tasks")]
    [Authorize(Roles = "VolunteerCoordinator,DonorAndVolunteer")]
    public async Task<IActionResult> GetAllTasks()
    {
        var tasks = await _volunteerService.GetAllTasksAsync();
        if (User.IsInRole("DonorAndVolunteer") && !User.IsInRole("VolunteerCoordinator"))
        {
            var callerEmail = GetCallerEmail();
            var volunteers = await _volunteerService.GetAllVolunteersAsync();
            var myVol = volunteers.FirstOrDefault(v => string.Equals(v.Email, callerEmail, StringComparison.OrdinalIgnoreCase));
            if (myVol != null)
            {
                tasks = tasks.Where(t => t.AssignedVolunteerId == myVol.Id).ToList();
            }
            else
            {
                tasks = Enumerable.Empty<VolunteerTaskDto>();
            }
        }
        return Ok(tasks);
    }

    [HttpGet("task-matching")]
    [Authorize(Roles = "VolunteerCoordinator")]
    public async Task<IActionResult> GetTaskMatching()
    {
        var match = await _volunteerService.GetTaskMatchingRecommendationAsync();
        if (match == null) return NotFound(new { message = "No matching task or volunteer found." });
        return Ok(match);
    }

    [HttpPost("assign-task")]
    [Authorize(Roles = "VolunteerCoordinator")]
    public async Task<IActionResult> AssignTask([FromBody] AssignVolunteerTaskDto dto)
    {
        var success = await _volunteerService.AssignVolunteerTaskAsync(dto);
        if (!success) return BadRequest(new { message = "Failed to assign volunteer to task. Verify task and volunteer IDs." });
        return Ok(new { message = "Volunteer successfully assigned to task. Notification dispatched via Observer." });
    }
}
