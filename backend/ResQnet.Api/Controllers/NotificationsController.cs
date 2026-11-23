using ResQnet.Application.Common;
using System.Linq;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ResQnet.Member6.Application.DTOs;
using ResQnet.Member6.Application.Services;

namespace ResQnet.Member6.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class NotificationsController : ControllerBase
{
    private readonly NotificationService _notificationService;

    public NotificationsController(NotificationService notificationService)
    {
        _notificationService = notificationService;
    }

    [HttpPost("send")]
    [Authorize(Roles = "EmergencyCoordinator,CaseManager,VolunteerCoordinator,DonorOfficer,SystemAdmin")]
    public async Task<IActionResult> Send([FromBody] SendNotificationRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Recipient) || string.IsNullOrWhiteSpace(request.Body))
        {
            return BadRequest(new { message = "Recipient and message body are required." });
        }

        var result = await _notificationService.SendNotificationAsync(request);
        return Ok(result);
    }

    [HttpGet("history")]
    public async Task<IActionResult> GetHistory()
    {
        var history = await _notificationService.GetNotificationHistoryAsync();

        bool isStaff = User.IsInRole("EmergencyCoordinator")
            || User.IsInRole("CaseManager")
            || User.IsInRole("VolunteerCoordinator")
            || User.IsInRole("DonorOfficer")
            || User.IsInRole("SystemAdmin");

        if (isStaff)
        {
            return Ok(history);
        }

        var callerEmail = User.FindFirst(ClaimTypes.Email)?.Value ?? User.FindFirst("email")?.Value;
        if (string.IsNullOrWhiteSpace(callerEmail))
        {
            return Ok(Enumerable.Empty<NotificationRecordDto>());
        }

        var myHistory = history.Where(n => string.Equals(n.Recipient, callerEmail, StringComparison.OrdinalIgnoreCase));
        return Ok(myHistory);
    }
}
