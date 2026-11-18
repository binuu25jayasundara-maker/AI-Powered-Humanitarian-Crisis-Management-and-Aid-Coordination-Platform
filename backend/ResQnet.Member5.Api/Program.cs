using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Builder;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.IdentityModel.Tokens;
using ResQnet.Member5.Api.Data;
using ResQnet.Member5.Api.Interfaces;
using ResQnet.Member5.Api.Middleware;
using ResQnet.Member5.Api.Services;

var builder = WebApplication.CreateBuilder(args);

// ─── 1. Database Context ─────────────────────────────────────────────────────
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
builder.Services.AddDbContext<ApplicationDbContext>(options =>
{
    if (string.Equals(connectionString, "InMemory", StringComparison.OrdinalIgnoreCase))
    {
        options.UseInMemoryDatabase("ResQnet_Resources");
    }
    else
    {
        options.UseSqlServer(connectionString);
    }
});

// ─── 2. Services ──────────────────────────────────────────────────────────────
builder.Services.AddScoped<IResourceService, ResourceService>();
builder.Services.AddScoped<IShelterService, ShelterService>();
builder.Services.AddScoped<IMapService, MapService>();

// ─── 3. JWT Authentication ───────────────────────────────────────────────────
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

// ─── 4. CORS — restricted to the ResQnet frontend origins only ───────────────
builder.Services.AddCors(options =>
{
    options.AddPolicy("ResQnetFrontend", policy =>
    {
        policy.WithOrigins("http://localhost:5173", "http://127.0.0.1:5173")
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

// ─── 5. Controllers + Swagger ─────────────────────────────────────────────────
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new Microsoft.OpenApi.OpenApiInfo
    {
        Title = "ResQnet.AI — Member 5: Resources, Shelters & Maps API",
        Version = "v1",
        Description = "Resource & Logistics Management, Shelter Management, Household Allocation, Map Layers, Flood Zones, and Operational Coverage."
    });
});

// ─── 6. Logging ───────────────────────────────────────────────────────────────
builder.Logging.ClearProviders();
builder.Logging.AddConsole();

var app = builder.Build();

// ─── 7. Database Seed ─────────────────────────────────────────────────────────
using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    context.Database.EnsureCreated();
    await DbInitializer.SeedAsync(context);
}

// ─── 8. Middleware Pipeline ────────────────────────────────────────────────────
app.UseMiddleware<ExceptionHandlingMiddleware>();

app.UseSwagger();
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "ResQnet Member 5 API v1");
    c.RoutePrefix = "swagger";
    c.DocumentTitle = "ResQnet.AI Member 5 API";
});

app.UseCors("ResQnetFrontend");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.Run();

// Required for WebApplicationFactory<Program> in integration tests
public partial class Program { }
