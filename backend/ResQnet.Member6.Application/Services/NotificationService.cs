using ResQnet.Member6.Application.DTOs;
using ResQnet.Member6.Application.Interfaces;
using ResQnet.Member6.Domain.Entities;

namespace ResQnet.Member6.Application.Services;

public class NotificationService
{
    private readonly INotificationChannelFactory _channelFactory;
    private readonly IIdempotencyService _idempotencyService;
    private readonly IUnitOfWork _unitOfWork;

    public NotificationService(
        INotificationChannelFactory channelFactory,
        IIdempotencyService idempotencyService,
        IUnitOfWork unitOfWork)
    {
        _channelFactory = channelFactory;
        _idempotencyService = idempotencyService;
        _unitOfWork = unitOfWork;
    }

    public async Task<NotificationResult> SendNotificationAsync(SendNotificationRequest request)
    {
        // 1. Idempotency Check
        if (!string.IsNullOrWhiteSpace(request.IdempotencyKey))
        {
            bool isDuplicate = await _idempotencyService.HasBeenProcessedAsync(request.IdempotencyKey);
            if (isDuplicate)
            {
                return new NotificationResult
                {
                    IsSuccess = true,
                    MessageId = Guid.Empty,
                    ChannelUsed = request.Channel,
                    Recipient = request.Recipient,
                    WasDuplicateSuppressed = true,
                    ErrorMessage = "Duplicate request suppressed by Idempotency check."
                };
            }
        }

        // 2. Factory Pattern: Resolve Channel
        var channel = _channelFactory.GetChannel(request.Channel);
        var result = await channel.SendAsync(request);

        // 3. Persist Notification Record (Outbox/Audit log)
        var record = new NotificationRecord
        {
            Id = result.MessageId != Guid.Empty ? result.MessageId : Guid.NewGuid(),
            Recipient = request.Recipient,
            Channel = request.Channel,
            Subject = request.Subject,
            Body = request.Body,
            Status = result.IsSuccess ? "Sent" : "Failed",
            RetryCount = 0,
            SentAt = DateTime.UtcNow
        };

        await _unitOfWork.Notifications.AddAsync(record);

        // 4. Record Idempotency Key
        if (!string.IsNullOrWhiteSpace(request.IdempotencyKey) && result.IsSuccess)
        {
            await _idempotencyService.RecordProcessedAsync(request.IdempotencyKey, $"Notification_{request.Channel}");
        }

        await _unitOfWork.CompleteAsync();

        return result;
    }

    public async Task<IEnumerable<NotificationRecordDto>> GetNotificationHistoryAsync()
    {
        var records = await _unitOfWork.Notifications.GetAllAsync();
        return records.OrderByDescending(r => r.SentAt).Select(r => new NotificationRecordDto
        {
            Id = r.Id,
            Recipient = r.Recipient,
            Channel = r.Channel,
            Subject = r.Subject,
            Body = r.Body,
            Status = r.Status,
            RetryCount = r.RetryCount,
            SentAt = r.SentAt
        });
    }
}
