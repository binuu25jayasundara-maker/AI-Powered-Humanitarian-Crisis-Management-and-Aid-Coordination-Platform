namespace ResQnet.Member6.Domain.Entities;

public class NotificationRecord
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Recipient { get; set; } = string.Empty;
    public string Channel { get; set; } = "Email"; // 'Email', 'SMS', 'Push'
    public string Subject { get; set; } = string.Empty;
    public string Body { get; set; } = string.Empty;
    public string Status { get; set; } = "Sent"; // 'Pending', 'Sent', 'Failed'
    public int RetryCount { get; set; } = 0;
    public DateTime SentAt { get; set; } = DateTime.UtcNow;
}
