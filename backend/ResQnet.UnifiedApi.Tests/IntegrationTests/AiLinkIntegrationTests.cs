using System;
using System.Collections.Generic;
using System.IdentityModel.Tokens.Jwt;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Security.Claims;
using System.Text;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.IdentityModel.Tokens;
using ResQnet.UnifiedApi.Data;
using ResQnet.UnifiedApi.Models;
using Xunit;

namespace ResQnet.UnifiedApi.Tests.IntegrationTests
{
    public class AiLinkIntegrationTests : IClassFixture<WebApplicationFactory<Program>>
    {
        private readonly WebApplicationFactory<Program> _factory;
        private const string DevKey = "DEVELOPMENT_ONLY_ResQnet_Secret_Super_Secure_Key_2026!";

        public AiLinkIntegrationTests(WebApplicationFactory<Program> factory)
        {
            _factory = factory.WithWebHostBuilder(builder =>
            {
                builder.UseEnvironment("Development");
                builder.ConfigureServices(services =>
                {
                    var descriptor = services.SingleOrDefault(d => d.ServiceType == typeof(DbContextOptions<CoreDbContext>));
                    if (descriptor != null)
                    {
                        services.Remove(descriptor);
                    }
                    services.AddDbContext<CoreDbContext>(options =>
                    {
                        options.UseInMemoryDatabase("ResQnet_Core_AiLinkTests");
                    });
                });
            });
        }

        private static string GenerateJwt(string role, string email = "")
        {
            var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(DevKey));
            var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);
            var userEmail = string.IsNullOrWhiteSpace(email) ? $"{role.ToLower()}@resqnet.org" : email;

            var claims = new[]
            {
                new Claim(JwtRegisteredClaimNames.Sub, Guid.NewGuid().ToString()),
                new Claim(JwtRegisteredClaimNames.Email, userEmail),
                new Claim("email", userEmail),
                new Claim(ClaimTypes.Email, userEmail),
                new Claim(ClaimTypes.Role, role),
                new Claim("role", role)
            };

            var token = new JwtSecurityToken(
                issuer: "ResQnet.API",
                audience: "ResQnet.Client",
                claims: claims,
                expires: DateTime.UtcNow.AddHours(2),
                signingCredentials: credentials);

