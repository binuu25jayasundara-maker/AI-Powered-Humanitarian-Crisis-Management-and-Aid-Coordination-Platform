using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using ResQnet.Member6.Application.Interfaces;
using ResQnet.Member6.Domain.Events;

namespace ResQnet.Member6.Infrastructure.Events;

public class DomainEventDispatcher : IDomainEventDispatcher
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<DomainEventDispatcher> _logger;

    public DomainEventDispatcher(IServiceProvider serviceProvider, ILogger<DomainEventDispatcher> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    public async Task DispatchAsync<TEvent>(TEvent domainEvent) where TEvent : IDomainEvent
    {
        _logger.LogInformation("[DISPATCHER] Dispatching domain event: {EventName} (ID: {EventId})",
            domainEvent.EventName, domainEvent.EventId);

        using var scope = _serviceProvider.CreateScope();
        var handlers = scope.ServiceProvider.GetServices<IDomainEventHandler<TEvent>>();

        foreach (var handler in handlers)
        {
            try
            {
                await handler.HandleAsync(domainEvent);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error executing observer handler {HandlerType} for event {EventName}",
                    handler.GetType().Name, domainEvent.EventName);
            }
        }
    }
}
