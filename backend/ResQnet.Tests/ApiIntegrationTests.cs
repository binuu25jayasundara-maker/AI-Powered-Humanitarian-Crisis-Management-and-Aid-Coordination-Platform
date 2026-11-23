using System.Net;
using System.Net.Http.Json;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc.Testing;
using Xunit;
using ResQnet.Application.Common;
using ResQnet.Member1.Application.DTOs;

namespace ResQnet.Tests
{
    public class ApiIntegrationTests : IClassFixture<WebApplicationFactory<Program>>
    {
        private readonly WebApplicationFactory<Program> _factory;

        public ApiIntegrationTests(WebApplicationFactory<Program> factory)
        {
            _factory = factory;
        }

        [Fact]
        public async Task SwaggerEndpoint_ReturnsSuccess()
        {
            var client = _factory.CreateClient();
            var response = await client.GetAsync("/swagger/v1/swagger.json");

            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        }

        [Fact]
        public async Task Login_WithValidSeededAdmin_ReturnsJwtToken()
        {
            var client = _factory.CreateClient();
            var loginRequest = new LoginRequest
            {
                Email = "admin@resqnet.org",
                Password = "Password@123"
            };

            var response = await client.PostAsJsonAsync("/api/auth/login", loginRequest);

            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            var body = await response.Content.ReadFromJsonAsync<ApiResponse<AuthResponse>>();
            Assert.NotNull(body);
            Assert.True(body.Success);
            Assert.NotNull(body.Data?.Token);
            Assert.Equal("SystemAdmin", body.Data?.User.Role);
        }

        [Fact]
        public async Task Login_WithInvalidPassword_ReturnsUnauthorized()
        {
            var client = _factory.CreateClient();
            var loginRequest = new LoginRequest
            {
                Email = "admin@resqnet.org",
                Password = "IncorrectPassword"
            };

            var response = await client.PostAsJsonAsync("/api/auth/login", loginRequest);

            Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
        }
    }
}