            return new JwtSecurityTokenHandler().WriteToken(token);
        }

        private HttpClient CreateAuthorizedClient(string role, string email = "")
        {
            var client = _factory.CreateClient();
            var jwt = GenerateJwt(role, email);
            client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", jwt);
            return client;
        }

        /// <summary>
        /// Helper: creates a citizen assistance request and returns its ID.
        /// </summary>
        private async Task<string> CreateRequestAsync()
        {
            var citizen = CreateAuthorizedClient("Citizen", $"citizen.ailink.{Guid.NewGuid():N}@resqnet.org");
            var resp = await citizen.PostAsJsonAsync("/api/requests", new
            {
                category = "Medical",
                description = "Elderly patient needs diabetes medication urgently.",
                location = "Kolonnawa, Western Province"
            });
            Assert.Equal(HttpStatusCode.Created, resp.StatusCode);
            var body = await resp.Content.ReadFromJsonAsync<ApiResponse<AssistanceRequestDto>>();
            return body!.Data!.Id;
        }

        // ── T1 ─────────────────────────────────────────────────────────────────
        [Fact]
        public async Task PutAiLink_EmergencyCoordinator_ValidPayload_Returns200()
        {
            var reqId = await CreateRequestAsync();
            var coordinator = CreateAuthorizedClient("EmergencyCoordinator", "coordinator@resqnet.org");

            var resp = await coordinator.PutAsJsonAsync($"/api/requests/{reqId}/ai-link",
                new { aiCaseNumber = "#2347" });

            Assert.Equal(HttpStatusCode.OK, resp.StatusCode);
            var body = await resp.Content.ReadFromJsonAsync<ApiResponse<AssistanceRequestDto>>();
            Assert.Equal("#2347", body!.Data!.AiCaseNumber);
        }

        // ── T2 ─────────────────────────────────────────────────────────────────
        [Fact]
        public async Task PutAiLink_CaseManager_ValidPayload_Returns200()
        {
            var reqId = await CreateRequestAsync();
            var caseManager = CreateAuthorizedClient("CaseManager", "casemanager@resqnet.org");

            var resp = await caseManager.PutAsJsonAsync($"/api/requests/{reqId}/ai-link",
                new { aiCaseNumber = "2348" });   // without '#' — should be normalised

            Assert.Equal(HttpStatusCode.OK, resp.StatusCode);
            var body = await resp.Content.ReadFromJsonAsync<ApiResponse<AssistanceRequestDto>>();
            // Normalised to '#' prefix
            Assert.Equal("#2348", body!.Data!.AiCaseNumber);
        }

        // ── T3 ─────────────────────────────────────────────────────────────────
        [Fact]
        public async Task PutAiLink_WithoutToken_Returns401()
        {
            var reqId = await CreateRequestAsync();
            var client = _factory.CreateClient();

            var resp = await client.PutAsJsonAsync($"/api/requests/{reqId}/ai-link",
                new { aiCaseNumber = "#2347" });

            Assert.Equal(HttpStatusCode.Unauthorized, resp.StatusCode);
        }

        // ── T4 ─────────────────────────────────────────────────────────────────
        [Fact]
        public async Task PutAiLink_SystemAdmin_Returns403()
        {
            var reqId = await CreateRequestAsync();
            var admin = CreateAuthorizedClient("SystemAdmin", "admin@resqnet.org");

            var resp = await admin.PutAsJsonAsync($"/api/requests/{reqId}/ai-link",
                new { aiCaseNumber = "#2347" });

            Assert.Equal(HttpStatusCode.Forbidden, resp.StatusCode);
        }

        // ── T5 ─────────────────────────────────────────────────────────────────
        [Fact]
        public async Task PutAiLink_Citizen_Returns403()
        {
            var reqId = await CreateRequestAsync();
            var citizen = CreateAuthorizedClient("Citizen", "citizen.check@resqnet.org");

            var resp = await citizen.PutAsJsonAsync($"/api/requests/{reqId}/ai-link",
                new { aiCaseNumber = "#2347" });

            Assert.Equal(HttpStatusCode.Forbidden, resp.StatusCode);
        }

        // ── T6 ─────────────────────────────────────────────────────────────────
        [Fact]
        public async Task PutAiLink_UnknownRequestId_Returns404()
        {
            var coordinator = CreateAuthorizedClient("EmergencyCoordinator", "coordinator@resqnet.org");

            var resp = await coordinator.PutAsJsonAsync($"/api/requests/{Guid.NewGuid()}/ai-link",
                new { aiCaseNumber = "#2347" });

            Assert.Equal(HttpStatusCode.NotFound, resp.StatusCode);
        }

        // ── T7 ─────────────────────────────────────────────────────────────────
        [Fact]
        public async Task PutAiLink_EmptyAiCaseNumber_Returns400()
        {
            var reqId = await CreateRequestAsync();
            var coordinator = CreateAuthorizedClient("EmergencyCoordinator", "coordinator@resqnet.org");

            var resp = await coordinator.PutAsJsonAsync($"/api/requests/{reqId}/ai-link",
                new { aiCaseNumber = "" });

            Assert.Equal(HttpStatusCode.BadRequest, resp.StatusCode);
        }

        // ── T8 ─────────────────────────────────────────────────────────────────
        [Fact]
        public async Task PutAiLink_InvalidFormat_Returns400()
        {
            var reqId = await CreateRequestAsync();
            var coordinator = CreateAuthorizedClient("EmergencyCoordinator", "coordinator@resqnet.org");

            // Contains letters — not a valid case number
            var resp = await coordinator.PutAsJsonAsync($"/api/requests/{reqId}/ai-link",
                new { aiCaseNumber = "#ABC123" });

            Assert.Equal(HttpStatusCode.BadRequest, resp.StatusCode);
        }

        // ── T9 (replaces original T9) ───────────────────────────────────────────
        [Fact]
        public async Task PutAiLink_SameNumberTwice_Returns200BothTimes()
        {
            var reqId = await CreateRequestAsync();
            var coordinator = CreateAuthorizedClient("EmergencyCoordinator", "coordinator@resqnet.org");

            var resp1 = await coordinator.PutAsJsonAsync($"/api/requests/{reqId}/ai-link",
                new { aiCaseNumber = "#2349" });
            Assert.Equal(HttpStatusCode.OK, resp1.StatusCode);

            // Calling with the same number again must return 200 (idempotent)
            var resp2 = await coordinator.PutAsJsonAsync($"/api/requests/{reqId}/ai-link",
                new { aiCaseNumber = "#2349" });
            Assert.Equal(HttpStatusCode.OK, resp2.StatusCode);
            var body = await resp2.Content.ReadFromJsonAsync<ApiResponse<AssistanceRequestDto>>();
            Assert.Equal("#2349", body!.Data!.AiCaseNumber);
        }

        // ── T10 (new: 409 conflict) ─────────────────────────────────────────────
        [Fact]
        public async Task PutAiLink_DifferentNumberOnAlreadyLinked_Returns409()
        {
            var reqId = await CreateRequestAsync();
            var coordinator = CreateAuthorizedClient("EmergencyCoordinator", "coordinator@resqnet.org");

            // Link to #2350
            var resp1 = await coordinator.PutAsJsonAsync($"/api/requests/{reqId}/ai-link",
                new { aiCaseNumber = "#2350" });
            Assert.Equal(HttpStatusCode.OK, resp1.StatusCode);

            // Try to overwrite with #9999 — must be 409
            var resp2 = await coordinator.PutAsJsonAsync($"/api/requests/{reqId}/ai-link",
                new { aiCaseNumber = "#9999" });
            Assert.Equal(HttpStatusCode.Conflict, resp2.StatusCode);
        }

        // ── T11 ────────────────────────────────────────────────────────────────
        [Fact]
        public async Task GetById_AfterAiLink_StaffSeesAiCaseNumber()
        {
            var reqId = await CreateRequestAsync();
            var coordinator = CreateAuthorizedClient("EmergencyCoordinator", "coordinator@resqnet.org");

            await coordinator.PutAsJsonAsync($"/api/requests/{reqId}/ai-link",
                new { aiCaseNumber = "#2351" });

            var getResp = await coordinator.GetAsync($"/api/requests/{reqId}");
            Assert.Equal(HttpStatusCode.OK, getResp.StatusCode);
            var body = await getResp.Content.ReadFromJsonAsync<ApiResponse<AssistanceRequestDto>>();
            Assert.Equal("#2351", body!.Data!.AiCaseNumber);
        }

        // ── T12: citizen GET mine — no aiCaseNumber ─────────────────────────────
        [Fact]
        public async Task GetMine_AsCitizen_DoesNotExposeAiCaseNumber()
        {
            // Create a request as a unique citizen
            var citizenEmail = $"citizen.mine.{Guid.NewGuid():N}@resqnet.org";
            var citizen = CreateAuthorizedClient("Citizen", citizenEmail);
            var createResp = await citizen.PostAsJsonAsync("/api/requests", new
            {
                category = "Shelter",
                description = "House damaged by floodwater, emergency shelter required.",
                location = "Biyagama, Gampaha District"
            });
            Assert.Equal(HttpStatusCode.Created, createResp.StatusCode);
            var created = await createResp.Content.ReadFromJsonAsync<ApiResponse<AssistanceRequestDto>>();
            var reqId = created!.Data!.Id;

            // Link an AI case as coordinator
            var coordinator = CreateAuthorizedClient("EmergencyCoordinator", "coordinator@resqnet.org");
            await coordinator.PutAsJsonAsync($"/api/requests/{reqId}/ai-link",
                new { aiCaseNumber = "#2352" });

            // Citizen GET mine — aiCaseNumber must be null
            var mineResp = await citizen.GetAsync("/api/requests/mine");
            Assert.Equal(HttpStatusCode.OK, mineResp.StatusCode);
            var mine = await mineResp.Content.ReadFromJsonAsync<ApiResponse<List<AssistanceRequestDto>>>();
            var myReq = mine!.Data!.Find(r => r.Id == reqId);
            Assert.NotNull(myReq);
            Assert.Null(myReq!.AiCaseNumber);
        }

        // ── T13: citizen GET by id — no aiCaseNumber ────────────────────────────
        [Fact]
        public async Task GetById_AsCitizenOwner_DoesNotExposeAiCaseNumber()
        {
            // Create a request as a unique citizen
            var citizenEmail = $"citizen.owner.{Guid.NewGuid():N}@resqnet.org";
            var citizen = CreateAuthorizedClient("Citizen", citizenEmail);
            var createResp = await citizen.PostAsJsonAsync("/api/requests", new
            {
                category = "Food & Water",
                description = "Family of four without food supplies since the flood started.",
                location = "Kelaniya, Gampaha District"
            });
            Assert.Equal(HttpStatusCode.Created, createResp.StatusCode);
            var created = await createResp.Content.ReadFromJsonAsync<ApiResponse<AssistanceRequestDto>>();
            var reqId = created!.Data!.Id;

            // Link an AI case as coordinator
            var coordinator = CreateAuthorizedClient("EmergencyCoordinator", "coordinator@resqnet.org");
            await coordinator.PutAsJsonAsync($"/api/requests/{reqId}/ai-link",
                new { aiCaseNumber = "#2353" });

            // Citizen owner GET by id — aiCaseNumber must be null
            var getResp = await citizen.GetAsync($"/api/requests/{reqId}");
            Assert.Equal(HttpStatusCode.OK, getResp.StatusCode);
            var body = await getResp.Content.ReadFromJsonAsync<ApiResponse<AssistanceRequestDto>>();
            Assert.Null(body!.Data!.AiCaseNumber);
        }
    }
}
