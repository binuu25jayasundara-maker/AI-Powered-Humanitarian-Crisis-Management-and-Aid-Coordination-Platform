using Microsoft.Extensions.Logging;
using ResQnet.Member6.Application.DTOs;
using ResQnet.Member6.Application.Interfaces;
using ResQnet.Member6.Domain.Events;

namespace ResQnet.Member6.Infrastructure.Events;

public class DonationReceivedObserver : IDomainEventHandler<DonationReceivedEvent>
{
    private readonly INotificationChannelFactory _channelFactory;
    private readonly ILogger<DonationReceivedObserver> _logger;

    public DonationReceivedObserver(INotificationChannelFactory channelFactory, ILogger<DonationReceivedObserver> logger)
    {
        _channelFactory = channelFactory;
        _logger = logger;
    }

    public async Task HandleAsync(DonationReceivedEvent domainEvent)
    {
        _logger.LogInformation("[OBSERVER] Handling DonationReceivedEvent from {DonorName} for LKR {Amount}",
            domainEvent.DonorName, domainEvent.Amount);

        // Notify donor acknowledgment
        var emailChannel = _channelFactory.GetChannel("Email");
        await emailChannel.SendAsync(new SendNotificationRequest
        {
            Recipient = $"{domainEvent.DonorName.ToLower().Replace(" ", ".")}@donors.resqnet.org",
            Channel = "Email",
            Subject = $"Thank You for Your Donation to {domainEvent.CampaignTitle}",
            Body = $"Dear {domainEvent.DonorName}, we gratefully acknowledge your contribution of LKR {domainEvent.Amount:N2} towards {domainEvent.CampaignTitle}."
        });
    }
}
