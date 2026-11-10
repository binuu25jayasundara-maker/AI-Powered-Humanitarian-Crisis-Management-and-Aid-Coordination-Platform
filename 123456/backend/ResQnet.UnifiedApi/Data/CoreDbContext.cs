using Microsoft.EntityFrameworkCore;
using ResQnet.UnifiedApi.Models;

namespace ResQnet.UnifiedApi.Data
{
    public class CoreDbContext : DbContext
    {
        public CoreDbContext(DbContextOptions<CoreDbContext> options) : base(options) { }

        public DbSet<AssistanceRequest> AssistanceRequests => Set<AssistanceRequest>();
        public DbSet<RequestStatusHistory> RequestStatusHistories => Set<RequestStatusHistory>();
        public DbSet<CrisisEvent> CrisisEvents => Set<CrisisEvent>();
        public DbSet<OperationalArea> OperationalAreas => Set<OperationalArea>();

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<AssistanceRequest>(e =>
            {
                e.HasKey(r => r.Id);
                e.HasIndex(r => r.Reference).IsUnique();
                e.Property(r => r.Reference).IsRequired().HasMaxLength(32);
                e.Property(r => r.CitizenEmail).IsRequired().HasMaxLength(256);
                e.Property(r => r.Category).IsRequired().HasMaxLength(100);
                e.Property(r => r.Urgency).IsRequired().HasMaxLength(30);
                e.Property(r => r.LocationText).IsRequired().HasMaxLength(500);
                e.Property(r => r.ContactPhone).HasMaxLength(50);
                e.Property(r => r.EvidenceName).HasMaxLength(250);

                e.HasMany(r => r.History)
                 .WithOne(h => h.Request)
                 .HasForeignKey(h => h.RequestId)
                 .OnDelete(DeleteBehavior.Cascade);
            });

            modelBuilder.Entity<RequestStatusHistory>(e =>
            {
                e.HasKey(h => h.Id);
                e.Property(h => h.ChangedByEmail).IsRequired().HasMaxLength(256);
            });

            modelBuilder.Entity<CrisisEvent>(e =>
            {
                e.HasKey(ev => ev.Id);
                e.Property(ev => ev.Name).IsRequired().HasMaxLength(200);
                e.Property(ev => ev.Type).IsRequired().HasMaxLength(100);

                e.HasMany(ev => ev.Areas)
                 .WithOne(a => a.CrisisEvent)
                 .HasForeignKey(a => a.CrisisEventId)
                 .OnDelete(DeleteBehavior.Cascade);
            });

            modelBuilder.Entity<OperationalArea>(e =>
            {
                e.HasKey(a => a.Id);
                e.Property(a => a.Name).IsRequired().HasMaxLength(200);
                e.Property(a => a.District).IsRequired().HasMaxLength(200);
            });
        }
    }
}