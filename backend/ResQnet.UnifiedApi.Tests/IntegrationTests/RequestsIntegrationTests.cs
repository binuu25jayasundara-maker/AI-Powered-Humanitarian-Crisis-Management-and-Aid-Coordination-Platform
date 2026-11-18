using System;
using System.Collections.Generic;
using System.IdentityModel.Tokens.Jwt;
using System.Net;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Security.Claims;
using System.Text;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.IdentityModel.Tokens;
using ResQnet.UnifiedApi.Models;
using Xunit;

namespace ResQnet.UnifiedApi.Tests.IntegrationTests
{
    public class RequestsIntegrationTests : IClassFixture<WebApplicationFactory<Program>>
    {
        private readonly WebApplicationFactory<Program> _factory;
        private const string DevKey = "DEVELOPMENT_ONLY_ResQnet_Secret_Super_Secure_Key_2026!";

        public RequestsIntegrationTests(WebApplicationFactory<Program> factory)
        {
            _factory = factory.WithWebHostBuilder(builder =>
            {
                builder.UseEnvironment("Development");
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

        #region 401 Unauthorized Tests

        [Fact]
        public async Task PostRequest_WithoutToken_Returns401()
        {
            var client = _factory.CreateClient();
            var response = await client.PostAsJsonAsync("/api/requests", new
            {
                category = "Medical",
                description = "Emergency medical assistance needed",
                location = "Colombo"
            });

            Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
        }

        [Fact]
        public async Task GetMine_WithoutToken_Returns401()
        {
            var client = _factory.CreateClient();
            var response = await client.GetAsync("/api/requests/mine");
            Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
        }

        [Fact]
        public async Task GetEvents_WithoutToken_Returns401()
        {
            var client = _factory.CreateClient();
            var response = await client.GetAsync("/api/events");
            Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
        }

        #endregion

        #region 403 Forbidden Tests

        [Fact]
        public async Task PostRequest_AsSystemAdmin_Returns403()
        {
            var client = CreateAuthorizedClient("SystemAdmin", "admin@resqnet.org");
            var response = await client.PostAsJsonAsync("/api/requests", new
            {
                category = "Medical",
                description = "Need medication for elderly resident.",
                location = "Kandy"
            });

            Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
        }

        [Fact]
        public async Task GetAllRequests_AsSystemAdmin_Returns403()
        {
            var client = CreateAuthorizedClient("SystemAdmin", "admin@resqnet.org");
            var response = await client.GetAsync("/api/requests");
            Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
        }

        [Fact]
        public async Task GetRequestById_AsSystemAdmin_Returns403()
        {
            var client = CreateAuthorizedClient("SystemAdmin", "admin@resqnet.org");
            var response = await client.GetAsync($"/api/requests/{Guid.NewGuid()}");
            Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
        }

        [Fact]
        public async Task GetAllRequests_AsCitizen_Returns403()
        {
            var client = CreateAuthorizedClient("Citizen", "citizen@resqnet.org");
            var response = await client.GetAsync("/api/requests");
            Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
        }

        [Fact]
        public async Task GetRequestById_AsNonOwnerNonStaff_Returns403()
        {
            // Create a request as citizen1
            var citizen1 = CreateAuthorizedClient("Citizen", "citizen1@resqnet.org");
            var createRes = await citizen1.PostAsJsonAsync("/api/requests", new
            {
                category = "Food & Water",
                description = "Need dry rations for a displaced family.",
                location = "Kelaniya"
            });
            Assert.Equal(HttpStatusCode.Created, createRes.StatusCode);
            var created = await createRes.Content.ReadFromJsonAsync<ApiResponse<AssistanceRequestDto>>();
            var requestId = created!.Data!.Id;

            // citizen2 tries to access citizen1's request
            var citizen2 = CreateAuthorizedClient("Citizen", "citizen2@resqnet.org");
            var getRes = await citizen2.GetAsync($"/api/requests/{requestId}");
            Assert.Equal(HttpStatusCode.Forbidden, getRes.StatusCode);
        }

        [Fact]
        public async Task GetEvents_AsCitizen_Returns403()
        {
            var client = CreateAuthorizedClient("Citizen", "citizen@resqnet.org");
            var response = await client.GetAsync("/api/events");
            Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
        }

        [Fact]
        public async Task GetEvents_AsDonorAndVolunteer_Returns403()
        {
            var client = CreateAuthorizedClient("DonorAndVolunteer", "donor@resqnet.org");
            var response = await client.GetAsync("/api/events");
            Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
        }

        [Fact]
        public async Task PostEvents_AsCaseManager_Returns403()
        {
            var client = CreateAuthorizedClient("CaseManager", "casemanager@resqnet.org");
            var response = await client.PostAsJsonAsync("/api/events", new
            {
                name = "Heavy Storm Event",
                type = "Cyclone",
                severity = "High",
                description = "Coastal storm surge warning"
            });

            Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
        }

        #endregion

        #region Validation 400 Tests

        [Fact]
        public async Task PostRequest_ShortDescription_Returns400()
        {
            var client = CreateAuthorizedClient("Citizen", "citizen@resqnet.org");
            var response = await client.PostAsJsonAsync("/api/requests", new
            {
                category = "Medical",
                description = "Too short",
                location = "Colombo"
            });

            Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        }

        [Fact]
        public async Task PostRequest_LongDescription_Returns400()
        {
            var client = CreateAuthorizedClient("Citizen", "citizen@resqnet.org");
            var response = await client.PostAsJsonAsync("/api/requests", new
            {
                category = "Medical",
                description = new string('A', 1001),
                location = "Colombo"
            });

            Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        }

        [Fact]
        public async Task PostRequest_EmptyLocation_Returns400()
        {
            var client = CreateAuthorizedClient("Citizen", "citizen@resqnet.org");
            var response = await client.PostAsJsonAsync("/api/requests", new
            {
                category = "Medical",
                description = "Medication needed for elderly person.",
                location = ""
            });

            Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        }

        [Fact]
        public async Task PostRequest_InvalidCategory_Returns400()
        {
            var client = CreateAuthorizedClient("Citizen", "citizen@resqnet.org");
            var response = await client.PostAsJsonAsync("/api/requests", new
            {
                category = "RandomCategory",
                description = "Valid length description for assistance request.",
                location = "Colombo"
            });

            Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        }

        #endregion

        #region Citizen Requests and History Tests

        [Fact]
        public async Task PostRequest_ValidInput_CreatesRequestAndHistory()
        {
            var client = CreateAuthorizedClient("Citizen", "test.citizen@resqnet.org");
            var response = await client.PostAsJsonAsync("/api/requests", new
            {
                category = "Food & Water",
                urgency = "High",
                description = "Family of 5 without food supplies following flooding.",
                location = "Kelaniya, Gampaha District",
                lat = 6.9538,
                lng = 79.9167,
                contactPhone = "+94 77 123 4567",
                householdSize = 5
            });

            Assert.Equal(HttpStatusCode.Created, response.StatusCode);
            var result = await response.Content.ReadFromJsonAsync<ApiResponse<AssistanceRequestDto>>();
            Assert.NotNull(result?.Data);
            Assert.StartsWith("REQ-2026-", result!.Data!.Reference);
            Assert.Equal("Submitted", result.Data.Status);
            Assert.Equal("Received", result.Data.CitizenStage);
            Assert.Equal("Food & Water", result.Data.Category);
            Assert.Equal("+94 77 123 4567", result.Data.ContactPhone);

            // Verify history entry written on creation
            Assert.Single(result.Data.History);
            var history = result.Data.History[0];
            Assert.Equal("Submitted", history.OldStatus);
            Assert.Equal("Submitted", history.NewStatus);
            // Non-staff owner sees "Coordination team"
            Assert.Equal("Coordination team", history.ChangedByEmail);
        }

        [Fact]
        public async Task GetMine_ReturnsOnlyCallerRequests()
        {
            var citizenEmailA = "citizen.a@resqnet.org";
            var citizenEmailB = "citizen.b@resqnet.org";

            var clientA = CreateAuthorizedClient("Citizen", citizenEmailA);
            var clientB = CreateAuthorizedClient("Citizen", citizenEmailB);

            // A creates a request
            await clientA.PostAsJsonAsync("/api/requests", new
            {
                category = "Shelter",
                description = "House roof collapsed during heavy rain.",
                location = "Ratnapura"
            });

            var resA = await clientA.GetAsync("/api/requests/mine");
            var resB = await clientB.GetAsync("/api/requests/mine");

            Assert.Equal(HttpStatusCode.OK, resA.StatusCode);
            Assert.Equal(HttpStatusCode.OK, resB.StatusCode);

            var listA = (await resA.Content.ReadFromJsonAsync<ApiResponse<List<AssistanceRequestDto>>>())!.Data!;
            var listB = (await resB.Content.ReadFromJsonAsync<ApiResponse<List<AssistanceRequestDto>>>())!.Data!;

            Assert.True(listA.Count >= 1);
            Assert.Empty(listB);
        }

        #endregion

        #region Status Transition Tests

        [Fact]
        public async Task UpdateStatus_ValidForwardTransition_WritesHistory()
        {
            var citizen = CreateAuthorizedClient("Citizen", "transition.user@resqnet.org");
            var createRes = await citizen.PostAsJsonAsync("/api/requests", new
            {
                category = "Medical",
                description = "Diabetic patient stranded without insulin.",
                location = "Kolonnawa"
            });
            var reqId = (await createRes.Content.ReadFromJsonAsync<ApiResponse<AssistanceRequestDto>>())!.Data!.Id;

            var coordinator = CreateAuthorizedClient("EmergencyCoordinator", "coordinator@resqnet.org");

            // Submitted -> Under Review
            var updateRes1 = await coordinator.PutAsJsonAsync($"/api/requests/{reqId}/status", new
            {
                newStatus = "Under Review",
                note = "Beginning review"
            });
            Assert.Equal(HttpStatusCode.OK, updateRes1.StatusCode);
            var dto1 = (await updateRes1.Content.ReadFromJsonAsync<ApiResponse<AssistanceRequestDto>>())!.Data!;
            Assert.Equal("Under Review", dto1.Status);
            Assert.Equal("Received", dto1.CitizenStage);
            Assert.Equal(2, dto1.History.Count);
            // Staff sees real changedBy email
            Assert.Equal("coordinator@resqnet.org", dto1.History[1].ChangedByEmail);

            // Under Review -> Verified
            var updateRes2 = await coordinator.PutAsJsonAsync($"/api/requests/{reqId}/status", new
            {
                newStatus = "Verified"
            });
            Assert.Equal(HttpStatusCode.OK, updateRes2.StatusCode);
            var dto2 = (await updateRes2.Content.ReadFromJsonAsync<ApiResponse<AssistanceRequestDto>>())!.Data!;
            Assert.Equal("Verified", dto2.Status);
            Assert.Equal("Received", dto2.CitizenStage);
            Assert.Equal(3, dto2.History.Count);

            // Verified -> Prioritised
            var updateRes3 = await coordinator.PutAsJsonAsync($"/api/requests/{reqId}/status", new
            {
                newStatus = "Prioritised"
            });
            Assert.Equal(HttpStatusCode.OK, updateRes3.StatusCode);

            // Prioritised -> Assigned
            var updateRes4 = await coordinator.PutAsJsonAsync($"/api/requests/{reqId}/status", new
            {
                newStatus = "Assigned"
            });
            Assert.Equal(HttpStatusCode.OK, updateRes4.StatusCode);
            var dto4 = (await updateRes4.Content.ReadFromJsonAsync<ApiResponse<AssistanceRequestDto>>())!.Data!;
            Assert.Equal("Assigned", dto4.Status);
            Assert.Equal("Assigned", dto4.CitizenStage);

            // Assigned -> In Progress
            var updateRes5 = await coordinator.PutAsJsonAsync($"/api/requests/{reqId}/status", new
            {
                newStatus = "In Progress"
            });
            Assert.Equal(HttpStatusCode.OK, updateRes5.StatusCode);
            var dto5 = (await updateRes5.Content.ReadFromJsonAsync<ApiResponse<AssistanceRequestDto>>())!.Data!;
            Assert.Equal("In Progress", dto5.Status);
            Assert.Equal("On the way", dto5.CitizenStage);

            // In Progress -> Fulfilled
            var updateRes6 = await coordinator.PutAsJsonAsync($"/api/requests/{reqId}/status", new
            {
                newStatus = "Fulfilled"
            });
            Assert.Equal(HttpStatusCode.OK, updateRes6.StatusCode);
            var dto6 = (await updateRes6.Content.ReadFromJsonAsync<ApiResponse<AssistanceRequestDto>>())!.Data!;
            Assert.Equal("Fulfilled", dto6.Status);
            Assert.Equal("Delivered", dto6.CitizenStage);

            // Fulfilled -> Closed
            var updateRes7 = await coordinator.PutAsJsonAsync($"/api/requests/{reqId}/status", new
            {
                newStatus = "Closed"
            });
            Assert.Equal(HttpStatusCode.OK, updateRes7.StatusCode);
            var dto7 = (await updateRes7.Content.ReadFromJsonAsync<ApiResponse<AssistanceRequestDto>>())!.Data!;
            Assert.Equal("Closed", dto7.Status);
            Assert.Equal("Delivered", dto7.CitizenStage);
        }

        [Fact]
        public async Task UpdateStatus_InvalidTransition_Returns400()
        {
            var citizen = CreateAuthorizedClient("Citizen", "invalid.transition@resqnet.org");
            var createRes = await citizen.PostAsJsonAsync("/api/requests", new
            {
                category = "Medical",
                description = "Immediate medical assistance required.",
                location = "Colombo"
            });
            var reqId = (await createRes.Content.ReadFromJsonAsync<ApiResponse<AssistanceRequestDto>>())!.Data!.Id;

            var coordinator = CreateAuthorizedClient("EmergencyCoordinator", "coordinator@resqnet.org");

            // Attempt invalid jump: Submitted -> Fulfilled
            var res = await coordinator.PutAsJsonAsync($"/api/requests/{reqId}/status", new
            {
                newStatus = "Fulfilled"
            });

            Assert.Equal(HttpStatusCode.BadRequest, res.StatusCode);
        }

        [Fact]
        public async Task UpdateStatus_NeedsInformation_RequiresNote()
        {
            var citizen = CreateAuthorizedClient("Citizen", "needsinfo.user@resqnet.org");
            var createRes = await citizen.PostAsJsonAsync("/api/requests", new
            {
                category = "Food & Water",
                description = "Water supplies needed for village group.",
                location = "Biyagama"
            });
            var reqId = (await createRes.Content.ReadFromJsonAsync<ApiResponse<AssistanceRequestDto>>())!.Data!.Id;

            var coordinator = CreateAuthorizedClient("EmergencyCoordinator", "coordinator@resqnet.org");

            // Advance to Under Review first
            await coordinator.PutAsJsonAsync($"/api/requests/{reqId}/status", new { newStatus = "Under Review" });

            // Attempt Needs Information without note -> 400
            var resNoNote = await coordinator.PutAsJsonAsync($"/api/requests/{reqId}/status", new
            {
                newStatus = "Needs Information"
            });
            Assert.Equal(HttpStatusCode.BadRequest, resNoNote.StatusCode);

            // Attempt Needs Information with note -> 200
            var resWithNote = await coordinator.PutAsJsonAsync($"/api/requests/{reqId}/status", new
            {
                newStatus = "Needs Information",
                note = "Please confirm the exact number of people needing water."
            });
            Assert.Equal(HttpStatusCode.OK, resWithNote.StatusCode);

            // Verify returns to Under Review without note
            var resReturn = await coordinator.PutAsJsonAsync($"/api/requests/{reqId}/status", new
            {
                newStatus = "Under Review"
            });
            Assert.Equal(HttpStatusCode.OK, resReturn.StatusCode);
        }

        [Fact]
        public async Task UpdateStatus_Rejected_RequiresNote()
        {
            var citizen = CreateAuthorizedClient("Citizen", "rejected.user@resqnet.org");
            var createRes = await citizen.PostAsJsonAsync("/api/requests", new
            {
                category = "Other",
                description = "General non-emergency query regarding donations.",
                location = "Colombo"
            });
            var reqId = (await createRes.Content.ReadFromJsonAsync<ApiResponse<AssistanceRequestDto>>())!.Data!.Id;

            var coordinator = CreateAuthorizedClient("EmergencyCoordinator", "coordinator@resqnet.org");

            // Advance to Under Review
            await coordinator.PutAsJsonAsync($"/api/requests/{reqId}/status", new { newStatus = "Under Review" });

            // Rejected without note -> 400
            var resNoNote = await coordinator.PutAsJsonAsync($"/api/requests/{reqId}/status", new
            {
                newStatus = "Rejected"
            });
            Assert.Equal(HttpStatusCode.BadRequest, resNoNote.StatusCode);

            // Rejected with note -> 200
            var resWithNote = await coordinator.PutAsJsonAsync($"/api/requests/{reqId}/status", new
            {
                newStatus = "Rejected",
                note = "Not an emergency assistance request. Redirected to public helpdesk."
            });
            Assert.Equal(HttpStatusCode.OK, resWithNote.StatusCode);
        }

        #endregion

        #region Events Authorization and Endpoints Tests

        [Fact]
        public async Task GetEvents_AsEmergencyCoordinator_Returns200()
        {
            var client = CreateAuthorizedClient("EmergencyCoordinator", "coordinator@resqnet.org");
            var response = await client.GetAsync("/api/events");
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);

            var body = await response.Content.ReadFromJsonAsync<ApiResponse<List<CrisisEventDto>>>();
            Assert.NotNull(body?.Data);
            Assert.True(body!.Data!.Count >= 3);
        }

        [Fact]
        public async Task GetEvents_AsSystemAdmin_Returns200()
        {
            var client = CreateAuthorizedClient("SystemAdmin", "admin@resqnet.org");
            var response = await client.GetAsync("/api/events");
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        }

        [Fact]
        public async Task CreateAndUpdateEvents_AsEmergencyCoordinator_Succeeds()
        {
            var client = CreateAuthorizedClient("EmergencyCoordinator", "coordinator@resqnet.org");

            // 1. Create event
            var createRes = await client.PostAsJsonAsync("/api/events", new
            {
                name = "Galle Coastal Flooding 2026",
                type = "Flood",
                severity = "High",
                description = "Tidal surge causing flooding along Galle coast.",
                startedAt = DateTime.UtcNow.ToString("o")
            });
            Assert.Equal(HttpStatusCode.Created, createRes.StatusCode);
            var created = (await createRes.Content.ReadFromJsonAsync<ApiResponse<CrisisEventDto>>())!.Data!;
            Assert.Equal("Planned", created.Status);
            Assert.Equal("High", created.Severity);
            var eventId = created.Id;

            // 2. Add operational area
            var areaRes = await client.PostAsJsonAsync($"/api/events/{eventId}/areas", new
            {
                name = "Galle Fort",
                district = "Galle",
                populationAtRisk = 5000,
                status = "Affected"
            });
            Assert.Equal(HttpStatusCode.OK, areaRes.StatusCode);

            // 3. Update event status
            var statusRes = await client.PutAsJsonAsync($"/api/events/{eventId}/status", new
            {
                status = "Active"
            });
            Assert.Equal(HttpStatusCode.OK, statusRes.StatusCode);
            var updatedStatus = (await statusRes.Content.ReadFromJsonAsync<ApiResponse<CrisisEventDto>>())!.Data!;
            Assert.Equal("Active", updatedStatus.Status);

            // 4. Update event details
            var updateRes = await client.PutAsJsonAsync($"/api/events/{eventId}", new
            {
                severity = "Critical",
                description = "Updated description: Severe surge ongoing."
            });
            Assert.Equal(HttpStatusCode.OK, updateRes.StatusCode);
            var updated = (await updateRes.Content.ReadFromJsonAsync<ApiResponse<CrisisEventDto>>())!.Data!;
            Assert.Equal("Critical", updated.Severity);
        }

        #endregion
    }
}