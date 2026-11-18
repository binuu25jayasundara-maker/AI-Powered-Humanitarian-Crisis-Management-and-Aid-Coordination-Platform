namespace ResQnet.Member6.Application.Interfaces;

public interface IIdempotencyService
{
    Task<bool> HasBeenProcessedAsync(string idempotencyKey);
    Task RecordProcessedAsync(string idempotencyKey, string eventName);
}
