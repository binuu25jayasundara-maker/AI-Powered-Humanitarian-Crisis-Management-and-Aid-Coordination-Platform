namespace ResQnet.Member6.Application.DTOs;

public class SendNotificationRequest
{
    public string Recipient { get; set; } = string.Empty;
    public string Channel { get; set; } = "Email"; // Email, SMS, Push
    public string Subject { get; set; } = string.Empty;
    public string Body { get; set; } = string.Empty;
    public string? IdempotencyKey { get; set; }
}

public class NotificationResult
{
    public bool IsSuccess { get; set; }
    public Guid MessageId { get; set; }
    public string ChannelUsed { get; set; } = string.Empty;
    public string Recipient { get; set; } = string.Empty;
    public string? ErrorMessage { get; set; }
    public bool WasDuplicateSuppressed { get; set; }
    public DateTime DispatchedAt { get; set; } = DateTime.UtcNow;
}

public class NotificationRecordDto
{
    public Guid Id { get; set; }
    public string Recipient { get; set; } = string.Empty;
    public string Channel { get; set; } = string.Empty;
    public string Subject { get; set; } = string.Empty;
    public string Body { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public int RetryCount { get; set; }
    public DateTime SentAt { get; set; }
}
