using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Builder;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi;
using ResQnet.Infrastructure.Data;

// Member 1 namespaces
using ResQnet.Member1.Application.Interfaces;
using ResQnet.Member1.Application.Services;
using ResQnet.Member1.Infrastructure.Repositories;
using ResQnet.Member1.Infrastructure.Security;

// Member 4 namespaces
using ResQnet.Member4.Application.Interfaces;
using ResQnet.Member4.Application.Strategies;
using ResQnet.Member4.Infrastructure.Services;

// Member 5 namespaces
using ResQnet.Member5.Api.Interfaces;
using ResQnet.Member5.Api.Services;

// Member 6 namespaces
using ResQnet.Member6.Application.Interfaces;
using ResQnet.Member6.Application.Services;
using ResQnet.Member6.Domain.Events;
using ResQnet.Member6.Infrastructure.Channels;
using ResQnet.Member6.Infrastructure.Events;
using ResQnet.Member6.Infrastructure.Services;
using M6Repo = ResQnet.Member6.Infrastructure.Repositories;


using ResQnet.UnifiedApi.Services;

var builder = WebApplication.CreateBuilder(args);


builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.Converters.Add(new System.Text.Json.Serialization.JsonStringEnumConverter());
    });

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "ResQnet.AI - Unified Crisis Management Platform API",
        Version = "v1",
        Description = "Consolidated API for Auth, RBAC, AI Decision Support, Logistics, Shelters, Volunteers, Donors, and Emergency Coordination."
    });

    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "JWT Authorization header using the Bearer scheme. Format: Bearer {token}",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT"
    });


    c.AddSecurityRequirement(document => new OpenApiSecurityRequirement
    {
        [new OpenApiSecuritySchemeReference("Bearer", document)] = []
    });
});

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins("http://localhost:5173", "http://127.0.0.1:5173")
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

// 2. Database Configuration
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");

void ConfigureDatabase(DbContextOptionsBuilder options)
{
    if (string.Equals(connectionString, "InMemory", StringComparison.OrdinalIgnoreCase))
    {
        options.UseInMemoryDatabase("ResQnet_Combined");
    }
    else
    {
        options.UseSqlServer(connectionString, sqlOptions =>
        {
            sqlOptions.EnableRetryOnFailure(3, TimeSpan.FromSeconds(2), null);
        });
    }
}

builder.Services.AddDbContext<ResQnetDbContext>(ConfigureDatabase);
builder.Services.AddDbContext<ResQnet.Member1.Infrastructure.Data.ApplicationDbContext>(ConfigureDatabase);
builder.Services.AddDbContext<ResQnet.Member4.Infrastructure.Data.ApplicationDbContext>(ConfigureDatabase);
builder.Services.AddDbContext<ResQnet.Member5.Api.Data.ApplicationDbContext>(ConfigureDatabase);
builder.Services.AddDbContext<ResQnet.Member6.Infrastructure.Data.ApplicationDbContext>(ConfigureDatabase);
builder.Services.AddDbContext<ResQnet.UnifiedApi.Data.CoreDbContext>(ConfigureDatabase);

// 3. Register Member 1 Services (Auth, Users, Roles, Organizations, Audit)
builder.Services.AddScoped<ResQnet.Member1.Application.Interfaces.IUnitOfWork, ResQnet.Member1.Infrastructure.Repositories.UnitOfWork>();
builder.Services.AddScoped(typeof(ResQnet.Member1.Application.Interfaces.IRepository<>), typeof(GenericRepository<>));
builder.Services.AddScoped<IPasswordHasher, PasswordHasher>();
builder.Services.AddScoped<IJwtTokenGenerator, JwtTokenGenerator>();
builder.Services.AddScoped<IAuditService, AuditService>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IUserService, UserService>();
builder.Services.AddScoped<IOrganizationService, OrganizationService>();
builder.Services.AddScoped<IRoleService, RoleService>();

// 4. Register Member 4 Services (AI Decisions, Chat, Duplicates, Forecasting)
var aiTimeoutSeconds = builder.Configuration.GetValue<int?>("AI:TimeoutSeconds") ?? 4;
builder.Services.AddHttpClient<ExternalLlmAiStrategy>(client =>
{
    client.Timeout = TimeSpan.FromSeconds(aiTimeoutSeconds);
});
builder.Services.AddSingleton<RuleBasedAiStrategy>();
builder.Services.AddTransient<IAiProcessingStrategy, RuleBasedAiStrategy>();
builder.Services.AddTransient<IAiProcessingStrategy, ExternalLlmAiStrategy>();
builder.Services.AddScoped<IAiGateway, AiGateway>();
builder.Services.AddScoped<IDuplicateService, DuplicateService>();
builder.Services.AddScoped<ICaseReviewService, CaseReviewService>();
builder.Services.AddScoped<IAiAssistantService, AiAssistantService>();
builder.Services.AddScoped<IForecastingService, ForecastingService>();

