using Microsoft.AspNetCore.Mvc;
using ResQnet.Member6.Application.DTOs;
using ResQnet.Member6.Application.Services;

namespace ResQnet.Member6.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CampaignsController : ControllerBase
{
    private readonly CampaignService _campaignService;

    public CampaignsController(CampaignService campaignService)
    {
        _campaignService = campaignService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var campaigns = await _campaignService.GetAllCampaignsAsync();
        return Ok(campaigns);
    }

    [HttpGet("kpis")]
    public async Task<IActionResult> GetKpis()
    {
        var kpis = await _campaignService.GetCampaignKpisAsync();
        return Ok(kpis);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var campaign = await _campaignService.GetCampaignByIdAsync(id);
        if (campaign == null) return NotFound(new { message = $"Campaign with ID {id} not found." });
        return Ok(campaign);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateCampaignDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Title) || dto.GoalAmount <= 0)
        {
            return BadRequest(new { message = "Campaign title and a positive goal amount are required." });
        }

        var created = await _campaignService.CreateCampaignAsync(dto);
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
    }
}
