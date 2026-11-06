using Microsoft.AspNetCore.Builder;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
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

// 5. CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();

// 6. Swagger Documentation
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

// 7. Seed Baseline Case #2341 and recommendations
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

app.UseCors("AllowAll");
app.MapControllers();

app.Run();
