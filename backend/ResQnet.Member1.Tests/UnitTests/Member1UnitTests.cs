using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using ResQnet.Member1.Application.DTOs;
using ResQnet.Member1.Application.Services;
using ResQnet.Member1.Domain.Entities;
using ResQnet.Member1.Infrastructure.Data;
using ResQnet.Member1.Infrastructure.Repositories;
using ResQnet.Member1.Infrastructure.Security;
using Xunit;

namespace ResQnet.Member1.Tests.UnitTests
{
    public class Member1UnitTests
    {
        private ApplicationDbContext CreateInMemoryDbContext()
        {
            var options = new DbContextOptionsBuilder<ApplicationDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;
            return new ApplicationDbContext(options);
        }

        private IConfiguration CreateTestConfiguration()
        {
            var myConfiguration = new Dictionary<string, string?>
            {
                {"Jwt:Key", "Test_Secret_Super_Secure_Key_2026_SE205_3_Key!"},
                {"Jwt:Issuer", "ResQnet.API"},
                {"Jwt:Audience", "ResQnet.Client"},
                {"Jwt:ExpiryMinutes", "60"}
            };

            return new ConfigurationBuilder()
                .AddInMemoryCollection(myConfiguration)
                .Build();
        }

        [Fact]
        public void PasswordHasher_ShouldHashAndVerifyPasswordCorrectly()
        {
            // Arrange
            var hasher = new PasswordHasher();
            var rawPassword = "SecurePassword@2026";

            // Act
            var hash = hasher.HashPassword(rawPassword);
            var isCorrect = hasher.VerifyPassword(rawPassword, hash);
            var isWrong = hasher.VerifyPassword("WrongPassword123", hash);

            // Assert
            Assert.NotEmpty(hash);
            Assert.True(isCorrect);
            Assert.False(isWrong);
        }

        [Fact]
        public void JwtTokenGenerator_ShouldGenerateValidTokenWithClaims()
        {
            // Arrange
            var config = CreateTestConfiguration();
            var tokenGen = new JwtTokenGenerator(config);
            var user = new User
            {
                Id = Guid.NewGuid(),
                FullName = "Commander Test",
                Email = "commander@resqnet.org",
                Role = "EmergencyCoordinator"
            };

            // Act
            var token = tokenGen.GenerateToken(user, new[] { user.Role }, new[] { "cases.approve" });
            var refreshToken = tokenGen.GenerateRefreshToken();

            // Assert
            Assert.NotNull(token);
            Assert.NotEmpty(token);
            Assert.NotNull(refreshToken);
            Assert.NotEmpty(refreshToken);
        }

        [Fact]
        public async Task AuthService_Login_WithValidCredentials_ReturnsAuthResponse()
        {
            // Arrange
            using var context = CreateInMemoryDbContext();
            var uow = new UnitOfWork(context);
            var hasher = new PasswordHasher();
            var config = CreateTestConfiguration();
            var tokenGen = new JwtTokenGenerator(config);
            var auditService = new AuditService(uow);

            var password = "Password@123";
            var user = new User
            {
                Id = Guid.NewGuid(),
                FullName = "Admin Test",
                Email = "admin@resqnet.org",
                PasswordHash = hasher.HashPassword(password),
                Role = "SystemAdmin",
                IsActive = true
            };
            await context.Users.AddAsync(user);
            await context.SaveChangesAsync();

            var authService = new AuthService(uow, hasher, tokenGen, auditService);

            // Act
            var response = await authService.LoginAsync(new LoginRequest
            {
                Email = "admin@resqnet.org",
                Password = password
            });

            // Assert
            Assert.NotNull(response);
            Assert.NotEmpty(response.Token);
            Assert.Equal("admin@resqnet.org", response.User.Email);
            Assert.Equal("SystemAdmin", response.User.Role);
        }

        [Fact]
        public async Task AuthService_Login_WithInvalidPassword_ThrowsUnauthorizedException()
        {
            // Arrange
            using var context = CreateInMemoryDbContext();
            var uow = new UnitOfWork(context);
            var hasher = new PasswordHasher();
            var config = CreateTestConfiguration();
            var tokenGen = new JwtTokenGenerator(config);
            var auditService = new AuditService(uow);

            var user = new User
            {
                FullName = "User Test",
                Email = "user@resqnet.org",
                PasswordHash = hasher.HashPassword("CorrectPassword"),
                Role = "Citizen",
                IsActive = true
            };
            await context.Users.AddAsync(user);
            await context.SaveChangesAsync();

            var authService = new AuthService(uow, hasher, tokenGen, auditService);

            // Act & Assert
            await Assert.ThrowsAsync<UnauthorizedAccessException>(async () =>
            {
                await authService.LoginAsync(new LoginRequest
                {
                    Email = "user@resqnet.org",
                    Password = "WrongPassword"
                });
            });
        }

        [Fact]
        public async Task AuditService_LogAsync_CreatesAuditEventRecord()
        {
            // Arrange
            using var context = CreateInMemoryDbContext();
            var uow = new UnitOfWork(context);
            var auditService = new AuditService(uow);

            // Act
            await auditService.LogAsync(
                actorId: "actor-123",
                actorEmail: "actor@resqnet.org",
                action: "USER_DEACTIVATED",
                entityName: "User",
                entityId: "target-456",
                details: new { reason = "Administrative security policy" }
            );

            // Assert
            var logs = await auditService.GetRecentLogsAsync(10);
            Assert.Single(logs);
            Assert.Equal("USER_DEACTIVATED", logs[0].Action);
            Assert.Equal("actor@resqnet.org", logs[0].ActorEmail);
            Assert.Equal("User", logs[0].EntityName);
        }

        [Fact]
        public async Task GenericRepository_AddAndGetById_Succeeds()
        {
            // Arrange
            using var context = CreateInMemoryDbContext();
            var repo = new GenericRepository<Organization>(context);

            var org = new Organization
            {
                Name = "Red Cross Branch",
                Code = "RC-KANDY",
                Type = "NGO",
                ContactEmail = "kandy@redcross.lk"
            };

            // Act
            await repo.AddAsync(org);
            await context.SaveChangesAsync();

            var retrieved = await repo.GetByIdAsync(org.Id);

            // Assert
            Assert.NotNull(retrieved);
            Assert.Equal("RC-KANDY", retrieved.Code);
        }
    }
}
