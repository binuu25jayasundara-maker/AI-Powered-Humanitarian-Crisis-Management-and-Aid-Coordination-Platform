using Microsoft.AspNetCore.Mvc;
using ResQnet.Member6.Application.DTOs;
using ResQnet.Member6.Application.Services;

namespace ResQnet.Member6.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class DonationsController : ControllerBase
{
    private readonly DonationService _donationService;

    public DonationsController(DonationService donationService)
    {
        _donationService = donationService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var donations = await _donationService.GetAllDonationsAsync();
        return Ok(donations);
    }

    [HttpPost]
    public async Task<IActionResult> Record([FromBody] CreateDonationDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.DonorName))
        {
            return BadRequest(new { message = "Donor name is required." });
        }

        if (dto.Amount <= 0 && dto.ItemCount <= 0)
        {
            return BadRequest(new { message = "Either monetary amount or item count must be greater than zero." });
        }

        var created = await _donationService.RecordDonationAsync(dto);
        return Ok(created);
    }
}
