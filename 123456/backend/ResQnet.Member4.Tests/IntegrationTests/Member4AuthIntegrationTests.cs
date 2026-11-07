using System;
using System.IdentityModel.Tokens.Jwt;
using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Security.Claims;
using System.Text;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.IdentityModel.Tokens;
using ResQnet.Member4.Application.DTOs;
using Xunit;

namespace ResQnet.Member4.Tests.IntegrationTests
{
    public class Member4AuthIntegrationTests : IClassFixture<WebApplicationFactory<Program>>
    {
        private readonly WebApplicationFactory<Program> _factory;
        private const string DevKey = "DEVELOPMENT_ONLY_ResQnet_Secret_Super_Secure_Key_2026!";

        public Member4AuthIntegrationTests(WebApplicationFactory<Program> factory)
        {
            _factory = factory.WithWebHostBuilder(builder =>
            {
                builder.UseEnvironment("Development");
            });
        }

        private static string GenerateJwt(string role, string email = "coordinator@resqnet.org")
        {
            var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(DevKey));
            var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);
            var claims = new[]
            {
                new Claim(JwtRegisteredClaimNames.Sub, Guid.NewGuid().ToString()),
                new Claim(JwtRegisteredClaimNames.Email, email),
                new Claim("email", email),
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
        public async Task CasesController_WithoutToken_Returns401Unauthorized()
        {
            var client = _factory.CreateClient();
            var response = await client.GetAsync("/api/cases");
            Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
        }

        [Fact]
        public async Task CasesController_WithWrongRole_Returns403Forbidden()
        {
            var client = _factory.CreateClient();
            var token = GenerateJwt("Citizen");
            client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

            var response = await client.GetAsync("/api/cases");
            Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
        }

        [Fact]
        public async Task CasesController_WithCorrectRole_Returns200Ok()
        {
            var client = _factory.CreateClient();
            var token = GenerateJwt("EmergencyCoordinator");
            client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

            var response = await client.GetAsync("/api/cases");
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        }

        [Fact]
        public async Task Forecasts_WithLogisticsManager_Returns200Ok()
        {
            var client = _factory.CreateClient();
            var token = GenerateJwt("LogisticsManager");
            client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

            var response = await client.GetAsync("/api/ai/forecasts");
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        }

        [Fact]
        public async Task Chat_WithAnyAuthenticatedUser_Returns200Ok()
        {
            var client = _factory.CreateClient();
            var token = GenerateJwt("Citizen");
            client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

            var response = await client.PostAsJsonAsync("/api/ai/chat", new { Question = "Where is the shelter?", CaseNumber = "#2341", Language = "en" });
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        }
    }
}
