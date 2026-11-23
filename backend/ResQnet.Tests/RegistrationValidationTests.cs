using System.Net;
using System.Net.Http.Json;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc.Testing;
using Xunit;
using ResQnet.Member1.Application.DTOs;

namespace ResQnet.Tests
{
    /// <summary>
    /// Validation rules for the public registration endpoint.
    /// </summary>
    public class RegistrationValidationTests : IClassFixture<WebApplicationFactory<Program>>
    {
        private readonly WebApplicationFactory<Program> _factory;

        public RegistrationValidationTests(WebApplicationFactory<Program> factory)
        {
            _factory = factory;
        }

        [Fact]
        public async Task Register_WithMissingEmail_ReturnsBadRequest()
        {
            var client = _factory.CreateClient();
            var request = new RegisterRequest
            {
                FullName = "Test Citizen",
                Email = "",
                Password = "Password@123",
                Role = "Citizen"
            };

            var response = await client.PostAsJsonAsync("/api/auth/register", request);

            Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        }

        [Fact]
        public async Task Register_WithMissingPassword_ReturnsBadRequest()
        {
            var client = _factory.CreateClient();
            var request = new RegisterRequest
            {
                FullName = "Test Citizen",
                Email = "test.citizen@resqnet.org",
                Password = "",
                Role = "Citizen"
            };

            var response = await client.PostAsJsonAsync("/api/auth/register", request);

            Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        }

        [Fact]
        public async Task Register_WithMissingFullNameButValidCredentials_IsAccepted()
        {
            // Full name is not a required field in the current contract; this documents
            // the behaviour so a future validation change fails this test deliberately.
            var client = _factory.CreateClient();
            var request = new RegisterRequest
            {
                FullName = "",
                Email = $"test.{System.Guid.NewGuid():N}@resqnet.org",
                Password = "Password@123",
                Role = "Citizen"
            };

            var response = await client.PostAsJsonAsync("/api/auth/register", request);

            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        }
    }
}
