using System.Net.Http.Headers;
using System.Net.Sockets;
using System.Text;
using System.Text.Json;
using MailKit;
using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using MimeKit;
using ResQnet.Member6.Application.DTOs;
using ResQnet.Member6.Application.Interfaces;

namespace ResQnet.Member6.Infrastructure.Channels;

/// <summary>
/// Email channel with configurable providers.
///
/// Notifications:Email:Provider =
///   "Simulated" (default) -> logs only, no email leaves the system
///   "Smtp"                -> any SMTP server (Gmail, Mailtrap, Brevo, SES SMTP, ...)
///   "SendGrid"            -> SendGrid v3 REST API
///
/// SMTP uses MailKit, which supports both STARTTLS (587) and implicit SSL (465).
/// When the selected provider is missing its required settings, the channel
/// automatically falls back to simulated mode so demos keep working.
/// </summary>
public class EmailNotificationChannel : INotificationChannel
{
    private const string SendGridClientName = "SendGrid";
    private const int MaxErrorLength = 500;

    private readonly ILogger<EmailNotificationChannel> _logger;
    private readonly IConfiguration _configuration;
    private readonly IHttpClientFactory _httpClientFactory;

    public string ChannelType => "Email";

    public EmailNotificationChannel(
        ILogger<EmailNotificationChannel> logger,
        IConfiguration configuration,
        IHttpClientFactory httpClientFactory)
    {
        _logger = logger;
        _configuration = configuration;
        _httpClientFactory = httpClientFactory;
    }

    public async Task<NotificationResult> SendAsync(SendNotificationRequest request)
    {
        var provider = (_configuration["Notifications:Email:Provider"] ?? "Simulated").Trim();
        var fromAddress = _configuration["Notifications:Email:FromAddress"] ?? "no-reply@resqnet.local";
        var fromName = _configuration["Notifications:Email:FromName"] ?? "ResQnet.AI";

        // Validate the recipient before any provider branch so simulated mode
        // cannot report success for an address that could never be delivered.
        if (string.IsNullOrWhiteSpace(request.Recipient))
        {
            return Failure(request, "Recipient email address is empty.");
        }

        try
        {
            _ = new System.Net.Mail.MailAddress(request.Recipient);
        }
        catch (FormatException)
        {
            return Failure(request, $"Invalid email address: {request.Recipient}");
        }

        if (string.Equals(provider, "Simulated", StringComparison.OrdinalIgnoreCase))
        {
            return await SimulateAsync(request, "provider is Simulated");
        }

        try
        {
            if (string.Equals(provider, "Smtp", StringComparison.OrdinalIgnoreCase))
            {
                return await SendViaSmtpAsync(request, fromAddress, fromName);
            }

            if (string.Equals(provider, "SendGrid", StringComparison.OrdinalIgnoreCase))
            {
                return await SendViaSendGridAsync(request, fromAddress, fromName);
            }

            _logger.LogWarning(
                "[EMAIL CONFIG] Unknown provider '{Provider}'. Falling back to simulated mode.",
                provider);
            return await SimulateAsync(request, $"unknown provider '{provider}'");
        }
        catch (Exception ex)
        {
            var detail = DescribeException(ex);
            _logger.LogError(ex, "[EMAIL ERROR] {Provider} delivery to {Recipient} failed: {Detail}", provider, request.Recipient, detail);
            return Failure(request, detail);
        }
    }

