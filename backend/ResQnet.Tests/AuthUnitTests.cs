using Xunit;
using Microsoft.Extensions.Configuration;
using ResQnet.Member1.Infrastructure.Security;
using ResQnet.Member1.Domain.Entities;

namespace ResQnet.Tests
{
    public class AuthUnitTests
    {
        [Fact]
        public void PasswordHasher_HashesAndVerifiesPasswordCorrectly()
        {
            var hasher = new PasswordHasher();
            var password = "Password@123";

            var hash = hasher.HashPassword(password);

            Assert.NotNull(hash);
            Assert.True(hasher.VerifyPassword(password, hash));
            Assert.False(hasher.VerifyPassword("WrongPassword", hash));
        }

        [Fact]
        public void JwtTokenGenerator_GeneratesValidTokenString()
        {
            var config = new ConfigurationBuilder()
                .AddInMemoryCollection(new System.Collections.Generic.Dictionary<string, string?>
                {
                    {"Jwt:Key", "Test_Secret_Key_For_Unit_Testing_1234567890!"},
                    {"Jwt:Issuer", "ResQnet.API"},
                    {"Jwt:Audience", "ResQnet.Client"},
                    {"Jwt:ExpiryMinutes", "60"}
                })
                .Build();

            var generator = new JwtTokenGenerator(config);
            var user = new User
            {
                Id = System.Guid.NewGuid(),
                Email = "test@resqnet.org",
                FullName = "Test Coordinator",
                Role = "EmergencyCoordinator"
            };

            var token = generator.GenerateToken(user, new[] { "EmergencyCoordinator" }, new[] { "cases.approve" });

            Assert.False(string.IsNullOrWhiteSpace(token));
        }
    }
}
