using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using ResQnet.Member1.Application.DTOs;
using ResQnet.Member1.Application.Interfaces;
using ResQnet.Member1.Domain.Entities;

namespace ResQnet.Member1.Application.Services
{
    public class AuthService : IAuthService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IPasswordHasher _passwordHasher;
        private readonly IJwtTokenGenerator _tokenGenerator;
        private readonly IAuditService _auditService;

        public AuthService(
            IUnitOfWork unitOfWork,
            IPasswordHasher passwordHasher,
            IJwtTokenGenerator tokenGenerator,
            IAuditService auditService)
        {
            _unitOfWork = unitOfWork;
            _passwordHasher = passwordHasher;
            _tokenGenerator = tokenGenerator;
            _auditService = auditService;
        }

        public async Task<AuthResponse> LoginAsync(LoginRequest request, string? ipAddress = null, CancellationToken cancellationToken = default)
        {
            var users = await _unitOfWork.Repository<User>().FindAsync(u => u.Email.ToLower() == request.Email.ToLower(), cancellationToken);
            var user = users.FirstOrDefault();

            if (user == null || !_passwordHasher.VerifyPassword(request.Password, user.PasswordHash))
            {
                await _auditService.LogAsync("system", request.Email, "AUTH_LOGIN_FAILED", "User", null, new { reason = "Invalid credentials" }, ipAddress, "Failed", cancellationToken);
                throw new UnauthorizedAccessException("Invalid email or password.");
            }

            if (!user.IsActive)
            {
                await _auditService.LogAsync(user.Id.ToString(), user.Email, "AUTH_LOGIN_BLOCKED", "User", user.Id.ToString(), new { reason = "Account inactive" }, ipAddress, "Failed", cancellationToken);
                throw new InvalidOperationException("User account is deactivated. Contact an administrator.");
            }

            user.LastLoginAt = DateTime.UtcNow;
            await _unitOfWork.Repository<User>().UpdateAsync(user, cancellationToken);

            var roles = new[] { user.Role };
            var permissions = GetDefaultPermissionsForRole(user.Role);
            var token = _tokenGenerator.GenerateToken(user, roles, permissions);
            var refreshTokenString = _tokenGenerator.GenerateRefreshToken();

            var refreshToken = new RefreshToken
            {
                UserId = user.Id,
                Token = refreshTokenString,
                ExpiresAt = DateTime.UtcNow.AddDays(7),
                IsRevoked = false
            };
            await _unitOfWork.Repository<RefreshToken>().AddAsync(refreshToken, cancellationToken);
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            await _auditService.LogAsync(user.Id.ToString(), user.Email, "AUTH_LOGIN_SUCCESS", "User", user.Id.ToString(), new { role = user.Role }, ipAddress, "Success", cancellationToken);

            return new AuthResponse
            {
                Token = token,
                RefreshToken = refreshTokenString,
                ExpiresAt = DateTime.UtcNow.AddHours(2),
                User = MapUserToDto(user)
            };
        }

        public async Task<AuthResponse> RegisterAsync(RegisterRequest request, string? ipAddress = null, CancellationToken cancellationToken = default)
        {
            var existingUsers = await _unitOfWork.Repository<User>().FindAsync(u => u.Email.ToLower() == request.Email.ToLower(), cancellationToken);
            if (existingUsers.Any())
            {
                throw new InvalidOperationException("A user with this email address already exists.");
            }

            var user = new User
            {
                FullName = request.FullName,
                Email = request.Email,
                PasswordHash = _passwordHasher.HashPassword(request.Password),
                Role = string.IsNullOrWhiteSpace(request.Role) ? "Citizen" : request.Role,
                OrganizationId = request.OrganizationId,
                PhoneNumber = request.PhoneNumber,
                IsActive = true
            };

            await _unitOfWork.Repository<User>().AddAsync(user, cancellationToken);
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            await _auditService.LogAsync(user.Id.ToString(), user.Email, "AUTH_REGISTER_SUCCESS", "User", user.Id.ToString(), new { role = user.Role }, ipAddress, "Success", cancellationToken);

            var roles = new[] { user.Role };
            var permissions = GetDefaultPermissionsForRole(user.Role);
            var token = _tokenGenerator.GenerateToken(user, roles, permissions);
            var refreshTokenString = _tokenGenerator.GenerateRefreshToken();

            var refreshToken = new RefreshToken
            {
                UserId = user.Id,
                Token = refreshTokenString,
                ExpiresAt = DateTime.UtcNow.AddDays(7),
                IsRevoked = false
            };
            await _unitOfWork.Repository<RefreshToken>().AddAsync(refreshToken, cancellationToken);
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            return new AuthResponse
            {
                Token = token,
                RefreshToken = refreshTokenString,
                ExpiresAt = DateTime.UtcNow.AddHours(2),
                User = MapUserToDto(user)
            };
        }

