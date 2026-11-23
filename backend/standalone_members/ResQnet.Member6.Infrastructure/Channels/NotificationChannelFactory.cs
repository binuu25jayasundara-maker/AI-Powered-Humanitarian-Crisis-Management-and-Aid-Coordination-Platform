using ResQnet.Member6.Application.Interfaces;

namespace ResQnet.Member6.Infrastructure.Channels;

public class NotificationChannelFactory : INotificationChannelFactory
{
    private readonly IEnumerable<INotificationChannel> _channels;

    public NotificationChannelFactory(IEnumerable<INotificationChannel> channels)
    {
        _channels = channels;
    }

    public INotificationChannel GetChannel(string channelType)
    {
        var channel = _channels.FirstOrDefault(c => c.ChannelType.Equals(channelType, StringComparison.OrdinalIgnoreCase));
        if (channel == null)
        {
            // Default fallback to Email
            return _channels.FirstOrDefault(c => c.ChannelType.Equals("Email", StringComparison.OrdinalIgnoreCase))
                ?? throw new InvalidOperationException($"No notification channel registered for '{channelType}' and no fallback available.");
        }
        return channel;
    }
}
