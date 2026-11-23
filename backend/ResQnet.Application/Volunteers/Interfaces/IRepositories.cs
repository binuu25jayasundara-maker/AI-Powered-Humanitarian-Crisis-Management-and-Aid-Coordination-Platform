using System.Linq.Expressions;

namespace ResQnet.Member6.Application.Interfaces;

public interface IRepository<T> where T : class
{
    Task<T?> GetByIdAsync(Guid id);
    Task<IEnumerable<T>> GetAllAsync();
    Task<IEnumerable<T>> FindAsync(Expression<Func<T, bool>> predicate);
    Task AddAsync(T entity);
    void Update(T entity);
    void Remove(T entity);
}

public interface IUnitOfWork : IDisposable
{
    IRepository<Domain.Entities.Volunteer> Volunteers { get; }
    IRepository<Domain.Entities.VolunteerTask> VolunteerTasks { get; }
    IRepository<Domain.Entities.Campaign> Campaigns { get; }
    IRepository<Domain.Entities.Donation> Donations { get; }
    IRepository<Domain.Entities.NotificationRecord> Notifications { get; }
    IRepository<Domain.Entities.NotificationIdempotency> NotificationIdempotencies { get; }
    Task<int> CompleteAsync();
}