        public async Task<AuthResponse> RefreshTokenAsync(string refreshTokenStr, string? ipAddress = null, CancellationToken cancellationToken = default)
        {
            var tokens = await _unitOfWork.Repository<RefreshToken>().FindAsync(r => r.Token == refreshTokenStr, cancellationToken);
            var tokenEntity = tokens.FirstOrDefault();

            if (tokenEntity == null || tokenEntity.IsRevoked || tokenEntity.ExpiresAt <= DateTime.UtcNow)
            {
                throw new SecurityTokenException("Invalid or expired refresh token.");
            }

            var user = await _unitOfWork.Repository<User>().GetByIdAsync(tokenEntity.UserId, cancellationToken);
            if (user == null || !user.IsActive)
            {
                throw new UnauthorizedAccessException("User not found or inactive.");
            }

            tokenEntity.IsRevoked = true;
            await _unitOfWork.Repository<RefreshToken>().UpdateAsync(tokenEntity, cancellationToken);

            var newRefreshTokenStr = _tokenGenerator.GenerateRefreshToken();
            var newRefreshToken = new RefreshToken
            {
                UserId = user.Id,
                Token = newRefreshTokenStr,
                ExpiresAt = DateTime.UtcNow.AddDays(7),
                IsRevoked = false
            };
            await _unitOfWork.Repository<RefreshToken>().AddAsync(newRefreshToken, cancellationToken);
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            var roles = new[] { user.Role };
            var permissions = GetDefaultPermissionsForRole(user.Role);
            var newToken = _tokenGenerator.GenerateToken(user, roles, permissions);

            return new AuthResponse
            {
                Token = newToken,
                RefreshToken = newRefreshTokenStr,
                ExpiresAt = DateTime.UtcNow.AddHours(2),
                User = MapUserToDto(user)
            };
        }

        public async Task<UserDto?> GetUserByIdAsync(Guid userId, CancellationToken cancellationToken = default)
        {
            var user = await _unitOfWork.Repository<User>().GetByIdAsync(userId, cancellationToken);
            return user != null ? MapUserToDto(user) : null;
        }

        private static List<string> GetDefaultPermissionsForRole(string role)
        {
            return role switch
            {
                "SystemAdmin" => new List<string> { "users.manage", "roles.manage", "orgs.manage", "audit.view", "cases.all", "ai.all" },
                "EmergencyCoordinator" => new List<string> { "cases.manage", "cases.approve", "ai.review", "audit.view" },
                "CaseManager" => new List<string> { "cases.view", "cases.update", "ai.review" },
                "VolunteerCoordinator" => new List<string> { "volunteers.manage", "tasks.assign" },
                "DonorOfficer" => new List<string> { "donations.manage", "campaigns.manage" },
                _ => new List<string> { "requests.submit", "requests.track" }
            };
        }

        private static UserDto MapUserToDto(User user)
        {
            return new UserDto
            {
                Id = user.Id,
                FullName = user.FullName,
                Email = user.Email,
                Role = user.Role,
                OrganizationId = user.OrganizationId,
                OrganizationName = user.Organization?.Name,
                IsActive = user.IsActive,
                CreatedAt = user.CreatedAt,
                LastLoginAt = user.LastLoginAt
            };
        }
    }

    public class SecurityTokenException : Exception
    {
        public SecurityTokenException(string message) : base(message) { }
    }
}
