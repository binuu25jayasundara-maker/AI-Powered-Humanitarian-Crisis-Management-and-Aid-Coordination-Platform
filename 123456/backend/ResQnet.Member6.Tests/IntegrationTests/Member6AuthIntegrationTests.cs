using System;
using System.IdentityModel.Tokens.Jwt;
using System.Net;
using System.Net.Http.Headers;
using System.Security.Claims;
using System.Text;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.IdentityModel.Tokens;
using Xunit;

namespace ResQnet.Member6.Tests.IntegrationTests
{
    public class Member6AuthIntegrationTests : IClassFixture<WebApplicationFactory<Program>>
    {
        private readonly WebApplicationFactory<Program> _factory;
        private const string DevKey = "DEVELOPMENT_ONLY_ResQnet_Secret_Super_Secure_Key_2026!";

        public Member6AuthIntegrationTests(WebApplicationFactory<Program> factory)
        {
            _factory = factory.WithWebHostBuilder(builder =>
            {
                builder.UseEnvironment("Development");
            });
        }

        private static string GenerateJwt(string role)
        {
            var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(DevKey));
            var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);
            var claims = new[]
            {
                new Claim(JwtRegisteredClaimNames.Sub, Guid.NewGuid().ToString()),
                new Claim(JwtRegisteredClaimNames.Email, "volunteer_coord@resqnet.org"),
                new Claim("email", "volunteer_coord@resqnet.org"),
                new Claim(ClaimTypes.Role, role),
                new Claim("role", role)
            };
            var token = new JwtSecurityToken(
                issuer: "ResQnet.API",
                audience: "ResQnet.Client",
                claims: claims,
                expires: DateTime.UtcNow.AddHours(1),
                signingCredentials: credentials);
            return new JwtSecurityTokenHandler().WriteToken(token);
        }

        [Fact]
        public async Task VolunteersController_WithoutToken_Returns401Unauthorized()
        {
            var client = _factory.CreateClient();
            var response = await client.GetAsync("/api/volunteers");
            Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
        }

        [Fact]
        public async Task VolunteersController_WithWrongRole_Returns403Forbidden()
        {
            var client = _factory.CreateClient();
            var token = GenerateJwt("Citizen");
            client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

            var response = await client.GetAsync("/api/volunteers");
            Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
        }

        [Fact]
        public async Task VolunteersController_WithCorrectRole_Returns200Ok()
        {
            var client = _factory.CreateClient();
            var token = GenerateJwt("VolunteerCoordinator");
            client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

            var response = await client.GetAsync("/api/volunteers");
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        }

        [Fact]
        public async Task Campaigns_WithDonorOfficer_Returns200Ok()
        {
            var client = _factory.CreateClient();
            var token = GenerateJwt("DonorOfficer");
            client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

            var response = await client.GetAsync("/api/campaigns");
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        }

        [Fact]
        public async Task Notifications_HistoryWithAnyAuthenticatedUser_Returns200Ok()
        {
            var client = _factory.CreateClient();
            var token = GenerateJwt("Citizen");
            client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

            var response = await client.GetAsync("/api/notifications/history");
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        }
    }
}
