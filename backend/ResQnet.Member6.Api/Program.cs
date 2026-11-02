using Microsoft.EntityFrameworkCore;
using ResQnet.Member6.Application.Interfaces;
using ResQnet.Member6.Application.Services;
using ResQnet.Member6.Domain.Events;
using ResQnet.Member6.Infrastructure.Channels;
using ResQnet.Member6.Infrastructure.Data;
using ResQnet.Member6.Infrastructure.Events;
using ResQnet.Member6.Infrastructure.Repositories;
using ResQnet.Member6.Infrastructure.Services;
using Microsoft.OpenApi;

var builder = WebApplication.CreateBuilder(args);

// Add Controllers and Swagger
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "ResQnet.AI - Member 6 Volunteer, Campaign & Notification API",
        Version = "v1",
        Description = "API for Volunteer Management, Donors & Campaigns, Factory Pattern Notification Channels, and Observer Pattern Events."
    });
});

// Configure Database (SQL Server with InMemory resilience fallback)
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
builder.Services.AddDbContext<ApplicationDbContext>(options =>
{
    if (string.Equals(connectionString, "InMemory", StringComparison.OrdinalIgnoreCase))
    {
        options.UseInMemoryDatabase("ResQnet_Member6_InMemoryDb");
    }
    else
    {
        try
        {
            options.UseSqlServer(connectionString, sqlOptions =>
            {
                sqlOptions.EnableRetryOnFailure(3, TimeSpan.FromSeconds(2), null);
            });
        }
        catch
        {
            options.UseInMemoryDatabase("ResQnet_Member6_InMemoryDb");
        }
    }
});

// Register Repositories and Unit of Work
builder.Services.AddScoped(typeof(IRepository<>), typeof(Repository<>));
builder.Services.AddScoped<IUnitOfWork, UnitOfWork>();
builder.Services.AddScoped<IIdempotencyService, IdempotencyService>();

// Register Factory Pattern: Notification Channels & Factory
builder.Services.AddTransient<INotificationChannel, EmailNotificationChannel>();
builder.Services.AddTransient<INotificationChannel, SmsNotificationChannel>();
builder.Services.AddTransient<INotificationChannel, PushNotificationChannel>();
builder.Services.AddTransient<INotificationChannelFactory, NotificationChannelFactory>();

// Register Observer Pattern: Event Dispatcher & Handlers
builder.Services.AddScoped<IDomainEventDispatcher, DomainEventDispatcher>();
builder.Services.AddScoped<IDomainEventHandler<VolunteerAssignedEvent>, VolunteerAssignedObserver>();
builder.Services.AddScoped<IDomainEventHandler<DonationReceivedEvent>, DonationReceivedObserver>();

// Register Application Services
builder.Services.AddScoped<VolunteerService>();
builder.Services.AddScoped<CampaignService>();
builder.Services.AddScoped<DonationService>();
builder.Services.AddScoped<NotificationService>();

// Configure CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

var app = builder.Build();

// Configure Middleware Pipeline
app.UseCors("AllowAll");

if (app.Environment.IsDevelopment() || true)
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "ResQnet Member 6 API v1");
        c.RoutePrefix = string.Empty; // Swagger UI at root
    });
}

app.UseAuthorization();
app.MapControllers();

// Ensure Database is Created & Seeded
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    var logger = services.GetRequiredService<ILogger<Program>>();
    try
    {
        var db = services.GetRequiredService<ApplicationDbContext>();
        await DbInitializer.SeedAsync(db);
        logger.LogInformation("ResQnet Member 6 database initialised and seeded successfully.");
    }
    catch (Exception ex)
    {
        logger.LogWarning(ex, "Failed to connect to SQL Server, initializing InMemory fallback.");
        var optionsBuilder = new DbContextOptionsBuilder<ApplicationDbContext>();
        optionsBuilder.UseInMemoryDatabase("ResQnet_Member6_InMemoryDb");
        using var inMemoryDb = new ApplicationDbContext(optionsBuilder.Options);
        await DbInitializer.SeedAsync(inMemoryDb);
    }
}

app.Run();
