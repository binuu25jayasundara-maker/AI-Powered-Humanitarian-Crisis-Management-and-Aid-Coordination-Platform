using Microsoft.Extensions.Logging;
using ResQnet.Member6.Application.DTOs;
using ResQnet.Member6.Application.Interfaces;

namespace ResQnet.Member6.Infrastructure.Channels;

public class PushNotificationChannel : INotificationChannel
{
    private readonly ILogger<PushNotificationChannel> _logger;

    public string ChannelType => "Push";

    public PushNotificationChannel(ILogger<PushNotificationChannel> logger)
    {
        _logger = logger;
    }

    public async Task<NotificationResult> SendAsync(SendNotificationRequest request)
    {
        _logger.LogInformation("[PUSH DISPATCH] Sending Push alert to {Recipient}: {Subject}", request.Recipient, request.Subject);

        // Simulate push delivery (Firebase Cloud Messaging / Web Push)
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
