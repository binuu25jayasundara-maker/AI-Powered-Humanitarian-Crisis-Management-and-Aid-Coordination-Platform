using Microsoft.EntityFrameworkCore;
using ResQnet.Member6.Domain.Entities;

namespace ResQnet.Member6.Infrastructure.Data;

public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options)
    {
    }

    public DbSet<Volunteer> Volunteers => Set<Volunteer>();
    public DbSet<VolunteerTask> VolunteerTasks => Set<VolunteerTask>();
    public DbSet<Campaign> Campaigns => Set<Campaign>();
    public DbSet<Donation> Donations => Set<Donation>();
    public DbSet<NotificationRecord> Notifications => Set<NotificationRecord>();
    public DbSet<NotificationIdempotency> NotificationIdempotencies => Set<NotificationIdempotency>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<Volunteer>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.FullName).HasMaxLength(150).IsRequired();
            entity.Property(e => e.Email).HasMaxLength(150).IsRequired();
            entity.Property(e => e.PhoneNumber).HasMaxLength(50).IsRequired();
            entity.Property(e => e.Skills).HasMaxLength(250).IsRequired();
            entity.Property(e => e.Status).HasMaxLength(50).IsRequired();
        });

        modelBuilder.Entity<VolunteerTask>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Title).HasMaxLength(250).IsRequired();
            entity.Property(e => e.Category).HasMaxLength(100).IsRequired();
            entity.Property(e => e.Location).HasMaxLength(200).IsRequired();
            entity.Property(e => e.RequiredSkill).HasMaxLength(100).IsRequired();
            entity.Property(e => e.Status).HasMaxLength(50).IsRequired();

            entity.HasOne(e => e.AssignedVolunteer)
                  .WithMany(v => v.AssignedTasks)
                  .HasForeignKey(e => e.AssignedVolunteerId)
                  .OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<Campaign>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Title).HasMaxLength(200).IsRequired();
            entity.Property(e => e.GoalAmount).HasPrecision(18, 2);
            entity.Property(e => e.RaisedAmount).HasPrecision(18, 2);
            entity.Property(e => e.Status).HasMaxLength(50).IsRequired();
        });

        modelBuilder.Entity<Donation>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.DonorName).HasMaxLength(150).IsRequired();
            entity.Property(e => e.Amount).HasPrecision(18, 2);
            entity.Property(e => e.Flag).HasMaxLength(50).IsRequired();

            entity.HasOne(e => e.Campaign)
                  .WithMany(c => c.Donations)
                  .HasForeignKey(e => e.CampaignId)
                  .OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<NotificationRecord>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Recipient).HasMaxLength(150).IsRequired();
            entity.Property(e => e.Channel).HasMaxLength(50).IsRequired();
            entity.Property(e => e.Subject).HasMaxLength(200).IsRequired();
            entity.Property(e => e.Status).HasMaxLength(50).IsRequired();
        });

        modelBuilder.Entity<NotificationIdempotency>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.IdempotencyKey).HasMaxLength(150).IsRequired();
            entity.HasIndex(e => e.IdempotencyKey).IsUnique();
        });
    }
}
