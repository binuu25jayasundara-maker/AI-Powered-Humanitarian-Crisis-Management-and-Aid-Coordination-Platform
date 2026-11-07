using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Builder;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi;
using ResQnet.Member1.Api.Middleware;
using ResQnet.Member1.Application.Interfaces;
using ResQnet.Member1.Application.Services;
using ResQnet.Member1.Infrastructure.Data;
using ResQnet.Member1.Infrastructure.Repositories;
using ResQnet.Member1.Infrastructure.Security;

var builder = WebApplication.CreateBuilder(args);

// 1. Add Database Context
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
builder.Services.AddDbContext<ApplicationDbContext>(options =>
{
    if (string.Equals(connectionString, "InMemory", StringComparison.OrdinalIgnoreCase))
    {
        options.UseInMemoryDatabase("ResQnet_Identity");
    }
    else
    {
        options.UseSqlServer(connectionString);
    }
});

// 2. Add Dependencies
builder.Services.AddScoped<IUnitOfWork, UnitOfWork>();
builder.Services.AddScoped(typeof(IRepository<>), typeof(GenericRepository<>));
builder.Services.AddScoped<IPasswordHasher, PasswordHasher>();
builder.Services.AddScoped<IJwtTokenGenerator, JwtTokenGenerator>();
builder.Services.AddScoped<IAuditService, AuditService>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IUserService, UserService>();
builder.Services.AddScoped<IOrganizationService, OrganizationService>();
builder.Services.AddScoped<IRoleService, RoleService>();

// 3. Configure JWT Authentication
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

builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("AdminOnly", policy => policy.RequireRole("SystemAdmin"));
    options.AddPolicy("StaffOnly", policy => policy.RequireRole("SystemAdmin", "EmergencyCoordinator", "CaseManager", "VolunteerCoordinator", "DonorOfficer"));
});

// 4. CORS — restricted to the ResQnet frontend origins only
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

// 5. Swagger
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "ResQnet.AI - Member 1 Security & Administration API",
        Version = "v1",
        Description = "Core Security, Authentication, RBAC, User & Organization Management, and Audit Logging API"
    });
});

var app = builder.Build();

// 6. Seed Baseline Data
using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    var hasher = scope.ServiceProvider.GetRequiredService<IPasswordHasher>();
    await DbInitializer.SeedAsync(context, hasher);
}

// 7. Configure Middleware Pipeline
app.UseMiddleware<ExceptionHandlingMiddleware>();

if (app.Environment.IsDevelopment() || true)
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "ResQnet Member 1 API v1");
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
