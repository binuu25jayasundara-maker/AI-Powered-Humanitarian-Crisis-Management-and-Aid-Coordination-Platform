using Microsoft.Extensions.Logging;
using ResQnet.Member6.Application.DTOs;
using ResQnet.Member6.Application.Interfaces;
using ResQnet.Member6.Domain.Events;

namespace ResQnet.Member6.Infrastructure.Events;

public class VolunteerAssignedObserver : IDomainEventHandler<VolunteerAssignedEvent>
{
    private readonly INotificationChannelFactory _channelFactory;
    private readonly ILogger<VolunteerAssignedObserver> _logger;

    public VolunteerAssignedObserver(INotificationChannelFactory channelFactory, ILogger<VolunteerAssignedObserver> logger)
    {
        _channelFactory = channelFactory;
        _logger = logger;
    }

    public async Task HandleAsync(VolunteerAssignedEvent domainEvent)
    {
        _logger.LogInformation("[OBSERVER] Handling VolunteerAssignedEvent for {VolunteerName} on task {TaskTitle}",
            domainEvent.VolunteerName, domainEvent.TaskTitle);

        // Notify volunteer via SMS and Email channels resolved via factory
        var smsChannel = _channelFactory.GetChannel("SMS");
        await smsChannel.SendAsync(new SendNotificationRequest
        {
            Recipient = domainEvent.VolunteerPhone,
            Channel = "SMS",
            Subject = "Task Assignment",
            Body = $"ResQnet Alert: You have been assigned to '{domainEvent.TaskTitle}' at {domainEvent.Location}. Please report to site."
        });
    }
}
