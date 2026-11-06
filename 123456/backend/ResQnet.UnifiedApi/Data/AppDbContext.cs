using Microsoft.EntityFrameworkCore;
using ResQnet.UnifiedApi.Models;

namespace ResQnet.UnifiedApi.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

        public DbSet<User> Users => Set<User>();
        public DbSet<Organization> Organizations => Set<Organization>();
        public DbSet<RoleEntity> Roles => Set<RoleEntity>();
        public DbSet<AuditEventEntity> AuditEvents => Set<AuditEventEntity>();
        public DbSet<DeletedUserRecordEntity> DeletedUserRecords => Set<DeletedUserRecordEntity>();
        public DbSet<CrisisCase> Cases => Set<CrisisCase>();
        public DbSet<ShelterEntity> Shelters => Set<ShelterEntity>();
        public DbSet<HouseholdAllocationEntity> HouseholdAllocations => Set<HouseholdAllocationEntity>();
        public DbSet<ResourceEntity> Resources => Set<ResourceEntity>();
        public DbSet<ResourceAllocationEntity> ResourceAllocations => Set<ResourceAllocationEntity>();
        public DbSet<SupportRequestEntity> SupportRequests => Set<SupportRequestEntity>();
        public DbSet<ShelterSupplyRequestEntity> ShelterSupplyRequests => Set<ShelterSupplyRequestEntity>();
        public DbSet<CampaignEntity> Campaigns => Set<CampaignEntity>();
        public DbSet<DonationEntity> Donations => Set<DonationEntity>();
        public DbSet<DonorProfileEntity> DonorProfiles => Set<DonorProfileEntity>();
        public DbSet<MonetaryDonationEntity> MonetaryDonations => Set<MonetaryDonationEntity>();
        public DbSet<GoodsDonationEntity> GoodsDonations => Set<GoodsDonationEntity>();
        public DbSet<VolunteerEntity> Volunteers => Set<VolunteerEntity>();
        public DbSet<VolunteerRegistrationEntity> VolunteerRegistrations => Set<VolunteerRegistrationEntity>();
        public DbSet<VolunteerScheduleEntity> VolunteerSchedules => Set<VolunteerScheduleEntity>();
        public DbSet<InAppNotificationEntity> InAppNotifications => Set<InAppNotificationEntity>();
        public DbSet<NotificationRecordEntity> NotificationRecords => Set<NotificationRecordEntity>();
        public DbSet<DemandForecastEntity> DemandForecasts => Set<DemandForecastEntity>();

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Configure entity keys and relations if needed
            modelBuilder.Entity<User>().HasKey(u => u.Id);
            modelBuilder.Entity<Organization>().HasKey(o => o.Id);
            modelBuilder.Entity<RoleEntity>().HasKey(r => r.Id);
            modelBuilder.Entity<AuditEventEntity>().HasKey(a => a.Id);
            modelBuilder.Entity<DeletedUserRecordEntity>().HasKey(d => d.Id);
            modelBuilder.Entity<CrisisCase>().HasKey(c => c.Id);
            modelBuilder.Entity<ShelterEntity>().HasKey(s => s.Id);
            modelBuilder.Entity<HouseholdAllocationEntity>().HasKey(h => h.Id);
            modelBuilder.Entity<ResourceEntity>().HasKey(r => r.Id);
            modelBuilder.Entity<ResourceAllocationEntity>().HasKey(a => a.Id);
            modelBuilder.Entity<SupportRequestEntity>().HasKey(s => s.Id);
            modelBuilder.Entity<ShelterSupplyRequestEntity>().HasKey(s => s.Id);
            modelBuilder.Entity<CampaignEntity>().HasKey(c => c.Id);
            modelBuilder.Entity<DonationEntity>().HasKey(d => d.Id);
            modelBuilder.Entity<DonorProfileEntity>().HasKey(d => d.Id);
            modelBuilder.Entity<MonetaryDonationEntity>().HasKey(m => m.Id);
            modelBuilder.Entity<GoodsDonationEntity>().HasKey(g => g.Id);
            modelBuilder.Entity<VolunteerEntity>().HasKey(v => v.Id);
            modelBuilder.Entity<VolunteerRegistrationEntity>().HasKey(v => v.Id);
            modelBuilder.Entity<VolunteerScheduleEntity>().HasKey(v => v.Id);
            modelBuilder.Entity<InAppNotificationEntity>().HasKey(n => n.Id);
            modelBuilder.Entity<NotificationRecordEntity>().HasKey(n => n.Id);
            modelBuilder.Entity<DemandForecastEntity>().HasKey(d => d.Id);
        }
    }
}
