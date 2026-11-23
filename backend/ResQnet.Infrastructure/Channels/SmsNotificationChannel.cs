using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using ResQnet.Member6.Application.DTOs;
using ResQnet.Member6.Application.Interfaces;

namespace ResQnet.Member6.Infrastructure.Channels;

/// <summary>
/// SMS channel with configurable providers.
///
/// Notifications:Sms:Provider =
///   "Simulated" (default) -> logs only, no SMS leaves the system
///   "NotifyLk"            -> Notify.lk gateway (Sri Lanka, https://app.notify.lk/api/v1/send)
///   "Twilio"              -> Twilio Programmable Messaging REST API
///
/// When the selected provider is missing its required settings, the channel
/// automatically falls back to simulated mode so demos keep working.
/// </summary>
public class SmsNotificationChannel : INotificationChannel
{
    private const string NotifyLkClientName = "NotifyLk";
    private const string TwilioClientName = "Twilio";
    private const int MaxErrorLength = 300;

    private readonly ILogger<SmsNotificationChannel> _logger;
    private readonly IConfiguration _configuration;
    private readonly IHttpClientFactory _httpClientFactory;

    public string ChannelType => "SMS";

    public SmsNotificationChannel(
        ILogger<SmsNotificationChannel> logger,
        IConfiguration configuration,
        IHttpClientFactory httpClientFactory)
    {
        _logger = logger;
        _configuration = configuration;
        _httpClientFactory = httpClientFactory;
    }

    public async Task<NotificationResult> SendAsync(SendNotificationRequest request)
    {
        var provider = (_configuration["Notifications:Sms:Provider"] ?? "Simulated").Trim();

        if (string.Equals(provider, "Simulated", StringComparison.OrdinalIgnoreCase))
        {
            return await SimulateAsync(request, "provider is Simulated");
        }

        if (string.IsNullOrWhiteSpace(request.Recipient))
        {
            return Failure(request, "Recipient phone number is empty.");
        }

        try
        {
            if (string.Equals(provider, "NotifyLk", StringComparison.OrdinalIgnoreCase))
            {
                return await SendViaNotifyLkAsync(request);
            }

            if (string.Equals(provider, "Twilio", StringComparison.OrdinalIgnoreCase))
            {
                return await SendViaTwilioAsync(request);
            }

            _logger.LogWarning(
                "[SMS CONFIG] Unknown provider '{Provider}'. Falling back to simulated mode.",
                provider);
            return await SimulateAsync(request, $"unknown provider '{provider}'");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[SMS ERROR] {Provider} delivery to {Recipient} failed.", provider, request.Recipient);
            return Failure(request, Truncate(ex.Message));
        }
    }

