using Microsoft.Extensions.Logging;
using ResQnet.Member6.Application.DTOs;
using ResQnet.Member6.Application.Interfaces;

namespace ResQnet.Member6.Infrastructure.Channels;

public class SmsNotificationChannel : INotificationChannel
{
    private readonly ILogger<SmsNotificationChannel> _logger;

    public string ChannelType => "SMS";

    public SmsNotificationChannel(ILogger<SmsNotificationChannel> logger)
    {
        _logger = logger;
    }

    public async Task<NotificationResult> SendAsync(SendNotificationRequest request)
    {
        _logger.LogInformation("[SMS DISPATCH] Sending SMS to {Recipient}: {Body}", request.Recipient, request.Body);

        // Simulate SMS gateway delivery (Twilio / SMS gateway)
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
