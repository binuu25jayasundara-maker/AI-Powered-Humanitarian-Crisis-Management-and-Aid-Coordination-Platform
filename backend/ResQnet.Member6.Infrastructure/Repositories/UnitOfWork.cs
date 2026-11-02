using ResQnet.Member6.Application.Interfaces;
using ResQnet.Member6.Domain.Entities;
using ResQnet.Member6.Infrastructure.Data;

namespace ResQnet.Member6.Infrastructure.Repositories;

public class UnitOfWork : IUnitOfWork
{
    private readonly ApplicationDbContext _context;

    public IRepository<Volunteer> Volunteers { get; }
    public IRepository<VolunteerTask> VolunteerTasks { get; }
    public IRepository<Campaign> Campaigns { get; }
    public IRepository<Donation> Donations { get; }
    public IRepository<NotificationRecord> Notifications { get; }
    public IRepository<NotificationIdempotency> NotificationIdempotencies { get; }

    public UnitOfWork(ApplicationDbContext context)
    {
        _context = context;
        Volunteers = new Repository<Volunteer>(_context);
        VolunteerTasks = new Repository<VolunteerTask>(_context);
        Campaigns = new Repository<Campaign>(_context);
        Donations = new Repository<Donation>(_context);
        Notifications = new Repository<NotificationRecord>(_context);
        NotificationIdempotencies = new Repository<NotificationIdempotency>(_context);
    }

    public async Task<int> CompleteAsync()
    {
        return await _context.SaveChangesAsync();
    }

    public void Dispose()
    {
        _context.Dispose();
        GC.SuppressFinalize(this);
    }
}
