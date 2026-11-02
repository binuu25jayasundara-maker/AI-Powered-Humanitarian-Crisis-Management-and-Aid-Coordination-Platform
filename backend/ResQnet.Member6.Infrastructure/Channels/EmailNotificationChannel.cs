using Microsoft.Extensions.Logging;
using ResQnet.Member6.Application.DTOs;
using ResQnet.Member6.Application.Interfaces;

namespace ResQnet.Member6.Infrastructure.Channels;

public class EmailNotificationChannel : INotificationChannel
{
    private readonly ILogger<EmailNotificationChannel> _logger;

    public string ChannelType => "Email";

    public EmailNotificationChannel(ILogger<EmailNotificationChannel> logger)
    {
        _logger = logger;
    }

    public async Task<NotificationResult> SendAsync(SendNotificationRequest request)
    {
        _logger.LogInformation("[EMAIL DISPATCH] Sending email to {Recipient}: {Subject}", request.Recipient, request.Subject);

        // Simulate async email delivery protocol (SMTP / SendGrid API)
        await Task.Delay(10);

        return new NotificationResult
        {
            IsSuccess = true,
            MessageId = Guid.NewGuid(),
            ChannelUsed = ChannelType,
            Recipient = request.Recipient,
            DispatchedAt = DateTime.UtcNow
        };
    }
}
