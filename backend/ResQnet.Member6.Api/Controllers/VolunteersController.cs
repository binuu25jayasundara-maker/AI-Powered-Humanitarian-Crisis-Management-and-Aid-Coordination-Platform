using Microsoft.AspNetCore.Mvc;
using ResQnet.Member6.Application.DTOs;
using ResQnet.Member6.Application.Services;

namespace ResQnet.Member6.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class VolunteersController : ControllerBase
{
    private readonly VolunteerService _volunteerService;

    public VolunteersController(VolunteerService volunteerService)
    {
        _volunteerService = volunteerService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var volunteers = await _volunteerService.GetAllVolunteersAsync();
        return Ok(volunteers);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var volunteer = await _volunteerService.GetVolunteerByIdAsync(id);
        if (volunteer == null) return NotFound(new { message = $"Volunteer with ID {id} not found." });
        return Ok(volunteer);
    }

    [HttpPost]
    public async Task<IActionResult> Register([FromBody] CreateVolunteerDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.FullName) || string.IsNullOrWhiteSpace(dto.Email))
        {
            return BadRequest(new { message = "Full name and email are required." });
        }

        var created = await _volunteerService.RegisterVolunteerAsync(dto);
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateVolunteerDto dto)
    {
        var updated = await _volunteerService.UpdateVolunteerAsync(id, dto);
        if (!updated) return NotFound(new { message = $"Volunteer with ID {id} not found." });
        return Ok(new { message = "Volunteer updated successfully." });
    }

    [HttpGet("tasks")]
    public async Task<IActionResult> GetAllTasks()
    {
        var tasks = await _volunteerService.GetAllTasksAsync();
        return Ok(tasks);
    }

    [HttpGet("task-matching")]
    public async Task<IActionResult> GetTaskMatching()
    {
        var match = await _volunteerService.GetTaskMatchingRecommendationAsync();
        if (match == null) return NotFound(new { message = "No matching task or volunteer found." });
        return Ok(match);
    }

    [HttpPost("assign-task")]
    public async Task<IActionResult> AssignTask([FromBody] AssignVolunteerTaskDto dto)
    {
        var success = await _volunteerService.AssignVolunteerTaskAsync(dto);
        if (!success) return BadRequest(new { message = "Failed to assign volunteer to task. Verify task and volunteer IDs." });
        return Ok(new { message = "Volunteer successfully assigned to task. Notification dispatched via Observer." });
    }
}
