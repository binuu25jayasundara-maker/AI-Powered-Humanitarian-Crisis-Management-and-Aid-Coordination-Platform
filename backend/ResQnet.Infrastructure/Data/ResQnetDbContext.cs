using Microsoft.EntityFrameworkCore;
using ResQnet.Domain.Entities;
using ResQnet.Member1.Domain.Entities;
using ResQnet.Member4.Domain.Entities;
using ResQnet.Member5.Api.Models;
using ResQnet.Member6.Domain.Entities;
using ResQnet.UnifiedApi.Models;

namespace ResQnet.Infrastructure.Data
{
    public class ResQnetDbContext : DbContext
    {
        public ResQnetDbContext(DbContextOptions<ResQnetDbContext> options) : base(options) { }
        // Protected constructor for derived contexts
        protected ResQnetDbContext(DbContextOptions options) : base(options) { }

        // Member 1 - Auth, RBAC & Governance
        public DbSet<User> Users => Set<User>();
        public DbSet<Organization> Organizations => Set<Organization>();
        public DbSet<Role> Roles => Set<Role>();
        public DbSet<Permission> Permissions => Set<Permission>();
        public DbSet<RolePermission> RolePermissions => Set<RolePermission>();
        public DbSet<AuditEvent> AuditEvents => Set<AuditEvent>();
        public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();

        // Member 4 - AI Decision Support & Forecasting
        public DbSet<CrisisCase> CrisisCases => Set<CrisisCase>();
        public DbSet<AiRecommendation> AiRecommendations => Set<AiRecommendation>();
        public DbSet<HumanDecisionAudit> HumanDecisionAudits => Set<HumanDecisionAudit>();
        public DbSet<DuplicateDetectionRecord> DuplicateRecords => Set<DuplicateDetectionRecord>();
        public DbSet<DemandForecast> DemandForecasts => Set<DemandForecast>();

        // Member 5 - Resources, Shelters & Tactical Logistics
        public DbSet<Resource> Resources => Set<Resource>();
        public DbSet<ResourceAllocation> ResourceAllocations => Set<ResourceAllocation>();
        public DbSet<PartnerSupportRequest> PartnerSupportRequests => Set<PartnerSupportRequest>();
        public DbSet<Shelter> Shelters => Set<Shelter>();
        public DbSet<HouseholdAllocation> HouseholdAllocations => Set<HouseholdAllocation>();
        public DbSet<ShelterSupplyRequest> ShelterSupplyRequests => Set<ShelterSupplyRequest>();
        public DbSet<EmergencyRequestReference> EmergencyRequests => Set<EmergencyRequestReference>();
        public DbSet<FloodZoneReference> FloodZones => Set<FloodZoneReference>();

        // Member 6 - Volunteers, Donors, Campaigns & Notifications
        public DbSet<Volunteer> Volunteers => Set<Volunteer>();
        public DbSet<VolunteerTask> VolunteerTasks => Set<VolunteerTask>();
        public DbSet<Campaign> Campaigns => Set<Campaign>();
        public DbSet<Donation> Donations => Set<Donation>();
        public DbSet<NotificationRecord> Notifications => Set<NotificationRecord>();
        public DbSet<NotificationIdempotency> NotificationIdempotencies => Set<NotificationIdempotency>();

