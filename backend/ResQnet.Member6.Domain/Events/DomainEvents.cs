namespace ResQnet.Member6.Domain.Events;

public interface IDomainEvent
{
    Guid EventId { get; }
    DateTime OccurredOn { get; }
    string EventName { get; }
}

public class VolunteerAssignedEvent : IDomainEvent
{
    public Guid EventId { get; } = Guid.NewGuid();
    public DateTime OccurredOn { get; } = DateTime.UtcNow;
    public string EventName => nameof(VolunteerAssignedEvent);

    public Guid VolunteerId { get; set; }
    public string VolunteerName { get; set; } = string.Empty;
    public string VolunteerEmail { get; set; } = string.Empty;
    public string VolunteerPhone { get; set; } = string.Empty;
    public Guid TaskId { get; set; }
    public string TaskTitle { get; set; } = string.Empty;
    public string Location { get; set; } = string.Empty;
}

public class DonationReceivedEvent : IDomainEvent
{
    public Guid EventId { get; } = Guid.NewGuid();
    public DateTime OccurredOn { get; } = DateTime.UtcNow;
    public string EventName => nameof(DonationReceivedEvent);

    public Guid DonationId { get; set; }
    public string DonorName { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public int ItemCount { get; set; }
    public string Flag { get; set; } = "-";
    public Guid? CampaignId { get; set; }
    public string CampaignTitle { get; set; } = string.Empty;
}
