using ResQnet.Member6.Application.DTOs;

namespace ResQnet.Member6.Application.Interfaces;

public interface INotificationChannel
{
    string ChannelType { get; }
    Task<NotificationResult> SendAsync(SendNotificationRequest request);
}

public interface INotificationChannelFactory
{
    INotificationChannel GetChannel(string channelType);
}
