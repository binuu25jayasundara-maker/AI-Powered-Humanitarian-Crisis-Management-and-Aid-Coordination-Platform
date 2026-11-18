using System;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using ResQnet.Member4.Application.DTOs;

namespace ResQnet.Member4.Application.Strategies
{
    public class ExternalLlmAiStrategy : IAiProcessingStrategy
    {
        private readonly HttpClient _httpClient;
        private readonly IConfiguration _configuration;
        private readonly ILogger<ExternalLlmAiStrategy> _logger;
        private readonly RuleBasedAiStrategy _fallbackStrategy;

        public string StrategyName => "ExternalLlmStrategy (Cloud LLM with Fallback)";

        public ExternalLlmAiStrategy(
            HttpClient httpClient,
            IConfiguration configuration,
            ILogger<ExternalLlmAiStrategy> logger)
        {
            _httpClient = httpClient;
            _configuration = configuration;
            _logger = logger;
            _fallbackStrategy = new RuleBasedAiStrategy();

            var timeoutSeconds = 4;
            if (int.TryParse(_configuration["AI:TimeoutSeconds"], out var parsed) && parsed > 0)
            {
                timeoutSeconds = parsed;
            }

            try
            {
                _httpClient.Timeout = TimeSpan.FromSeconds(timeoutSeconds);
            }
            catch (InvalidOperationException)
            {
                // Timeout can only be set before any requests are initiated on HttpClient
            }
        }

        public static string MaskPii(string input)
        {
            if (string.IsNullOrEmpty(input)) return input;

            // Mask email addresses
            var emailRegex = new Regex(@"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b", RegexOptions.Compiled);
            var masked = emailRegex.Replace(input, "[REDACTED_EMAIL]");

            // Mask phone numbers (e.g. +94 77 123 4567, 077-1234567, 123-456-7890)
            var phoneRegex = new Regex(@"(?:\+?\d{1,3}[-.\s]?)?\(?\d{2,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{3,4}\b", RegexOptions.Compiled);
            masked = phoneRegex.Replace(masked, "[REDACTED_PHONE]");

            return masked;
        }

