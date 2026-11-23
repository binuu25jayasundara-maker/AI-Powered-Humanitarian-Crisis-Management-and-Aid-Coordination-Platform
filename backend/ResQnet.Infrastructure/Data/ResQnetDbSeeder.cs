using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using ResQnet.Member1.Application.Interfaces;

namespace ResQnet.Infrastructure.Data
{
    public static class ResQnetDbSeeder
    {
        public static async Task SeedAllAsync(ResQnetDbContext context, IPasswordHasher passwordHasher)
        {
            // 1. Seed Member 1 (Auth, Organizations, Roles, Users)
            await ResQnet.Member1.Infrastructure.Data.DbInitializer.SeedAsync(context, passwordHasher);

            // 2. Seed Member 4 (AI Case #2341 and recommendations)
            await ResQnet.Member4.Infrastructure.Data.DbInitializer.SeedAsync(context);

            // 3. Seed Member 5 (Resources, Shelters, Allocations)
            await ResQnet.Member5.Api.Data.DbInitializer.SeedAsync(context);

            // 4. Seed Member 6 (Volunteers, Tasks, Campaigns, Donations)
            await ResQnet.Member6.Infrastructure.Data.DbInitializer.SeedAsync(context);

            // 5. Seed UnifiedApi (Core Citizen Requests & Crisis Events)
            await ResQnet.UnifiedApi.Data.CoreDbSeeder.SeedAsync(context);
        }
    }
}
