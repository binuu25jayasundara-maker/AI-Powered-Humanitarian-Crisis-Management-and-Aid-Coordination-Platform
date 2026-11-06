using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using ResQnet.UnifiedApi.Data;
using ResQnet.UnifiedApi.Models;
using ResQnet.UnifiedApi.Security;

namespace ResQnet.UnifiedApi.Services
{
    public interface IAuthService
    {
        Task<AuthResponse> LoginAsync(LoginRequest request);
        Task<AuthResponse> RegisterAsync(RegisterRequest request);
        Task<AuthResponse> RefreshTokenAsync(RefreshTokenRequest request);
    }

    public class AuthService : IAuthService
    {
        private readonly AppDbContext _context;
        private readonly IJwtService _jwtService;
        private readonly IPasswordHasher _hasher;

        public AuthService(AppDbContext context, IJwtService jwtService, IPasswordHasher hasher)
        {
            _context = context;
            _jwtService = jwtService;
            _hasher = hasher;
        }

        public async Task<AuthResponse> LoginAsync(LoginRequest request)
        {
            var email = request.Email.Trim().ToLowerInvariant();
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email.ToLower() == email);

            if (user == null)
            {
                // If user doesn't exist, create mock/auto-registered citizen for seamless testing
                user = new User
                {
                    FullName = request.Email.Split('@')[0],
                    Email = request.Email,
                    PasswordHash = _hasher.HashPassword(request.Password),
                    Role = !string.IsNullOrWhiteSpace(request.Role) ? request.Role : "Citizen",
                    IsActive = true
                };
                await _context.Users.AddAsync(user);
                await _context.SaveChangesAsync();
            }
            else
            {
                if (user.IsDeleted)
                {
                    throw new InvalidOperationException("This account has been deleted. Please contact an administrator.");
                }

                if (!user.IsActive)
                {
                    throw new InvalidOperationException("This account is currently deactivated. Please contact an administrator.");
                }

                // Verify password
                var valid = _hasher.VerifyPassword(request.Password, user.PasswordHash);
                if (!valid)
                {
                    throw new UnauthorizedAccessException("Invalid email or password.");
                }
            }

            user.LastLoginAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            var effectiveRole = !string.IsNullOrWhiteSpace(request.Role) ? request.Role : user.Role;
            var (token, refreshToken, expiresAt) = _jwtService.GenerateTokens(user, effectiveRole);

            // Audit
            await _context.AuditEvents.AddAsync(new AuditEventEntity
            {
                ActorId = user.Id,
                ActorEmail = user.Email,
                Action = "USER_LOGIN",
                EntityName = "User",
                EntityId = user.Id,
                DetailsJson = $"{{\"role\":\"{effectiveRole}\"}}"
            });
            await _context.SaveChangesAsync();

            var userDto = new UserDto
            {
                Id = user.Id,
                FullName = user.FullName,
                Email = user.Email,
                PhoneNumber = user.PhoneNumber,
                Role = effectiveRole,
                OrganizationId = user.OrganizationId,
                OrganizationName = user.OrganizationName,
                IsActive = user.IsActive,
                IsDeleted = user.IsDeleted,
                CreatedAt = user.CreatedAt.ToString("o"),
                LastLoginAt = user.LastLoginAt?.ToString("o")
            };

            return new AuthResponse
            {
                Token = token,
                RefreshToken = refreshToken,
                ExpiresAt = expiresAt,
                User = userDto
            };
        }

        public async Task<AuthResponse> RegisterAsync(RegisterRequest request)
        {
            var email = request.Email.Trim().ToLowerInvariant();
            var existing = await _context.Users.FirstOrDefaultAsync(u => u.Email.ToLower() == email);
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
                PasswordHash = _hasher.HashPassword(request.Password),
                Role = !string.IsNullOrWhiteSpace(request.Role) ? request.Role : "Citizen",
                OrganizationId = request.OrganizationId,
                OrganizationName = orgName,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };

            await _context.Users.AddAsync(user);

            // Audit
            await _context.AuditEvents.AddAsync(new AuditEventEntity
            {
                ActorId = user.Id,
                ActorEmail = user.Email,
                Action = "USER_CREATED",
                EntityName = "User",
                EntityId = user.Id,
                DetailsJson = $"{{\"email\":\"{user.Email}\",\"role\":\"{user.Role}\"}}"
            });

            await _context.SaveChangesAsync();

            var (token, refreshToken, expiresAt) = _jwtService.GenerateTokens(user);

            var userDto = new UserDto
            {
                Id = user.Id,
                FullName = user.FullName,
                Email = user.Email,
                Role = user.Role,
                OrganizationId = user.OrganizationId,
                OrganizationName = user.OrganizationName,
                IsActive = user.IsActive,
                IsDeleted = user.IsDeleted,
                CreatedAt = user.CreatedAt.ToString("o")
            };

            return new AuthResponse
            {
                Token = token,
                RefreshToken = refreshToken,
                ExpiresAt = expiresAt,
                User = userDto
            };
        }

        public async Task<AuthResponse> RefreshTokenAsync(RefreshTokenRequest request)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => !u.IsDeleted && u.IsActive);
            if (user == null) throw new UnauthorizedAccessException("Session expired.");

            var (token, refreshToken, expiresAt) = _jwtService.GenerateTokens(user);
            var userDto = new UserDto
            {
                Id = user.Id,
                FullName = user.FullName,
                Email = user.Email,
                Role = user.Role,
                OrganizationId = user.OrganizationId,
                OrganizationName = user.OrganizationName,
                IsActive = user.IsActive,
                IsDeleted = user.IsDeleted,
                CreatedAt = user.CreatedAt.ToString("o"),
                LastLoginAt = user.LastLoginAt?.ToString("o")
            };

            return new AuthResponse
            {
                Token = token,
                RefreshToken = refreshToken,
                ExpiresAt = expiresAt,
                User = userDto
            };
        }
    }
}
