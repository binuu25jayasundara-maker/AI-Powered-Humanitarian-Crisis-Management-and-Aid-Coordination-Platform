using System;
using System.Net;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;

namespace ResQnet.Member5.Api.Middleware
{
    public class ExceptionHandlingMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly ILogger<ExceptionHandlingMiddleware> _logger;

        public ExceptionHandlingMiddleware(RequestDelegate next, ILogger<ExceptionHandlingMiddleware> logger)
        {
            _next = next;
            _logger = logger;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            try
            {
                await _next(context);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "An unhandled exception occurred during request execution: {Message}", ex.Message);
                await HandleExceptionAsync(context, ex);
            }
        }

        private static Task HandleExceptionAsync(HttpContext context, Exception exception)
        {
            context.Response.ContentType = "application/json";

            var statusCode = exception switch
            {
                KeyNotFoundException => HttpStatusCode.NotFound,
                ArgumentException => HttpStatusCode.BadRequest,
                InvalidOperationException => HttpStatusCode.BadRequest, // Validation or over-capacity guard failure
                _ => HttpStatusCode.InternalServerError
            };

            context.Response.StatusCode = (int)statusCode;

            var response = new
            {
                status = context.Response.StatusCode,
                message = exception.Message,
                errorType = exception.GetType().Name,
                timestamp = DateTime.UtcNow
            };

            return context.Response.WriteAsync(JsonSerializer.Serialize(response));
        }
    }
}