    private async Task<NotificationResult> SendViaSmtpAsync(
        SendNotificationRequest request,
        string fromAddress,
        string fromName)
    {
        var host = _configuration["Notifications:Email:SmtpHost"];
        var port = int.TryParse(_configuration["Notifications:Email:SmtpPort"], out var parsedPort) && parsedPort > 0
            ? parsedPort
            : 587;
        var user = _configuration["Notifications:Email:SmtpUser"];
        var password = _configuration["Notifications:Email:SmtpPassword"];
        var enableSsl = !bool.TryParse(_configuration["Notifications:Email:EnableSsl"], out var parsedSsl) || parsedSsl;
        var socketOptionText = _configuration["Notifications:Email:SmtpSocketOptions"] ?? "Auto";
        var timeoutSeconds = int.TryParse(_configuration["Notifications:TimeoutSeconds"], out var configuredTimeout) && configuredTimeout > 0
            ? Math.Clamp(configuredTimeout, 1, 120)
            : 15;

        if (string.IsNullOrWhiteSpace(host))
        {
            _logger.LogWarning(
                "[EMAIL CONFIG] Provider is Smtp but Notifications:Email:SmtpHost is empty. Falling back to simulated mode.");
            return await SimulateAsync(request, "SmtpHost is not configured");
        }

        if (string.IsNullOrWhiteSpace(user) || string.IsNullOrWhiteSpace(password))
        {
            const string configError = "SMTP is enabled but SmtpUser or SmtpPassword is missing. " +
                                       "Set Notifications:Email:SmtpUser and Notifications:Email:SmtpPassword, " +
                                       "or clear SmtpHost to use simulated mode.";
            _logger.LogWarning("[EMAIL CONFIG] {Detail}", configError);
            return Failure(request, configError);
        }

        // Gmail requires the authenticated mailbox to be the sender. Keep explicit
        // FromAddress values, but replace the placeholder .local default with SmtpUser.
        var effectiveFrom = fromAddress;
        if (string.IsNullOrWhiteSpace(effectiveFrom) || effectiveFrom.EndsWith(".local", StringComparison.OrdinalIgnoreCase))
        {
            effectiveFrom = user;
        }

        var socketOptions = ResolveSocketOptions(socketOptionText, port, enableSsl);
        var attempts = BuildSmtpAttempts(host, port, socketOptions);

        for (var index = 0; index < attempts.Count; index++)
        {
            var attempt = attempts[index];
            try
            {
                await SendOnceAsync(
                    attempt, user, password, effectiveFrom, fromName, request, timeoutSeconds);

                _logger.LogInformation(
                    "[EMAIL SENT] SMTP delivery to {Recipient} via {Host}:{Port} ({SocketOptions}) from {From}.",
                    request.Recipient, attempt.Host, attempt.Port, attempt.SocketOptions, effectiveFrom);

                return Success(request, Guid.NewGuid());
            }
            catch (Exception ex)
            {
                var detail = DescribeException(ex);
                var hasAlternate = index < attempts.Count - 1;
                if (hasAlternate && IsTransportFailure(ex))
                {
                    _logger.LogWarning(ex,
                        "[EMAIL RETRY] {Host}:{Port} ({SocketOptions}) failed: {Detail}. Trying alternate Gmail endpoint.",
                        attempt.Host, attempt.Port, attempt.SocketOptions, detail);
                    continue;
                }
                throw;
            }
        }

        // Unreachable: the loop returns or throws on every path.
        throw new InvalidOperationException("SMTP delivery failed without a reported error.");
    }

    private async Task SendOnceAsync(
        SmtpAttempt attempt,
        string user,
        string password,
        string effectiveFrom,
        string fromName,
        SendNotificationRequest request,
        int timeoutSeconds)
    {
        var message = new MimeMessage
        {
            Subject = string.IsNullOrWhiteSpace(request.Subject) ? "ResQnet Notification" : request.Subject,
            Body = new TextPart("plain") { Text = request.Body ?? string.Empty }
        };
        message.From.Add(new MailboxAddress(fromName, effectiveFrom));
        message.To.Add(MailboxAddress.Parse(request.Recipient));

        using var client = new SmtpClient { Timeout = timeoutSeconds * 1000 };
        await client.ConnectAsync(attempt.Host, attempt.Port, attempt.SocketOptions);
        await client.AuthenticateAsync(user, password);
        await client.SendAsync(message);
        await client.DisconnectAsync(true);
    }

    private static List<SmtpAttempt> BuildSmtpAttempts(string host, int port, SecureSocketOptions options)
    {
        var attempts = new List<SmtpAttempt> { new(host, port, options) };

        // Gmail may reset STARTTLS sessions on 587 in some networks. Implicit
        // SSL on 465 uses the same credentials and usually passes the same
        // firewall, so retry automatically when the first endpoint is reset.
        if (host.Equals("smtp.gmail.com", StringComparison.OrdinalIgnoreCase))
        {
            var alternate = port == 465
                ? new SmtpAttempt(host, 587, SecureSocketOptions.StartTls)
                : new SmtpAttempt(host, 465, SecureSocketOptions.SslOnConnect);

            if (alternate.Port != port) attempts.Add(alternate);
        }

        return attempts;
    }

    private static bool IsTransportFailure(Exception exception)
    {
        var text = DescribeException(exception);
        var transportPhrases = new[]
        {
            "net_io_connectionclosed",
            "connection closed",
            "unexpectedly disconnected",
            "connection reset",
            "actively refused",
            "timed out",
            "end of stream",
            "unexpected end"
        };

        foreach (var phrase in transportPhrases)
        {
            if (text.Contains(phrase, StringComparison.OrdinalIgnoreCase)) return true;
        }

        return HasInner<IOException>(exception) || HasInner<SocketException>(exception);
    }

    private static bool HasInner<TException>(Exception exception) where TException : Exception
    {
        Exception? current = exception;
        while (current is not null)
        {
            if (current is TException) return true;
            current = current.InnerException;
        }
        return false;
    }

    private sealed record SmtpAttempt(string Host, int Port, SecureSocketOptions SocketOptions);

