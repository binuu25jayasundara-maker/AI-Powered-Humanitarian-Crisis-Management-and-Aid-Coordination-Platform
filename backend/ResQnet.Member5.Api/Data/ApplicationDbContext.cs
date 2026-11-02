using Microsoft.EntityFrameworkCore;
using ResQnet.Member5.Api.Models;

namespace ResQnet.Member5.Api.Data
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
            : base(options)
        {
        }

        public DbSet<Resource> Resources => Set<Resource>();
        public DbSet<ResourceAllocation> ResourceAllocations => Set<ResourceAllocation>();
        public DbSet<PartnerSupportRequest> PartnerSupportRequests => Set<PartnerSupportRequest>();
        public DbSet<Shelter> Shelters => Set<Shelter>();
        public DbSet<HouseholdAllocation> HouseholdAllocations => Set<HouseholdAllocation>();
        public DbSet<ShelterSupplyRequest> ShelterSupplyRequests => Set<ShelterSupplyRequest>();
        public DbSet<EmergencyRequestReference> EmergencyRequests => Set<EmergencyRequestReference>();
        public DbSet<FloodZoneReference> FloodZones => Set<FloodZoneReference>();

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

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
        }
    }
}
