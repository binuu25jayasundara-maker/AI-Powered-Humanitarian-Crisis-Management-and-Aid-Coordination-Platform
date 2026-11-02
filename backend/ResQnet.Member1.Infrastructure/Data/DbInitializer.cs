using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using ResQnet.Member1.Application.Interfaces;
using ResQnet.Member1.Domain.Entities;

namespace ResQnet.Member1.Infrastructure.Data
{
    public static class DbInitializer
    {
        public static async Task SeedAsync(ApplicationDbContext context, IPasswordHasher passwordHasher)
        {
            if (await context.Users.AnyAsync())
            {
                return; // DB already seeded
            }

            // Seed Organizations
            var dmc = new Organization
            {
                Id = Guid.Parse("11111111-1111-1111-1111-111111111111"),
                Name = "National Disaster Management Centre",
                Code = "DMC-LK",
                Type = "Government",
                ContactEmail = "ops@dmc.gov.lk",
                ContactPhone = "+94 11 213 6136",
                Address = "Vidya Mawatha, Colombo 07, Sri Lanka",
                IsVerified = true,
                VerifiedAt = DateTime.UtcNow
            };

            var slrc = new Organization
            {
                Id = Guid.Parse("22222222-2222-2222-2222-222222222222"),
                Name = "Sri Lanka Red Cross Society",
                Code = "SLRC",
                Type = "NGO",
                ContactEmail = "info@redcross.lk",
                ContactPhone = "+94 11 269 1095",
                Address = "Dharmapala Mawatha, Colombo 07",
                IsVerified = true,
                VerifiedAt = DateTime.UtcNow
            };

            await context.Organizations.AddRangeAsync(dmc, slrc);

            // Seed Roles
            var roles = new[]
            {
                new Role { Id = Guid.NewGuid(), Name = "SystemAdmin", Description = "Full platform administration and security control" },
                new Role { Id = Guid.NewGuid(), Name = "EmergencyCoordinator", Description = "Crisis coordination and high-level case approval" },
                new Role { Id = Guid.NewGuid(), Name = "CaseManager", Description = "Review and handling of assistance cases" },
                new Role { Id = Guid.NewGuid(), Name = "VolunteerCoordinator", Description = "Volunteer registration, scheduling and task matching" },
                new Role { Id = Guid.NewGuid(), Name = "DonorOfficer", Description = "Fundraising campaigns and donation management" },
                new Role { Id = Guid.NewGuid(), Name = "LogisticsManager", Description = "Resource warehouse and delivery management" },
                new Role { Id = Guid.NewGuid(), Name = "ShelterAdmin", Description = "Shelter capacity and occupancy administrator" },
                new Role { Id = Guid.NewGuid(), Name = "Citizen", Description = "Public user requesting aid or tracking requests" }
            };

            await context.Roles.AddRangeAsync(roles);

            // Seed Users with default password "Password@123"
            var defaultPasswordHash = passwordHasher.HashPassword("Password@123");

            var users = new[]
            {
                new User
                {
                    Id = Guid.NewGuid(),
                    FullName = "Platform Administrator",
                    Email = "admin@resqnet.org",
                    PasswordHash = defaultPasswordHash,
                    Role = "SystemAdmin",
                    OrganizationId = dmc.Id,
                    IsActive = true,
                    PhoneNumber = "+94 77 123 4567"
                },
                new User
                {
                    Id = Guid.NewGuid(),
                    FullName = "Chaminda Silva",
                    Email = "coordinator@resqnet.org",
                    PasswordHash = defaultPasswordHash,
                    Role = "EmergencyCoordinator",
                    OrganizationId = dmc.Id,
                    IsActive = true,
                    PhoneNumber = "+94 77 234 5678"
                },
                new User
                {
                    Id = Guid.NewGuid(),
                    FullName = "Nadeesha Perera",
                    Email = "casemanager@resqnet.org",
                    PasswordHash = defaultPasswordHash,
                    Role = "CaseManager",
                    OrganizationId = dmc.Id,
                    IsActive = true,
                    PhoneNumber = "+94 77 345 6789"
                },
                new User
                {
                    Id = Guid.NewGuid(),
                    FullName = "Kasun Jayawardena",
                    Email = "volunteer.coord@resqnet.org",
                    PasswordHash = defaultPasswordHash,
                    Role = "VolunteerCoordinator",
                    OrganizationId = slrc.Id,
                    IsActive = true,
                    PhoneNumber = "+94 77 456 7890"
                },
                new User
                {
                    Id = Guid.NewGuid(),
                    FullName = "Anura Fernando",
                    Email = "donor.officer@resqnet.org",
                    PasswordHash = defaultPasswordHash,
                    Role = "DonorOfficer",
                    OrganizationId = slrc.Id,
                    IsActive = true,
                    PhoneNumber = "+94 77 567 8901"
                },
                new User
                {
                    Id = Guid.NewGuid(),
                    FullName = "Sunil Weerasinghe",
                    Email = "citizen@resqnet.org",
                    PasswordHash = defaultPasswordHash,
                    Role = "Citizen",
                    IsActive = true,
                    PhoneNumber = "+94 77 678 9012"
                }
            };

            await context.Users.AddRangeAsync(users);

            // Seed initial audit log
            var initialAudit = new AuditEvent
            {
                ActorId = "SYSTEM_SEED",
                ActorEmail = "system@resqnet.org",
                Action = "SYSTEM_INITIALIZED",
                EntityName = "System",
                EntityId = "V1.0",
                DetailsJson = "{\"status\": \"Database seeded with baseline roles, orgs, and administrative accounts.\"}",
                Status = "Success"
            };

            await context.AuditEvents.AddAsync(initialAudit);
            await context.SaveChangesAsync();
        }
    }
}