    private async Task<NotificationResult> SendViaNotifyLkAsync(SendNotificationRequest request)
    {
        var apiKey = _configuration["Notifications:Sms:NotifyLkApiKey"];
        var userId = _configuration["Notifications:Sms:NotifyLkUserId"];
        var senderId = _configuration["Notifications:Sms:NotifyLkSenderId"];
        var endpoint = _configuration["Notifications:Sms:NotifyLkEndpoint"]
                       ?? "https://app.notify.lk/api/v1/send";

        if (string.IsNullOrWhiteSpace(apiKey) || string.IsNullOrWhiteSpace(userId))
        {
            _logger.LogWarning(
                "[SMS CONFIG] Provider is NotifyLk but NotifyLkApiKey/NotifyLkUserId is empty. Falling back to simulated mode.");
            return await SimulateAsync(request, "NotifyLk credentials are not configured");
        }

        var to = NormalizePhone(request.Recipient, requirePlus: false);
        var payload = new Dictionary<string, string>
        {
            ["user_id"] = userId,
            ["api_key"] = apiKey,
            ["sender_id"] = string.IsNullOrWhiteSpace(senderId) ? "NotifyDEMO" : senderId,
            ["to"] = to,
            ["message"] = request.Body
        };

        var client = _httpClientFactory.CreateClient(NotifyLkClientName);
        using var response = await client.PostAsync(
            endpoint,
            new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json"));
        var responseBody = await response.Content.ReadAsStringAsync();

        if (!response.IsSuccessStatusCode || !LooksLikeNotifyLkSuccess(responseBody))
        {
            _logger.LogWarning(
                "[SMS ERROR] Notify.lk returned {StatusCode} for {Recipient}: {Body}",
                (int)response.StatusCode, to, Truncate(responseBody));
            return Failure(request, $"Notify.lk returned {(int)response.StatusCode}: {Truncate(responseBody)}");
        }

        _logger.LogInformation("[SMS SENT] Notify.lk accepted delivery to {Recipient}.", to);
        return Success(request);
    }

    private async Task<NotificationResult> SendViaTwilioAsync(SendNotificationRequest request)
    {
        var accountSid = _configuration["Notifications:Sms:TwilioAccountSid"];
        var authToken = _configuration["Notifications:Sms:TwilioAuthToken"];
        var fromNumber = _configuration["Notifications:Sms:TwilioFromNumber"];
        var endpoint = _configuration["Notifications:Sms:TwilioEndpoint"]
                       ?? "https://api.twilio.com/2010-04-01";

        if (string.IsNullOrWhiteSpace(accountSid) ||
            string.IsNullOrWhiteSpace(authToken) ||
            string.IsNullOrWhiteSpace(fromNumber))
        {
            _logger.LogWarning(
                "[SMS CONFIG] Provider is Twilio but TwilioAccountSid/TwilioAuthToken/TwilioFromNumber is empty. Falling back to simulated mode.");
            return await SimulateAsync(request, "Twilio credentials are not configured");
        }

        var to = NormalizePhone(request.Recipient, requirePlus: true);
        var from = NormalizePhone(fromNumber, requirePlus: true);
        var url = $"{endpoint.TrimEnd('/')}/Accounts/{accountSid}/Messages.json";

        var client = _httpClientFactory.CreateClient(TwilioClientName);
        using var httpRequest = new HttpRequestMessage(HttpMethod.Post, url)
        {
            Content = new FormUrlEncodedContent(new Dictionary<string, string>
            {
                ["To"] = to,
                ["From"] = from,
                ["Body"] = request.Body
            })
        };
        // Twilio uses HTTP Basic auth with AccountSid as the username.
        var basic = Convert.ToBase64String(Encoding.UTF8.GetBytes($"{accountSid}:{authToken}"));
        httpRequest.Headers.Authorization = new AuthenticationHeaderValue("Basic", basic);

        using var response = await client.SendAsync(httpRequest);
        var responseBody = await response.Content.ReadAsStringAsync();

        if (!response.IsSuccessStatusCode)
        {
            _logger.LogWarning(
                "[SMS ERROR] Twilio returned {StatusCode} for {Recipient}: {Body}",
                (int)response.StatusCode, to, Truncate(responseBody));
            return Failure(request, $"Twilio returned {(int)response.StatusCode}: {Truncate(responseBody)}");
        }

        var messageSid = TryReadJsonString(responseBody, "sid");
        _logger.LogInformation(
            "[SMS SENT] Twilio accepted delivery to {Recipient}. MessageSid={MessageSid}",
            to, messageSid ?? "(none)");

        return Success(request);
    }

    private async Task<NotificationResult> SimulateAsync(SendNotificationRequest request, string reason)
    {
        _logger.LogInformation(
            "[SMS SIMULATED] Delivery to {Recipient} skipped ({Reason}). Configure Notifications:Sms to enable real sending.",
            request.Recipient, reason);

        await Task.Delay(10);
        return Success(request);
    }

    /// <summary>
    /// Notify.lk reports application-level failures inside a 200 response,
    /// e.g. {"status":"error","message":"..."}, so check the payload too.
    /// </summary>
    private static bool LooksLikeNotifyLkSuccess(string responseBody)
    {
        if (string.IsNullOrWhiteSpace(responseBody)) return true;

        try
        {
            using var doc = JsonDocument.Parse(responseBody);
            if (doc.RootElement.ValueKind != JsonValueKind.Object) return true;

            if (doc.RootElement.TryGetProperty("status", out var status) &&
                status.ValueKind == JsonValueKind.String)
            {
                return string.Equals(status.GetString(), "success", StringComparison.OrdinalIgnoreCase);
            }

            return true;
        }
        catch (JsonException)
        {
            // Non-JSON success body; rely on the HTTP status code.
            return true;
        }
    }

    private static string? TryReadJsonString(string json, string propertyName)
    {
        try
        {
            using var doc = JsonDocument.Parse(json);
            return doc.RootElement.ValueKind == JsonValueKind.Object &&
                   doc.RootElement.TryGetProperty(propertyName, out var value) &&
                   value.ValueKind == JsonValueKind.String
                ? value.GetString()
                : null;
        }
        catch (JsonException)
        {
            return null;
        }
    }

    /// <summary>
    /// Normalizes a phone number for the selected provider. Local numbers are
    /// expanded using Notifications:Sms:DefaultCountryCode (default 94 = Sri Lanka).
    /// </summary>
    private string NormalizePhone(string raw, bool requirePlus)
    {
        var trimmed = (raw ?? string.Empty).Trim();
        var digits = new string(trimmed.Where(char.IsDigit).ToArray());
        if (digits.Length == 0) return trimmed;

        var countryCode = _configuration["Notifications:Sms:DefaultCountryCode"] ?? "94";
        var international = trimmed.StartsWith('+') || digits.StartsWith("00");

        if (digits.StartsWith("00")) digits = digits[2..];

        if (!international)
        {
            if (digits.StartsWith('0'))
            {
                digits = countryCode + digits[1..];
            }
            else if (!digits.StartsWith(countryCode, StringComparison.Ordinal))
            {
                digits = countryCode + digits;
            }
        }

        return requirePlus ? "+" + digits : digits;
    }

    private NotificationResult Success(SendNotificationRequest request) => new()
    {
        IsSuccess = true,
        MessageId = Guid.NewGuid(),
        ChannelUsed = ChannelType,
        Recipient = request.Recipient,
        DispatchedAt = DateTime.UtcNow
    };

    private NotificationResult Failure(SendNotificationRequest request, string error) => new()
    {
        IsSuccess = false,
        MessageId = Guid.NewGuid(),
        ChannelUsed = ChannelType,
        Recipient = request.Recipient,
        ErrorMessage = Truncate(error),
        DispatchedAt = DateTime.UtcNow
    };

    private static string Truncate(string? value)
    {
        if (string.IsNullOrWhiteSpace(value)) return "Unknown provider error.";
        return value.Length <= MaxErrorLength ? value : value[..MaxErrorLength];
    }
}