        // UnifiedApi - Core Assistance Requests & Events
        public DbSet<AssistanceRequest> AssistanceRequests => Set<AssistanceRequest>();
        public DbSet<RequestStatusHistory> RequestStatusHistories => Set<RequestStatusHistory>();
        public DbSet<CrisisEvent> CrisisEvents => Set<CrisisEvent>();
        public DbSet<OperationalArea> OperationalAreas => Set<OperationalArea>();

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // --- Member 1 Configuration ---
            modelBuilder.Entity<User>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.HasIndex(e => e.Email).IsUnique();
                entity.Property(e => e.FullName).IsRequired().HasMaxLength(150);
                entity.Property(e => e.Email).IsRequired().HasMaxLength(150);
                entity.Property(e => e.Role).IsRequired().HasMaxLength(50);
                entity.HasOne(e => e.Organization)
                      .WithMany(o => o.Users)
                      .HasForeignKey(e => e.OrganizationId)
                      .OnDelete(DeleteBehavior.SetNull);
            });

            modelBuilder.Entity<Organization>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.HasIndex(e => e.Code).IsUnique();
                entity.Property(e => e.Name).IsRequired().HasMaxLength(200);
                entity.Property(e => e.Code).IsRequired().HasMaxLength(50);
            });

            modelBuilder.Entity<Role>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.HasIndex(e => e.Name).IsUnique();
                entity.Property(e => e.Name).IsRequired().HasMaxLength(100);
            });

            modelBuilder.Entity<Permission>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.HasIndex(e => e.Code).IsUnique();
                entity.Property(e => e.Code).IsRequired().HasMaxLength(100);
            });

            modelBuilder.Entity<RolePermission>(entity =>
            {
                entity.HasKey(rp => new { rp.RoleId, rp.PermissionId });
                entity.HasOne(rp => rp.Role)
                      .WithMany(r => r.RolePermissions)
                      .HasForeignKey(rp => rp.RoleId);
                entity.HasOne(rp => rp.Permission)
                      .WithMany()
                      .HasForeignKey(rp => rp.PermissionId);
            });

            modelBuilder.Entity<AuditEvent>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.HasIndex(e => e.CreatedAt);
                entity.HasIndex(e => e.ActorEmail);
                entity.HasIndex(e => e.EntityName);
                entity.Property(e => e.Action).IsRequired().HasMaxLength(100);
                entity.Property(e => e.EntityName).IsRequired().HasMaxLength(100);
            });

            modelBuilder.Entity<RefreshToken>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.HasIndex(e => e.Token).IsUnique();
                entity.HasOne(e => e.User)
                      .WithMany()
                      .HasForeignKey(e => e.UserId)
                      .OnDelete(DeleteBehavior.Cascade);
            });

            // --- Member 4 Configuration ---
            modelBuilder.Entity<CrisisCase>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.HasIndex(e => e.CaseNumber).IsUnique();
                entity.Property(e => e.CaseNumber).IsRequired().HasMaxLength(50);
                entity.Property(e => e.Title).IsRequired().HasMaxLength(250);
                entity.Property(e => e.Status).IsRequired().HasMaxLength(50);
            });

            modelBuilder.Entity<AiRecommendation>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.HasOne(e => e.Case)
                      .WithOne(c => c.Recommendation)
                      .HasForeignKey<AiRecommendation>(e => e.CaseId)
                      .OnDelete(DeleteBehavior.Cascade);
            });

            modelBuilder.Entity<HumanDecisionAudit>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.HasOne(e => e.Case)
                      .WithMany(c => c.DecisionAudits)
                      .HasForeignKey(e => e.CaseId)
                      .OnDelete(DeleteBehavior.Cascade);
            });

            modelBuilder.Entity<DuplicateDetectionRecord>(entity =>
            {
                // The DbSet is named DuplicateRecords, but the physical table is
                // DuplicateDetectionRecords. Map explicitly to avoid EF looking for
                // a non-existent "DuplicateRecords" table.
                entity.ToTable("DuplicateDetectionRecords");
                entity.HasKey(e => e.Id);
                entity.HasOne(e => e.PrimaryCase)
                      .WithMany(c => c.DuplicateRecords)
                      .HasForeignKey(e => e.PrimaryCaseId)
                      .OnDelete(DeleteBehavior.Cascade);
            });

            modelBuilder.Entity<DemandForecast>(entity =>
            {
                entity.HasKey(e => e.Id);
            });

            // --- Member 5 Configuration ---
            modelBuilder.Entity<Resource>(entity =>
            {
                entity.HasKey(r => r.Id);
                entity.Property(r => r.Name).IsRequired().HasMaxLength(120);
                entity.Property(r => r.Category).IsRequired().HasMaxLength(80);
            });

            modelBuilder.Entity<Shelter>(entity =>
            {
                entity.HasKey(s => s.Id);
                entity.Property(s => s.Name).IsRequired().HasMaxLength(150);
                entity.Property(s => s.Location).IsRequired().HasMaxLength(255);
            });

            modelBuilder.Entity<ResourceAllocation>(entity =>
            {
                entity.HasKey(ra => ra.Id);
                entity.HasOne(ra => ra.Resource)
                      .WithMany()
                      .HasForeignKey(ra => ra.ResourceId)
                      .OnDelete(DeleteBehavior.Restrict);
            });

            modelBuilder.Entity<HouseholdAllocation>(entity =>
            {
                entity.HasKey(ha => ha.Id);
                entity.HasOne(ha => ha.Shelter)
                      .WithMany()
                      .HasForeignKey(ha => ha.ShelterId)
                      .OnDelete(DeleteBehavior.Cascade);
            });

            modelBuilder.Entity<ShelterSupplyRequest>(entity =>
            {
                entity.HasKey(ssr => ssr.Id);
                entity.HasOne(ssr => ssr.Shelter)
                      .WithMany()
                      .HasForeignKey(ssr => ssr.ShelterId)
                      .OnDelete(DeleteBehavior.Cascade);
            });

            // --- Member 6 Configuration ---
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
                // Physical table is singular; the DbSet name is plural.
                entity.ToTable("NotificationIdempotency");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.IdempotencyKey).HasMaxLength(150).IsRequired();
                entity.HasIndex(e => e.IdempotencyKey).IsUnique();
            });

            // --- UnifiedApi Configuration ---
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
                e.Property(r => r.AiCaseNumber).HasMaxLength(32);

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

// Backward-compatibility namespace shims mapping Member ApplicationDbContext to ResQnetDbContext
namespace ResQnet.Member1.Infrastructure.Data
{
    public class ApplicationDbContext : ResQnet.Infrastructure.Data.ResQnetDbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options) { }
    }
}

namespace ResQnet.Member4.Infrastructure.Data
{
    public class ApplicationDbContext : ResQnet.Infrastructure.Data.ResQnetDbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options) { }
    }
}

namespace ResQnet.Member5.Api.Data
{
    public class ApplicationDbContext : ResQnet.Infrastructure.Data.ResQnetDbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options) { }
    }
}

namespace ResQnet.Member6.Infrastructure.Data
{
    public class ApplicationDbContext : ResQnet.Infrastructure.Data.ResQnetDbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options) { }
    }
}

namespace ResQnet.UnifiedApi.Data
{
    public class CoreDbContext : ResQnet.Infrastructure.Data.ResQnetDbContext
    {
        public CoreDbContext(DbContextOptions<CoreDbContext> options) : base(options) { }
    }
}
