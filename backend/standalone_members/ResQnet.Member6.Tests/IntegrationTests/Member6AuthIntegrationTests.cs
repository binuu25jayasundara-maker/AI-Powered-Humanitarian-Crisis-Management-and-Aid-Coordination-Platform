using System;
using System.Collections.Generic;
using System.IdentityModel.Tokens.Jwt;
using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Security.Claims;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.IdentityModel.Tokens;
using ResQnet.Member6.Application.DTOs;
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

        private static string GenerateJwt(string role, string email = "volunteer_coord@resqnet.org")
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
        public async Task Notifications_Send_WithCitizenRole_Returns403Forbidden()
        {
            var client = _factory.CreateClient();
            var token = GenerateJwt("Citizen");
            client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

            var response = await client.PostAsJsonAsync("/api/notifications/send", new
            {
                Recipient = "someone@resqnet.org",
                Channel = "Email",
                Subject = "Alert",
                Body = "Test alert body"
            });
            Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
        }

        [Fact]
        public async Task Notifications_Send_WithStaffRole_Returns200Ok()
        {
            var client = _factory.CreateClient();
            var token = GenerateJwt("EmergencyCoordinator");
            client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

            var response = await client.PostAsJsonAsync("/api/notifications/send", new
            {
                Recipient = "target@resqnet.org",
                Channel = "Email",
                Subject = "Critical Dispatch",
                Body = "Teams dispatched."
            });
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        }

        [Fact]
        public async Task Notifications_History_WithStaffRole_ReturnsAllRecords()
        {
            var client = _factory.CreateClient();
            var token = GenerateJwt("EmergencyCoordinator");
            client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

            var response = await client.GetAsync("/api/notifications/history");
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);

            var records = await response.Content.ReadFromJsonAsync<List<NotificationRecordDto>>();
            Assert.NotNull(records);
            Assert.NotEmpty(records);
        }

        [Fact]
        public async Task Notifications_History_WithNonStaffRole_FiltersOnlyOwnNotifications()
        {
            var client = _factory.CreateClient();
            // Post a notification to user-x using staff token
            var staffToken = GenerateJwt("EmergencyCoordinator");
            client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", staffToken);
            await client.PostAsJsonAsync("/api/notifications/send", new
            {
                Recipient = "exclusive.user@resqnet.org",
                Channel = "Email",
                Subject = "Personal Notification",
                Body = "Specific body"
            });

            // Now fetch as exclusive.user@resqnet.org
            var userToken = GenerateJwt("DonorAndVolunteer", "exclusive.user@resqnet.org");
            client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", userToken);

            var response = await client.GetAsync("/api/notifications/history");
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            var records = await response.Content.ReadFromJsonAsync<List<NotificationRecordDto>>();
            Assert.NotNull(records);
            Assert.All(records, r => Assert.Equal("exclusive.user@resqnet.org", r.Recipient, ignoreCase: true));

            // Now fetch as completely different user
            var otherToken = GenerateJwt("DonorAndVolunteer", "nobody@resqnet.org");
            client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", otherToken);

            var otherResponse = await client.GetAsync("/api/notifications/history");
            Assert.Equal(HttpStatusCode.OK, otherResponse.StatusCode);
            var otherRecords = await otherResponse.Content.ReadFromJsonAsync<List<NotificationRecordDto>>();
            Assert.NotNull(otherRecords);
            Assert.Empty(otherRecords);
        }

        [Fact]
        public async Task Volunteers_Register_DonorAndVolunteer_WithOwnEmail_Returns201()
        {
            var client = _factory.CreateClient();
            var userEmail = $"donorvol.{Guid.NewGuid():N}@resqnet.org";
            var token = GenerateJwt("DonorAndVolunteer", userEmail);
            client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

            var response = await client.PostAsJsonAsync("/api/volunteers", new CreateVolunteerDto
            {
                FullName = "Self Volunteer",
                Email = userEmail,
                PhoneNumber = "+94 77 111 3333",
                Skills = "First Aid"
            });

            Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        }

        [Fact]
        public async Task Volunteers_Register_DonorAndVolunteer_WithOtherEmail_Returns403Forbidden()
        {
            var client = _factory.CreateClient();
            var callerEmail = $"caller.{Guid.NewGuid():N}@resqnet.org";
            var token = GenerateJwt("DonorAndVolunteer", callerEmail);
            client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

            var response = await client.PostAsJsonAsync("/api/volunteers", new CreateVolunteerDto
            {
                FullName = "Impersonated Volunteer",
                Email = "someoneelse@resqnet.org",
                PhoneNumber = "+94 77 111 4444",
                Skills = "Logistics"
            });

            Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
        }

        [Fact]
        public async Task Volunteers_Update_DonorAndVolunteer_OwnershipCheck()
        {
            var client = _factory.CreateClient();
            var userEmail = $"owner.{Guid.NewGuid():N}@resqnet.org";

            // 1. Register profile
            var regToken = GenerateJwt("DonorAndVolunteer", userEmail);
            client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", regToken);
            var regRes = await client.PostAsJsonAsync("/api/volunteers", new CreateVolunteerDto
            {
                FullName = "Owner Volunteer",
                Email = userEmail,
                PhoneNumber = "+94 77 222 5555",
                Skills = "Driving"
            });
            Assert.Equal(HttpStatusCode.Created, regRes.StatusCode);
            var createdVol = await regRes.Content.ReadFromJsonAsync<VolunteerDto>();
            Assert.NotNull(createdVol);

            // 2. Update with same user's token -> 200 OK
            var updateRes = await client.PutAsJsonAsync($"/api/volunteers/{createdVol.Id}", new UpdateVolunteerDto
            {
                FullName = "Owner Volunteer Updated",
                PhoneNumber = "+94 77 222 5556",
                Skills = "Driving, Medical"
            });
            Assert.Equal(HttpStatusCode.OK, updateRes.StatusCode);

            // 3. Update with another DonorAndVolunteer token -> 403 Forbidden
            var impostorToken = GenerateJwt("DonorAndVolunteer", "impostor@resqnet.org");
            client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", impostorToken);
            var impostorRes = await client.PutAsJsonAsync($"/api/volunteers/{createdVol.Id}", new UpdateVolunteerDto
            {
                FullName = "Hacked Profile"
            });
            Assert.Equal(HttpStatusCode.Forbidden, impostorRes.StatusCode);

            // 4. Update with VolunteerCoordinator token -> 200 OK (keeps full access)
            var coordToken = GenerateJwt("VolunteerCoordinator");
            client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", coordToken);
            var coordRes = await client.PutAsJsonAsync($"/api/volunteers/{createdVol.Id}", new UpdateVolunteerDto
            {
                Skills = "Driving, Logistics"
            });
            Assert.Equal(HttpStatusCode.OK, coordRes.StatusCode);
        }
    }
}
