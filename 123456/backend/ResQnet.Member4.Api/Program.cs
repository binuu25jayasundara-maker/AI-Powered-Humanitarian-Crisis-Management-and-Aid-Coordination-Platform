using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Builder;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi;
using ResQnet.Member4.Application.Interfaces;
using ResQnet.Member4.Application.Strategies;
using ResQnet.Member4.Infrastructure.Data;
using ResQnet.Member4.Infrastructure.Services;

var builder = WebApplication.CreateBuilder(args);

// 1. Database Context
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
builder.Services.AddDbContext<ApplicationDbContext>(options =>
{
    if (string.Equals(connectionString, "InMemory", StringComparison.OrdinalIgnoreCase))
    {
        options.UseInMemoryDatabase("ResQnet_AI");
    }
    else
    {
        options.UseSqlServer(connectionString);
    }
});

// 2. HTTP Client for External AI
builder.Services.AddHttpClient<ExternalLlmAiStrategy>();

// 3. Register Strategy Pattern implementations
builder.Services.AddSingleton<RuleBasedAiStrategy>();
builder.Services.AddTransient<IAiProcessingStrategy, RuleBasedAiStrategy>();
builder.Services.AddTransient<IAiProcessingStrategy, ExternalLlmAiStrategy>();

// 4. Register Services & AI Gateway
builder.Services.AddScoped<IAiGateway, AiGateway>();
builder.Services.AddScoped<ICaseReviewService, CaseReviewService>();
builder.Services.AddScoped<IAiAssistantService, AiAssistantService>();
builder.Services.AddScoped<IForecastingService, ForecastingService>();

// 5. JWT Authentication
// Production: key MUST come from the Jwt__Key environment variable.
// Development: key falls back to appsettings.Development.json.
// If neither is set the application will refuse to start (fail-fast).
var jwtKey = builder.Configuration["Jwt:Key"];
if (string.IsNullOrWhiteSpace(jwtKey))
{
    jwtKey = Environment.GetEnvironmentVariable("Jwt__Key");
}
if (string.IsNullOrWhiteSpace(jwtKey))
{
    if (builder.Environment.IsProduction())
        throw new InvalidOperationException(
            "JWT signing key is not configured. " +
            "Set the Jwt__Key environment variable before starting in Production.");

    // Development fallback (should be overridden by appsettings.Development.json)
    jwtKey = "DEVELOPMENT_ONLY_ResQnet_Secret_Super_Secure_Key_2026!";
}
var jwtIssuer = builder.Configuration["Jwt:Issuer"] ?? "ResQnet.API";
var jwtAudience = builder.Configuration["Jwt:Audience"] ?? "ResQnet.Client";

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.RequireHttpsMetadata = false;
    options.SaveToken = true;
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = jwtIssuer,
        ValidAudience = jwtAudience,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey))
    };
});
builder.Services.AddAuthorization();

// 6. CORS — restricted to the ResQnet frontend origins only
builder.Services.AddCors(options =>
{
    options.AddPolicy("ResQnetFrontend", policy =>
    {
        policy.WithOrigins("http://localhost:5173", "http://127.0.0.1:5173")
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();

// 7. Swagger Documentation
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "ResQnet.AI - Member 4 AI Decision-Support & HITL Services API",
        Version = "v1",
        Description = "AI Gateway, Request Classification, Urgency Scoring, Duplicate Detection, and Human-in-the-Loop Decision Governance"
    });
});

var app = builder.Build();

// 8. Seed Baseline Case #2341 and recommendations
using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    await DbInitializer.SeedAsync(context);
}

if (app.Environment.IsDevelopment() || true)
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "ResQnet Member 4 API v1");
        c.RoutePrefix = "swagger";
    });
}

app.UseCors("ResQnetFrontend");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.Run();

// Required for WebApplicationFactory<Program> in integration tests
public partial class Program { }