// 5. Register Member 5 Services (Resources, Shelters, Map)
builder.Services.AddScoped<IResourceService, ResourceService>();
builder.Services.AddScoped<IShelterService, ShelterService>();
builder.Services.AddScoped<IMapService, MapService>();

// 6. Register Member 6 Services (Volunteers, Donors, Campaigns, Notifications)
builder.Services.AddScoped(typeof(ResQnet.Member6.Application.Interfaces.IRepository<>), typeof(M6Repo.Repository<>));
builder.Services.AddScoped<ResQnet.Member6.Application.Interfaces.IUnitOfWork, M6Repo.UnitOfWork>();
builder.Services.AddScoped<IIdempotencyService, IdempotencyService>();

// Notification delivery providers. Each channel falls back to simulated mode
// when its credentials are missing, so named clients are safe to register always.
var notificationTimeoutSeconds = builder.Configuration.GetValue<int?>("Notifications:TimeoutSeconds") ?? 15;
builder.Services.AddHttpClient("SendGrid", client => client.Timeout = TimeSpan.FromSeconds(notificationTimeoutSeconds));
builder.Services.AddHttpClient("NotifyLk", client => client.Timeout = TimeSpan.FromSeconds(notificationTimeoutSeconds));
builder.Services.AddHttpClient("Twilio", client => client.Timeout = TimeSpan.FromSeconds(notificationTimeoutSeconds));

builder.Services.AddTransient<INotificationChannel, EmailNotificationChannel>();
builder.Services.AddTransient<INotificationChannel, SmsNotificationChannel>();
builder.Services.AddTransient<INotificationChannel, PushNotificationChannel>();
builder.Services.AddTransient<INotificationChannelFactory, NotificationChannelFactory>();

builder.Services.AddScoped<IDomainEventDispatcher, DomainEventDispatcher>();
builder.Services.AddScoped<IDomainEventHandler<VolunteerAssignedEvent>, VolunteerAssignedObserver>();
builder.Services.AddScoped<IDomainEventHandler<DonationReceivedEvent>, DonationReceivedObserver>();

builder.Services.AddScoped<VolunteerService>();
builder.Services.AddScoped<CampaignService>();
builder.Services.AddScoped<DonationService>();
builder.Services.AddScoped<NotificationService>();

// 7. Register UnifiedApi Core Services (Requests & Events)
builder.Services.AddScoped<IStatusTransitionService, StatusTransitionService>();
builder.Services.AddScoped<IAssistanceRequestService, AssistanceRequestService>();
builder.Services.AddScoped<ICrisisEventService, CrisisEventService>();

// 8. Configure JWT Authentication
var jwtKey = builder.Configuration["Jwt:Key"];
if (string.IsNullOrWhiteSpace(jwtKey))
{
    jwtKey = Environment.GetEnvironmentVariable("Jwt__Key");
}
if (string.IsNullOrWhiteSpace(jwtKey))
{
    if (builder.Environment.IsProduction())
    {
        throw new InvalidOperationException("JWT signing key is not configured.");
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
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
        ValidateIssuer = true,
        ValidIssuer = jwtIssuer,
        ValidateAudience = true,
        ValidAudience = jwtAudience,
        ClockSkew = TimeSpan.Zero
    };
});

var app = builder.Build();

// 9. Database Auto-Creation and Comprehensive Seed
using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<ResQnetDbContext>();
    var hasher = scope.ServiceProvider.GetRequiredService<IPasswordHasher>();

    if (context.Database.IsInMemory())
    {
        context.Database.EnsureCreated();
    }
    
    await ResQnetDbSeeder.SeedAllAsync(context, hasher);
}

// 10. HTTP Pipeline
app.UseMiddleware<ResQnet.Member1.Api.Middleware.ExceptionHandlingMiddleware>();

app.UseSwagger();
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "ResQnet.AI Unified API v1");
    c.RoutePrefix = "swagger";
});

app.UseCors("AllowFrontend");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();

// Expose Program for WebApplicationFactory in integration tests
public partial class Program { }
