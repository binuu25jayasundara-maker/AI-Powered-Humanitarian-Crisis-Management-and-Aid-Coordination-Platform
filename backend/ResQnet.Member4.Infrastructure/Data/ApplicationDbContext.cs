using Microsoft.EntityFrameworkCore;
using ResQnet.Member4.Domain.Entities;

namespace ResQnet.Member4.Infrastructure.Data
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options)
        {
        }

        public DbSet<CrisisCase> CrisisCases => Set<CrisisCase>();
        public DbSet<AiRecommendation> AiRecommendations => Set<AiRecommendation>();
        public DbSet<HumanDecisionAudit> HumanDecisionAudits => Set<HumanDecisionAudit>();
        public DbSet<DuplicateDetectionRecord> DuplicateRecords => Set<DuplicateDetectionRecord>();
        public DbSet<DemandForecast> DemandForecasts => Set<DemandForecast>();

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

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
        }
    }
}
