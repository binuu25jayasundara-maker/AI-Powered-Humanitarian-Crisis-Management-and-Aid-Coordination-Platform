using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using ResQnet.Member1.Application.DTOs;
using ResQnet.Member1.Domain.Entities;

namespace ResQnet.Member1.Application.Interfaces
{
    public interface IAuthService
    {
        Task<AuthResponse> LoginAsync(LoginRequest request, string? ipAddress = null, CancellationToken cancellationToken = default);
        Task<AuthResponse> RegisterAsync(RegisterRequest request, string? ipAddress = null, CancellationToken cancellationToken = default);
        Task<AuthResponse> RefreshTokenAsync(string refreshToken, string? ipAddress = null, CancellationToken cancellationToken = default);
        Task<UserDto?> GetUserByIdAsync(Guid userId, CancellationToken cancellationToken = default);
    }

    public interface IUserService
    {
        Task<IReadOnlyList<UserDto>> GetAllUsersAsync(CancellationToken cancellationToken = default);
        Task<UserDto?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
        Task<UserDto> CreateUserAsync(CreateUserRequest request, string actorEmail, CancellationToken cancellationToken = default);
        Task<UserDto> UpdateUserAsync(Guid id, UpdateUserRequest request, string actorEmail, CancellationToken cancellationToken = default);
        Task<bool> ToggleUserStatusAsync(Guid id, string actorEmail, CancellationToken cancellationToken = default);
    }

    public interface IRoleService
    {
        Task<IReadOnlyList<RoleDto>> GetRolesAsync(CancellationToken cancellationToken = default);
        Task<IReadOnlyList<Permission>> GetAllPermissionsAsync(CancellationToken cancellationToken = default);
    }

    public interface IOrganizationService
    {
        Task<IReadOnlyList<OrganizationDto>> GetAllAsync(CancellationToken cancellationToken = default);
        Task<OrganizationDto> CreateAsync(CreateOrganizationRequest request, string actorEmail, CancellationToken cancellationToken = default);
        Task<bool> VerifyAsync(Guid id, string actorEmail, CancellationToken cancellationToken = default);
    }

    public interface IAuditService
    {
        Task LogAsync(string actorId, string actorEmail, string action, string entityName, string? entityId, object details, string? ipAddress = null, string status = "Success", CancellationToken cancellationToken = default);
        Task<IReadOnlyList<AuditEventDto>> GetRecentLogsAsync(int count = 100, string? entityName = null, CancellationToken cancellationToken = default);
    }

    public interface IPasswordHasher
    {
        string HashPassword(string password);
        bool VerifyPassword(string password, string passwordHash);
    }

    public interface IJwtTokenGenerator
    {
        string GenerateToken(User user, IEnumerable<string> roles, IEnumerable<string> permissions);
        string GenerateRefreshToken();
    }
}
