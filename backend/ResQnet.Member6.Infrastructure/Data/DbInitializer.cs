using Microsoft.EntityFrameworkCore;
using ResQnet.Member6.Domain.Entities;

namespace ResQnet.Member6.Infrastructure.Data;

public static class DbInitializer
{
    public static async Task SeedAsync(ApplicationDbContext context)
    {
        await context.Database.EnsureCreatedAsync();

        if (await context.Volunteers.AnyAsync())
        {
            return; // Already seeded
        }

        // 1. Seed Volunteers (Screenshot 9)
        var volNimal = new Volunteer
        {
            Id = Guid.NewGuid(),
            FullName = "Nimal P.",
            Email = "nimal@resqnet.org",
            PhoneNumber = "+94 77 111 2222",
            Skills = "First aid, driving",
            Status = "Available",
            TotalHours = 48,
            CreatedAt = DateTime.UtcNow.AddDays(-30)
        };

        var volKavya = new Volunteer
        {
            Id = Guid.NewGuid(),
            FullName = "Kavya S.",
            Email = "kavya@resqnet.org",
            PhoneNumber = "+94 77 222 3333",
            Skills = "Translation",
            Status = "On Task",
            TotalHours = 72,
            CreatedAt = DateTime.UtcNow.AddDays(-25)
        };

        var volRuwan = new Volunteer
        {
            Id = Guid.NewGuid(),
            FullName = "Ruwan D.",
            Email = "ruwan@resqnet.org",
            PhoneNumber = "+94 77 333 4444",
            Skills = "Logistics",
            Status = "Available",
            TotalHours = 95,
            CreatedAt = DateTime.UtcNow.AddDays(-40)
        };

        var volAmal = new Volunteer
        {
            Id = Guid.NewGuid(),
            FullName = "Amal T.",
            Email = "amal@resqnet.org",
            PhoneNumber = "+94 77 444 5555",
            Skills = "Medical",
            Status = "On Leave",
            TotalHours = 30,
            CreatedAt = DateTime.UtcNow.AddDays(-15)
        };

        await context.Volunteers.AddRangeAsync(volNimal, volKavya, volRuwan, volAmal);

        // 2. Seed Volunteer Tasks (Screenshot 9: Distribute meals - Rivagama)
        var taskRivagama = new VolunteerTask
        {
            Id = Guid.NewGuid(),
            Title = "Distribute meals - Rivagama",
            Category = "Relief Logistics",
            Location = "Rivagama Relief Center, Western Province",
            RequiredSkill = "Logistics",
            Status = "Open",
            MatchScorePercent = 67,
            CreatedAt = DateTime.UtcNow.AddHours(-12)
        };

        await context.VolunteerTasks.AddAsync(taskRivagama);

        // 3. Seed Campaigns (Screenshot 10: Flood Relief 2024)
        var floodCampaign = new Campaign
        {
            Id = Guid.Parse("44444444-4444-4444-4444-444444444444"),
            Title = "Flood Relief 2024",
            GoalAmount = 5000000.00m,
            RaisedAmount = 4200000.00m,
            MedicalItemsCount = 1284,
            DisposalFlagCount = 3,
            FoodAllocationPercent = 40,
            MedicalAllocationPercent = 35,
            ShelterAllocationPercent = 25,
            Status = "Active",
            CreatedAt = DateTime.UtcNow.AddDays(-14)
        };

        await context.Campaigns.AddAsync(floodCampaign);

        // 4. Seed Donations (Screenshot 10: A. Silva, Org X [Urgent], K. Perera)
        var donation1 = new Donation
        {
            Id = Guid.NewGuid(),
            CampaignId = floodCampaign.Id,
            DonorName = "A. Silva",
            Amount = 25000.00m,
            ItemCount = 0,
            Flag = "-",
            IsSuspicious = false,
            PaymentReference = "TXN-ASILVA-01",
            CreatedAt = DateTime.UtcNow.AddHours(-2)
        };

        var donation2 = new Donation
        {
            Id = Guid.NewGuid(),
            CampaignId = floodCampaign.Id,
            DonorName = "Org X",
            Amount = 300000.00m,
            ItemCount = 500,
            Flag = "Urgent",
            IsSuspicious = false,
            PaymentReference = "TXN-ORGX-URGENT",
            CreatedAt = DateTime.UtcNow.AddHours(-6)
        };

        var donation3 = new Donation
        {
            Id = Guid.NewGuid(),
            CampaignId = floodCampaign.Id,
            DonorName = "K. Perera",
            Amount = 5000.00m,
            ItemCount = 0,
            Flag = "-",
            IsSuspicious = false,
            PaymentReference = "TXN-KPERERA-03",
            CreatedAt = DateTime.UtcNow.AddHours(-18)
        };

        await context.Donations.AddRangeAsync(donation1, donation2, donation3);

        // 5. Seed Initial Notification Record
        var initialNotification = new NotificationRecord
        {
            Id = Guid.NewGuid(),
            Recipient = "volunteers-alert@resqnet.org",
            Channel = "Email",
            Subject = "Emergency Dispatch Alert: Flood Relief 2024",
            Body = "New distribution teams mobilized for Rivagama area.",
            Status = "Sent",
            RetryCount = 0,
            SentAt = DateTime.UtcNow.AddHours(-10)
        };

        await context.Notifications.AddAsync(initialNotification);

        await context.SaveChangesAsync();
    }
}
