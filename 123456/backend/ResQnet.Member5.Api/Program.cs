using Microsoft.EntityFrameworkCore;
using ResQnet.Member5.Api.Data;
using ResQnet.Member5.Api.Interfaces;
using ResQnet.Member5.Api.Middleware;
using ResQnet.Member5.Api.Services;

var builder = WebApplication.CreateBuilder(args);

// ─── 1. Database Context ─────────────────────────────────────────────────────
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
builder.Services.AddDbContext<ApplicationDbContext>(options =>
{
    if (!string.IsNullOrEmpty(connectionString) && !connectionString.Contains("InMemory", StringComparison.OrdinalIgnoreCase))
    {
        options.UseSqlite(connectionString);
    }
    else
    {
        options.UseInMemoryDatabase("ResQnet_Member5_Dev");
    }
});

// ─── 2. Services ──────────────────────────────────────────────────────────────
builder.Services.AddScoped<IResourceService, ResourceService>();
builder.Services.AddScoped<IShelterService, ShelterService>();
builder.Services.AddScoped<IMapService, MapService>();

// ─── 3. CORS ─────────────────────────────────────────────────────────────────
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

// ─── 4. Controllers + Swagger ─────────────────────────────────────────────────
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

// ─── 5. Logging ───────────────────────────────────────────────────────────────
builder.Logging.ClearProviders();
builder.Logging.AddConsole();

var app = builder.Build();

// ─── 6. Database Seed ─────────────────────────────────────────────────────────
using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    context.Database.EnsureCreated();
    await DbInitializer.SeedAsync(context);
}

// ─── 7. Middleware Pipeline ────────────────────────────────────────────────────
app.UseMiddleware<ExceptionHandlingMiddleware>();

app.UseSwagger();
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "ResQnet Member 5 API v1");
    c.RoutePrefix = "swagger";
    c.DocumentTitle = "ResQnet.AI Member 5 API";
});

app.UseCors("AllowAll");
app.MapControllers();

app.Run();
