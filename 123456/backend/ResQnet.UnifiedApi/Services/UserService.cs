using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using ResQnet.UnifiedApi.Data;
using ResQnet.UnifiedApi.Models;
using ResQnet.UnifiedApi.Security;

namespace ResQnet.UnifiedApi.Services
{
    public interface IUserService
    {
        Task<IReadOnlyList<UserDto>> GetAllUsersAsync();
        Task<UserDto?> GetByIdAsync(string id);
        Task<UserDto> CreateUserAsync(CreateUserRequest request, string actorEmail);
        Task<UserDto> UpdateUserAsync(string id, UpdateUserRequest request, string actorEmail);
        Task<bool> ToggleUserStatusAsync(string id, string actorEmail);
        Task<bool> DeleteUserAsync(string id, string actorEmail);
        Task<UserDto> RestoreUserAsync(string id, string actorEmail);
        Task<IReadOnlyList<DeletedUserRecordEntity>> GetDeletedUsersAsync();
    }

    public class UserService : IUserService
    {
        private readonly AppDbContext _context;
        private readonly IPasswordHasher _hasher;

        public UserService(AppDbContext context, IPasswordHasher hasher)
        {
            _context = context;
            _hasher = hasher;
        }

        public async Task<IReadOnlyList<UserDto>> GetAllUsersAsync()
        {
            var users = await _context.Users
                .Where(u => !u.IsDeleted)
                .OrderByDescending(u => u.CreatedAt)
                .ToListAsync();

            return users.Select(MapToDto).ToList();
        }