        public async Task<AiRecommendationDto> GenerateRecommendationAsync(string requestDetails, string location, string evidence)
        {
            var apiKey = _configuration["AI:ApiKey"];
            var endpoint = _configuration["AI:Endpoint"];

            if (string.IsNullOrWhiteSpace(apiKey))
            {
                _logger.LogInformation("External AI credentials not provided. Using simulated fallback without network call.");
                var simulated = await _fallbackStrategy.GenerateRecommendationAsync(requestDetails, location, evidence);
                simulated.ProviderStrategy = "simulated";
                return simulated;
            }

            if (string.IsNullOrWhiteSpace(endpoint))
            {
                var fb = await _fallbackStrategy.GenerateRecommendationAsync(requestDetails, location, evidence);
                fb.ProviderStrategy = "rule-based (fallback)";
                return fb;
            }

            try
            {
                var maskedDetails = MaskPii(requestDetails);
                var maskedLocation = MaskPii(location);
                var maskedEvidence = MaskPii(evidence);

                var model = _configuration["AI:Model"] ?? "gpt-4o-mini";
                var payload = new
                {
                    model = model,
                    messages = new object[]
                    {
                        new
                        {
                            role = "system",
                            content = "You are an emergency crisis response AI. Analyze the crisis request and return ONLY a JSON object with properties: category (string), urgency (string), view (string), suggest (string), priorityScore (integer 1-100), confidence (decimal 0.0-1.0), rationale (string)."
                        },
                        new
                        {
                            role = "user",
                            content = $"Location: {maskedLocation}\nDetails: {maskedDetails}\nEvidence: {maskedEvidence}"
                        }
                    },
                    temperature = 0.2
                };

                using var requestMessage = new HttpRequestMessage(HttpMethod.Post, endpoint);
                requestMessage.Headers.Authorization = new AuthenticationHeaderValue("Bearer", apiKey);
                requestMessage.Content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");

                var response = await _httpClient.SendAsync(requestMessage);
                if (response.IsSuccessStatusCode)
                {
                    var body = await response.Content.ReadAsStringAsync();
                    using var doc = JsonDocument.Parse(body);
                    var root = doc.RootElement;
                    if (root.TryGetProperty("choices", out var choices) && choices.GetArrayLength() > 0)
                    {
                        var message = choices[0].GetProperty("message");
                        var content = message.GetProperty("content").GetString() ?? "{}";

                        var jsonText = content.Trim();
                        if (jsonText.StartsWith("```json", StringComparison.OrdinalIgnoreCase))
                        {
                            jsonText = jsonText.Substring(7);
                            if (jsonText.EndsWith("```")) jsonText = jsonText.Substring(0, jsonText.Length - 3);
                        }
                        else if (jsonText.StartsWith("```"))
                        {
                            jsonText = jsonText.Substring(3);
                            if (jsonText.EndsWith("```")) jsonText = jsonText.Substring(0, jsonText.Length - 3);
                        }
                        jsonText = jsonText.Trim();

                        using var parsedDoc = JsonDocument.Parse(jsonText);
                        var pRoot = parsedDoc.RootElement;

                        string category = pRoot.TryGetProperty("category", out var cProp) ? cProp.GetString() ?? "Disaster Relief" : "Disaster Relief";
                        string urgency = pRoot.TryGetProperty("urgency", out var uProp) ? uProp.GetString() ?? "High - immediate assistance needed." : "High - immediate assistance needed.";
                        string view = pRoot.TryGetProperty("view", out var vProp) ? vProp.GetString() ?? "Provide shelter, food supplies, medical aid." : "Provide shelter, food supplies, medical aid.";
                        string suggest = pRoot.TryGetProperty("suggest", out var sProp) ? sProp.GetString() ?? "Coordinate with local authorities and NGOs." : "Coordinate with local authorities and NGOs.";
                        int priorityScore = pRoot.TryGetProperty("priorityScore", out var scProp) && scProp.TryGetInt32(out var ps) ? ps : 88;
                        decimal confidence = pRoot.TryGetProperty("confidence", out var confProp) && confProp.TryGetDecimal(out var conf) ? conf : 0.90m;
                        string rationale = pRoot.TryGetProperty("rationale", out var rProp) ? rProp.GetString() ?? "External Cloud LLM analyzed emergency request." : "External Cloud LLM analyzed emergency request.";

                        return new AiRecommendationDto
                        {
                            Id = Guid.NewGuid(),
                            Category = category,
                            Urgency = urgency,
                            View = view,
                            Suggest = suggest,
                            PriorityScore = priorityScore,
                            Confidence = confidence,
                            Rationale = rationale,
                            ProviderStrategy = StrategyName
                        };
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "External AI provider call failed or timed out. Falling back gracefully to rule-based strategy.");
            }

            var fallback = await _fallbackStrategy.GenerateRecommendationAsync(requestDetails, location, evidence);
            fallback.ProviderStrategy = "rule-based (fallback)";
            return fallback;
        }

        public async Task<ChatResponse> AnswerChatAsync(string question, string? caseContext, string language)
        {
            var apiKey = _configuration["AI:ApiKey"];
            if (string.IsNullOrWhiteSpace(apiKey))
            {
                return await _fallbackStrategy.AnswerChatAsync(question, caseContext, language);
            }

            return await _fallbackStrategy.AnswerChatAsync(question, caseContext, language);
        }

        public async Task<DuplicateCheckResult?> CheckDuplicateAsync(string newText, string existingText, string existingCaseNum)
        {
            return await _fallbackStrategy.CheckDuplicateAsync(newText, existingText, existingCaseNum);
        }
    }
}
