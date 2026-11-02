using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using ResQnet.Member6.Application.DTOs;
using ResQnet.Member6.Application.Interfaces;
using ResQnet.Member6.Application.Services;
using ResQnet.Member6.Domain.Entities;
using ResQnet.Member6.Domain.Events;
using ResQnet.Member6.Infrastructure.Channels;
using ResQnet.Member6.Infrastructure.Data;
using ResQnet.Member6.Infrastructure.Events;
using ResQnet.Member6.Infrastructure.Repositories;
using ResQnet.Member6.Infrastructure.Services;
using Xunit;

namespace ResQnet.Member6.Tests;

public class Member6UnitTests
{
    private ApplicationDbContext CreateInMemoryDbContext()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        var context = new ApplicationDbContext(options);
        return context;
    }

    [Fact]
    public void VolunteerMatching_MatchesRuwanD_With67PercentScore()
    {
        // Arrange
        var task = new VolunteerTask
        {
            Title = "Distribute meals - Rivagama",
            Category = "Relief Logistics",
            RequiredSkill = "Logistics"
        };

        var volunteer = new Volunteer
        {
            FullName = "Ruwan D.",
            Skills = "Logistics",
            Status = "Available",
            TotalHours = 95
        };

        // Act
        int score = VolunteerService.CalculateMatchScore(task, volunteer);

        // Assert
        Assert.Equal(67, score);
    }

    [Fact]
    public async Task DonationService_UpdatesCampaignRaisedAmount()
    {
        // Arrange
        using var context = CreateInMemoryDbContext();
        var campaign = new Campaign
        {
            Id = Guid.NewGuid(),
            Title = "Flood Relief 2024",
            GoalAmount = 5000000m,
            RaisedAmount = 4200000m
        };
        await context.Campaigns.AddAsync(campaign);
        await context.SaveChangesAsync();

        var unitOfWork = new UnitOfWork(context);
        var mockDispatcher = new MockEventDispatcher();
        var donationService = new DonationService(unitOfWork, mockDispatcher);

        // Act
        var result = await donationService.RecordDonationAsync(new CreateDonationDto
        {
            CampaignId = campaign.Id,
            DonorName = "A. Silva",
            Amount = 25000m,
            Flag = "-"
        });

        // Assert
        Assert.NotNull(result);
        Assert.Equal(25000m, result.Amount);
        var updatedCampaign = await context.Campaigns.FindAsync(campaign.Id);
        Assert.Equal(4225000m, updatedCampaign!.RaisedAmount);
        Assert.Single(mockDispatcher.DispatchedEvents);
    }

    [Fact]
    public void NotificationChannelFactory_ResolvesAppropriateChannels()
    {
        // Arrange
        var channels = new List<INotificationChannel>
        {
            new EmailNotificationChannel(NullLogger<EmailNotificationChannel>.Instance),
            new SmsNotificationChannel(NullLogger<SmsNotificationChannel>.Instance),
            new PushNotificationChannel(NullLogger<PushNotificationChannel>.Instance)
        };
        var factory = new NotificationChannelFactory(channels);

        // Act & Assert
        var email = factory.GetChannel("Email");
        var sms = factory.GetChannel("SMS");
        var push = factory.GetChannel("Push");

        Assert.Equal("Email", email.ChannelType);
        Assert.Equal("SMS", sms.ChannelType);
        Assert.Equal("Push", push.ChannelType);
    }

    [Fact]
    public async Task NotificationService_SuppressesDuplicateWhenIdempotencyKeyReused()
    {
        // Arrange
        using var context = CreateInMemoryDbContext();
        var unitOfWork = new UnitOfWork(context);
        var idempotencyService = new IdempotencyService(context);
        var channels = new List<INotificationChannel>
        {
            new EmailNotificationChannel(NullLogger<EmailNotificationChannel>.Instance),
            new SmsNotificationChannel(NullLogger<SmsNotificationChannel>.Instance)
        };
        var factory = new NotificationChannelFactory(channels);
        var notificationService = new NotificationService(factory, idempotencyService, unitOfWork);

        var idempotencyKey = "EVENT-DISPATCH-998811";
        var request = new SendNotificationRequest
        {
            Recipient = "coordinator@resqnet.org",
            Channel = "Email",
            Subject = "Flood Alert",
            Body = "Relief team deployed.",
            IdempotencyKey = idempotencyKey
        };

        // Act - First Call
        var firstResult = await notificationService.SendNotificationAsync(request);
        // Act - Duplicate Call with Same Idempotency Key
        var secondResult = await notificationService.SendNotificationAsync(request);

        // Assert
        Assert.True(firstResult.IsSuccess);
        Assert.False(firstResult.WasDuplicateSuppressed);

        Assert.True(secondResult.IsSuccess);
        Assert.True(secondResult.WasDuplicateSuppressed);
    }

    [Fact]
    public async Task VolunteerService_AssignTask_DispatchesVolunteerAssignedEvent()
    {
        // Arrange
        using var context = CreateInMemoryDbContext();
        var volunteer = new Volunteer
        {
            Id = Guid.NewGuid(),
            FullName = "Ruwan D.",
            Email = "ruwan@resqnet.org",
            PhoneNumber = "+94 77 333 4444",
            Skills = "Logistics",
            Status = "Available"
        };
        var task = new VolunteerTask
        {
            Id = Guid.NewGuid(),
            Title = "Distribute meals - Rivagama",
            Location = "Rivagama Relief Center",
            RequiredSkill = "Logistics",
            Status = "Open"
        };
        await context.Volunteers.AddAsync(volunteer);
        await context.VolunteerTasks.AddAsync(task);
        await context.SaveChangesAsync();

        var unitOfWork = new UnitOfWork(context);
        var mockDispatcher = new MockEventDispatcher();
        var volunteerService = new VolunteerService(unitOfWork, mockDispatcher);

        // Act
        var success = await volunteerService.AssignVolunteerTaskAsync(new AssignVolunteerTaskDto
        {
            TaskId = task.Id,
            VolunteerId = volunteer.Id
        });

        // Assert
        Assert.True(success);
        var updatedTask = await context.VolunteerTasks.FindAsync(task.Id);
        Assert.Equal("Assigned", updatedTask!.Status);
        Assert.Equal(volunteer.Id, updatedTask.AssignedVolunteerId);

        var updatedVolunteer = await context.Volunteers.FindAsync(volunteer.Id);
        Assert.Equal("On Task", updatedVolunteer!.Status);

        Assert.Single(mockDispatcher.DispatchedEvents);
        var ev = Assert.IsType<VolunteerAssignedEvent>(mockDispatcher.DispatchedEvents[0]);
        Assert.Equal("Ruwan D.", ev.VolunteerName);
        Assert.Equal("Distribute meals - Rivagama", ev.TaskTitle);
    }

    private class MockEventDispatcher : IDomainEventDispatcher
    {
        public List<IDomainEvent> DispatchedEvents { get; } = new();

        public Task DispatchAsync<TEvent>(TEvent domainEvent) where TEvent : IDomainEvent
        {
            DispatchedEvents.Add(domainEvent);
            return Task.CompletedTask;
        }
    }
}
