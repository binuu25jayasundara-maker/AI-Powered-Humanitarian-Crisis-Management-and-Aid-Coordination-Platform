using Microsoft.EntityFrameworkCore;
using ResQnet.Member6.Application.Interfaces;
using ResQnet.Member6.Domain.Entities;
using ResQnet.Member6.Infrastructure.Data;

namespace ResQnet.Member6.Infrastructure.Services;

public class IdempotencyService : IIdempotencyService
{
    private readonly ApplicationDbContext _context;

    public IdempotencyService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<bool> HasBeenProcessedAsync(string idempotencyKey)
    {
        if (string.IsNullOrWhiteSpace(idempotencyKey)) return false;
        return await _context.NotificationIdempotencies.AnyAsync(i => i.IdempotencyKey == idempotencyKey);
    }

    public async Task RecordProcessedAsync(string idempotencyKey, string eventName)
    {
        if (string.IsNullOrWhiteSpace(idempotencyKey)) return;

        var record = new NotificationIdempotency
        {
            Id = Guid.NewGuid(),
            IdempotencyKey = idempotencyKey,
            EventName = eventName,
            ProcessedAt = DateTime.UtcNow
        };

        await _context.NotificationIdempotencies.AddAsync(record);
        await _context.SaveChangesAsync();
    }
}
