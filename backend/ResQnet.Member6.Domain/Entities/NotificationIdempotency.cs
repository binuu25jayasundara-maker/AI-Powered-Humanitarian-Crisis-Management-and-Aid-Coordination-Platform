namespace ResQnet.Member6.Domain.Entities;

public class NotificationIdempotency
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string IdempotencyKey { get; set; } = string.Empty; // Unique hash or client-provided key
    public string EventName { get; set; } = string.Empty;
    public DateTime ProcessedAt { get; set; } = DateTime.UtcNow;
}
