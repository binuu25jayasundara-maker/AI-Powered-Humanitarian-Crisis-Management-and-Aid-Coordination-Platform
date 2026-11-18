using System;
using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Builder;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi;
using ResQnet.UnifiedApi.Data;
using ResQnet.UnifiedApi.Services;

var builder = WebApplication.CreateBuilder(args);

// 1. Database
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
builder.Services.AddDbContext<CoreDbContext>(options =>
{
    if (string.Equals(connectionString, "InMemory", StringComparison.OrdinalIgnoreCase))
    {
        options.UseInMemoryDatabase("ResQnet_Core");
    }
    else
    {
        options.UseSqlServer(connectionString);
    }
});

// 2. Application Services
builder.Services.AddScoped<IStatusTransitionService, StatusTransitionService>();
builder.Services.AddScoped<IAssistanceRequestService, AssistanceRequestService>();
builder.Services.AddScoped<ICrisisEventService, CrisisEventService>();

// 3. JWT Authentication (same pattern as Member1/Member4/Member6)
var jwtKey = builder.Configuration["Jwt:Key"];
if (string.IsNullOrWhiteSpace(jwtKey))
{
    jwtKey = Environment.GetEnvironmentVariable("Jwt__Key");
}
if (string.IsNullOrWhiteSpace(jwtKey))
{
    if (builder.Environment.IsProduction())
    {
        throw new InvalidOperationException(
            "JWT signing key is not configured. Set the Jwt__Key environment variable before starting in Production.");
    }

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

// 4. CORS — restricted to http://localhost:5173 and http://127.0.0.1:5173
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
        Title = "ResQnet Unified Core API",
        Version = "v1",
        Description = "Citizen Assistance Requests and Crisis Event Coordination API"
    });
});

var app = builder.Build();

// 6. Seed Baseline Data
using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<CoreDbContext>();
    context.Database.EnsureCreated();
    await CoreDbSeeder.SeedAsync(context);
}

// 7. Middleware
if (app.Environment.IsDevelopment() || true)
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "ResQnet Core API v1");
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