        public async Task<UserDto?> GetByIdAsync(string id)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == id);
            return user == null ? null : MapToDto(user);
        }

        public async Task<UserDto> CreateUserAsync(CreateUserRequest request, string actorEmail)
        {
            var email = request.Email.Trim().ToLowerInvariant();
            var existing = await _context.Users.FirstOrDefaultAsync(u => u.Email.ToLower() == email && !u.IsDeleted);
            if (existing != null)
            {
                throw new InvalidOperationException("A user with this email address already exists.");
            }

            string? orgName = null;
            if (!string.IsNullOrWhiteSpace(request.OrganizationId))
            {
                var org = await _context.Organizations.FindAsync(request.OrganizationId);
                orgName = org?.Name;
            }

            var user = new User
            {
                FullName = request.FullName,
                Email = request.Email,
                PhoneNumber = request.PhoneNumber,
                PasswordHash = _hasher.HashPassword(request.Password),
                Role = request.Role,
                OrganizationId = request.OrganizationId,
                OrganizationName = orgName,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };

            await _context.Users.AddAsync(user);

            await _context.AuditEvents.AddAsync(new AuditEventEntity
            {
                ActorEmail = actorEmail,
                Action = "USER_CREATED",
                EntityName = "User",
                EntityId = user.Id,
                DetailsJson = $"{{\"email\":\"{user.Email}\",\"role\":\"{user.Role}\"}}"
            });

            await _context.SaveChangesAsync();
            return MapToDto(user);
        }

        public async Task<UserDto> UpdateUserAsync(string id, UpdateUserRequest request, string actorEmail)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == id);
            if (user == null) throw new KeyNotFoundException("User not found.");

            if (!string.IsNullOrWhiteSpace(request.Email) && request.Email.ToLower() != user.Email.ToLower())
            {
                var conflict = await _context.Users.FirstOrDefaultAsync(u => u.Id != id && u.Email.ToLower() == request.Email.ToLower() && !u.IsDeleted);
                if (conflict != null) throw new InvalidOperationException("A user with this email already exists.");
                user.Email = request.Email;
            }

            if (!string.IsNullOrWhiteSpace(request.FullName)) user.FullName = request.FullName;
            if (request.PhoneNumber != null) user.PhoneNumber = request.PhoneNumber;
            if (!string.IsNullOrWhiteSpace(request.Role)) user.Role = request.Role;

            await _context.AuditEvents.AddAsync(new AuditEventEntity
            {
                ActorEmail = actorEmail,
                Action = "USER_UPDATED",
                EntityName = "User",
                EntityId = user.Id,
                DetailsJson = $"{{\"email\":\"{user.Email}\",\"role\":\"{user.Role}\"}}"
            });

            await _context.SaveChangesAsync();
            return MapToDto(user);
        }

        public async Task<bool> ToggleUserStatusAsync(string id, string actorEmail)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == id);
            if (user == null) throw new KeyNotFoundException("User not found.");

            user.IsActive = !user.IsActive;

            await _context.AuditEvents.AddAsync(new AuditEventEntity
            {
                ActorEmail = actorEmail,
                Action = "USER_STATUS_TOGGLED",
                EntityName = "User",
                EntityId = user.Id,
                DetailsJson = $"{{\"isActive\":{user.IsActive.ToString().ToLower()}}}"
            });

            await _context.SaveChangesAsync();
            return user.IsActive;
        }

        public async Task<bool> DeleteUserAsync(string id, string actorEmail)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == id);
            if (user == null) throw new KeyNotFoundException("User not found.");
            if (user.IsDeleted) throw new InvalidOperationException("User is already deleted.");

            // Safeguard last active admin
            if (user.Role == "SystemAdmin")
            {
                var activeAdmins = await _context.Users.CountAsync(u => u.Role == "SystemAdmin" && !u.IsDeleted && u.IsActive);
                if (activeAdmins <= 1)
                {
                    throw new InvalidOperationException("Cannot delete the last active System Administrator.");
                }
            }

            user.IsActive = false;
            user.IsDeleted = true;
            user.DeletedAt = DateTime.UtcNow;
            user.DeletedBy = actorEmail;

            var record = new DeletedUserRecordEntity
            {
                UserId = user.Id,
                FullName = user.FullName,
                Email = user.Email,
                Role = user.Role,
                OrganizationName = user.OrganizationName,
                DeletedAt = user.DeletedAt.Value,
                DeletedBy = actorEmail,
                RestorationStatus = "Deleted"
            };
            await _context.DeletedUserRecords.AddAsync(record);

            await _context.AuditEvents.AddAsync(new AuditEventEntity
            {
                ActorEmail = actorEmail,
                Action = "USER_DELETED",
                EntityName = "User",
                EntityId = user.Id,
                DetailsJson = $"{{\"email\":\"{user.Email}\"}}"
            });

            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<UserDto> RestoreUserAsync(string id, string actorEmail)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == id);
            if (user == null) throw new KeyNotFoundException("User not found.");
            if (!user.IsDeleted) throw new InvalidOperationException("User is not deleted.");

            var conflict = await _context.Users.FirstOrDefaultAsync(u => u.Id != id && !u.IsDeleted && u.Email.ToLower() == user.Email.ToLower());
            if (conflict != null)
            {
                throw new InvalidOperationException("Cannot restore: another active user already has this email address.");
            }

            user.IsActive = true;
            user.IsDeleted = false;
            user.DeletedAt = null;
            user.DeletedBy = null;

            var record = await _context.DeletedUserRecords
                .Where(r => r.UserId == id)
                .OrderByDescending(r => r.DeletedAt)
                .FirstOrDefaultAsync();

            if (record != null)
            {
                record.RestorationStatus = "Restored";
                record.RestoredAt = DateTime.UtcNow;
                record.RestoredBy = actorEmail;
            }

            await _context.AuditEvents.AddAsync(new AuditEventEntity
            {
                ActorEmail = actorEmail,
                Action = "USER_RESTORED",
                EntityName = "User",
                EntityId = user.Id,
                DetailsJson = $"{{\"email\":\"{user.Email}\"}}"
            });

            await _context.SaveChangesAsync();
            return MapToDto(user);
        }

        public async Task<IReadOnlyList<DeletedUserRecordEntity>> GetDeletedUsersAsync()
        {
            return await _context.DeletedUserRecords
                .OrderByDescending(d => d.DeletedAt)
                .ToListAsync();
        }

        private static UserDto MapToDto(User u) => new UserDto
        {
            Id = u.Id,
            FullName = u.FullName,
            Email = u.Email,
            PhoneNumber = u.PhoneNumber,
            Role = u.Role,
            OrganizationId = u.OrganizationId,
            OrganizationName = u.OrganizationName,
            IsActive = u.IsActive,
            IsDeleted = u.IsDeleted,
            CreatedAt = u.CreatedAt.ToString("o"),
            LastLoginAt = u.LastLoginAt?.ToString("o"),
            DeletedAt = u.DeletedAt?.ToString("o"),
            DeletedBy = u.DeletedBy
        };
    }
}