    private static SecureSocketOptions ResolveSocketOptions(string? text, int port, bool enableSsl)
    {
        if (Enum.TryParse<SecureSocketOptions>(text, ignoreCase: true, out var parsed)
            && parsed != SecureSocketOptions.Auto)
        {
            return parsed;
        }

        if (!enableSsl) return SecureSocketOptions.None;
        return port == 465 ? SecureSocketOptions.SslOnConnect : SecureSocketOptions.StartTls;
    }

    private async Task<NotificationResult> SendViaSendGridAsync(
        SendNotificationRequest request,
        string fromAddress,
        string fromName)
    {
        var apiKey = _configuration["Notifications:Email:SendGridApiKey"];
        var endpoint = _configuration["Notifications:Email:SendGridEndpoint"]
                       ?? "https://api.sendgrid.com/v3/mail/send";

        if (string.IsNullOrWhiteSpace(apiKey))
        {
            _logger.LogWarning(
                "[EMAIL CONFIG] Provider is SendGrid but Notifications:Email:SendGridApiKey is empty. Falling back to simulated mode.");
            return await SimulateAsync(request, "SendGridApiKey is not configured");
        }

        var payload = new
        {
            personalizations = new[]
            {
                new { to = new[] { new { email = request.Recipient } } }
            },
            from = new { email = fromAddress, name = fromName },
            subject = string.IsNullOrWhiteSpace(request.Subject) ? "ResQnet Notification" : request.Subject,
            content = new[]
            {
                new { type = "text/plain", value = request.Body }
            }
        };

        using var httpRequest = new HttpRequestMessage(HttpMethod.Post, endpoint)
        {
            Content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json")
        };
        httpRequest.Headers.Authorization = new AuthenticationHeaderValue("Bearer", apiKey);

        var client = _httpClientFactory.CreateClient(SendGridClientName);
        using var response = await client.SendAsync(httpRequest);
        var responseBody = await response.Content.ReadAsStringAsync();

        if (!response.IsSuccessStatusCode)
        {
            _logger.LogWarning(
                "[EMAIL ERROR] SendGrid returned {StatusCode} for {Recipient}: {Body}",
                (int)response.StatusCode, request.Recipient, Truncate(responseBody));
            return Failure(request, $"SendGrid returned {(int)response.StatusCode}: {Truncate(responseBody)}");
        }

        _logger.LogInformation(
            "[EMAIL SENT] SendGrid accepted delivery to {Recipient}.",
            request.Recipient);

        return Success(request, Guid.NewGuid());
    }

    private async Task<NotificationResult> SimulateAsync(SendNotificationRequest request, string reason)
    {
        _logger.LogInformation(
            "[EMAIL SIMULATED] Delivery to {Recipient} skipped ({Reason}). Configure Notifications:Email to enable real sending.",
            request.Recipient, reason);

        await Task.Delay(10);
        return Success(request, Guid.NewGuid(), "Simulated");
    }

    private NotificationResult Success(SendNotificationRequest request, Guid messageId, string deliveryMode = "Live") => new()
    {
        IsSuccess = true,
        MessageId = messageId,
        ChannelUsed = ChannelType,
        Recipient = request.Recipient,
        DeliveryMode = deliveryMode,
        DispatchedAt = DateTime.UtcNow
    };

    private NotificationResult Failure(SendNotificationRequest request, string error) => new()
    {
        IsSuccess = false,
        MessageId = Guid.NewGuid(),
        ChannelUsed = ChannelType,
        Recipient = request.Recipient,
        ErrorMessage = Truncate(error),
        DeliveryMode = "Failed",
        DispatchedAt = DateTime.UtcNow
    };

    /// <summary>
    /// Flatten the exception chain so the API response and UI show the actionable
    /// reason (e.g. SMTP 535 bad credentials, or net_io_connectionclosed) instead
    /// of only "Failure sending mail".
    /// </summary>
    private static string DescribeException(Exception exception)
    {
        var parts = new List<string>();
        var seen = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        Exception? current = exception;

        while (current is not null)
        {
            var message = current.Message?.Trim();
            if (!string.IsNullOrWhiteSpace(message)
                && !message.StartsWith("Failure sending mail", StringComparison.OrdinalIgnoreCase)
                && seen.Add(message))
            {
                if (current is SmtpCommandException command)
                {
                    message = $"SMTP {(int)command.StatusCode} {command.StatusCode}: {message}";
                }
                else if (current is System.Net.Mail.SmtpException legacy && legacy.StatusCode != System.Net.Mail.SmtpStatusCode.GeneralFailure)
                {
                    message = $"SMTP {(int)legacy.StatusCode}: {message}";
                }
                parts.Add(message);
            }
            current = current.InnerException;
        }

        return Truncate(parts.Count == 0 ? "Failure sending mail." : string.Join(" | ", parts));
    }

    private static string Truncate(string? value)
    {
        if (string.IsNullOrWhiteSpace(value)) return "Unknown provider error.";
        return value.Length <= MaxErrorLength ? value : value[..MaxErrorLength];
    }
}
