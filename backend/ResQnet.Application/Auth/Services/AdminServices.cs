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
    public class UserService : IUserService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IPasswordHasher _passwordHasher;
        private readonly IAuditService _auditService;

        public UserService(IUnitOfWork unitOfWork, IPasswordHasher passwordHasher, IAuditService auditService)
        {
            _unitOfWork = unitOfWork;
            _passwordHasher = passwordHasher;
            _auditService = auditService;
        }

        public async Task<IReadOnlyList<UserDto>> GetAllUsersAsync(CancellationToken cancellationToken = default)
        {
            var users = await _unitOfWork.Repository<User>().GetAllAsync(cancellationToken);
            var orgs = await _unitOfWork.Repository<Organization>().GetAllAsync(cancellationToken);
            var orgDict = orgs.ToDictionary(o => o.Id, o => o.Name);

            return users.Select(u => new UserDto
            {
                Id = u.Id,
                FullName = u.FullName,
                Email = u.Email,
                Role = u.Role,
                OrganizationId = u.OrganizationId,
                OrganizationName = u.OrganizationId.HasValue && orgDict.ContainsKey(u.OrganizationId.Value) ? orgDict[u.OrganizationId.Value] : null,
                IsActive = u.IsActive,
                CreatedAt = u.CreatedAt,
                LastLoginAt = u.LastLoginAt
            }).ToList();
        }

        public async Task<UserDto?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
        {
            var user = await _unitOfWork.Repository<User>().GetByIdAsync(id, cancellationToken);
            if (user == null) return null;

            string? orgName = null;
            if (user.OrganizationId.HasValue)
            {
                var org = await _unitOfWork.Repository<Organization>().GetByIdAsync(user.OrganizationId.Value, cancellationToken);
                orgName = org?.Name;
            }

            return new UserDto
            {
                Id = user.Id,
                FullName = user.FullName,
                Email = user.Email,
                Role = user.Role,
                OrganizationId = user.OrganizationId,
                OrganizationName = orgName,
                IsActive = user.IsActive,
                CreatedAt = user.CreatedAt,
                LastLoginAt = user.LastLoginAt
            };
        }

        public async Task<UserDto> CreateUserAsync(CreateUserRequest request, string actorEmail, CancellationToken cancellationToken = default)
        {
            var existing = await _unitOfWork.Repository<User>().FindAsync(u => u.Email.ToLower() == request.Email.ToLower(), cancellationToken);
            if (existing.Any())
            {
                throw new InvalidOperationException("User with this email already exists.");
            }

            var user = new User
            {
                FullName = request.FullName,
                Email = request.Email,
                PasswordHash = _passwordHasher.HashPassword(request.Password),
                Role = request.Role,
                OrganizationId = request.OrganizationId,
                PhoneNumber = request.PhoneNumber,
                IsActive = true
            };

            await _unitOfWork.Repository<User>().AddAsync(user, cancellationToken);
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            await _auditService.LogAsync(actorEmail, actorEmail, "USER_CREATED", "User", user.Id.ToString(), new { email = user.Email, role = user.Role }, null, "Success", cancellationToken);

            return new UserDto
            {
                Id = user.Id,
                FullName = user.FullName,
                Email = user.Email,
                Role = user.Role,
                OrganizationId = user.OrganizationId,
                IsActive = user.IsActive,
                CreatedAt = user.CreatedAt
            };
        }

        public async Task<UserDto> UpdateUserAsync(Guid id, UpdateUserRequest request, string actorEmail, CancellationToken cancellationToken = default)
        {
            var user = await _unitOfWork.Repository<User>().GetByIdAsync(id, cancellationToken);
            if (user == null) throw new KeyNotFoundException("User not found.");

            user.FullName = request.FullName;
            user.Role = request.Role;
            user.OrganizationId = request.OrganizationId;
            user.IsActive = request.IsActive;
            user.UpdatedAt = DateTime.UtcNow;

            await _unitOfWork.Repository<User>().UpdateAsync(user, cancellationToken);
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            await _auditService.LogAsync(actorEmail, actorEmail, "USER_UPDATED", "User", user.Id.ToString(), new { email = user.Email, role = user.Role, isActive = user.IsActive }, null, "Success", cancellationToken);

            return new UserDto
            {
                Id = user.Id,
                FullName = user.FullName,
                Email = user.Email,
                Role = user.Role,
                OrganizationId = user.OrganizationId,
                IsActive = user.IsActive,
                CreatedAt = user.CreatedAt,
                LastLoginAt = user.LastLoginAt
            };
        }

        public async Task<bool> ToggleUserStatusAsync(Guid id, string actorEmail, CancellationToken cancellationToken = default)
        {
            var user = await _unitOfWork.Repository<User>().GetByIdAsync(id, cancellationToken);
            if (user == null) throw new KeyNotFoundException("User not found.");

            user.IsActive = !user.IsActive;
            user.UpdatedAt = DateTime.UtcNow;

            await _unitOfWork.Repository<User>().UpdateAsync(user, cancellationToken);
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            await _auditService.LogAsync(actorEmail, actorEmail, user.IsActive ? "USER_ACTIVATED" : "USER_DEACTIVATED", "User", user.Id.ToString(), new { isActive = user.IsActive }, null, "Success", cancellationToken);

            return user.IsActive;
        }
    }

    public class OrganizationService : IOrganizationService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IAuditService _auditService;

        public OrganizationService(IUnitOfWork unitOfWork, IAuditService auditService)
        {
            _unitOfWork = unitOfWork;
            _auditService = auditService;
        }

        public async Task<IReadOnlyList<OrganizationDto>> GetAllAsync(CancellationToken cancellationToken = default)
        {
            var orgs = await _unitOfWork.Repository<Organization>().GetAllAsync(cancellationToken);
            var users = await _unitOfWork.Repository<User>().GetAllAsync(cancellationToken);

            return orgs.Select(o => new OrganizationDto
            {
                Id = o.Id,
                Name = o.Name,
                Code = o.Code,
                Type = o.Type,
                ContactEmail = o.ContactEmail,
                ContactPhone = o.ContactPhone,
                Address = o.Address,
                IsVerified = o.IsVerified,
                MemberCount = users.Count(u => u.OrganizationId == o.Id)
            }).ToList();
        }

        public async Task<OrganizationDto> CreateAsync(CreateOrganizationRequest request, string actorEmail, CancellationToken cancellationToken = default)
        {
            var org = new Organization
            {
                Name = request.Name,
                Code = request.Code,
                Type = request.Type,
                ContactEmail = request.ContactEmail,
                ContactPhone = request.ContactPhone,
                Address = request.Address,
                IsVerified = true,
                VerifiedAt = DateTime.UtcNow
            };

            await _unitOfWork.Repository<Organization>().AddAsync(org, cancellationToken);
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            await _auditService.LogAsync(actorEmail, actorEmail, "ORGANIZATION_CREATED", "Organization", org.Id.ToString(), new { name = org.Name, code = org.Code }, null, "Success", cancellationToken);

            return new OrganizationDto
            {
                Id = org.Id,
                Name = org.Name,
                Code = org.Code,
                Type = org.Type,
                ContactEmail = org.ContactEmail,
                ContactPhone = org.ContactPhone,
                Address = org.Address,
                IsVerified = org.IsVerified,
                MemberCount = 0
            };
        }

        public async Task<bool> VerifyAsync(Guid id, string actorEmail, CancellationToken cancellationToken = default)
        {
            var org = await _unitOfWork.Repository<Organization>().GetByIdAsync(id, cancellationToken);
            if (org == null) throw new KeyNotFoundException("Organization not found.");

            org.IsVerified = true;
            org.VerifiedAt = DateTime.UtcNow;
            await _unitOfWork.Repository<Organization>().UpdateAsync(org, cancellationToken);
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            await _auditService.LogAsync(actorEmail, actorEmail, "ORGANIZATION_VERIFIED", "Organization", org.Id.ToString(), new { name = org.Name }, null, "Success", cancellationToken);

            return true;
        }
    }

    public class AuditService : IAuditService
    {
        private readonly IUnitOfWork _unitOfWork;

        public AuditService(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }

        public async Task LogAsync(string actorId, string actorEmail, string action, string entityName, string? entityId, object details, string? ipAddress = null, string status = "Success", CancellationToken cancellationToken = default)
        {
            try
            {
                var audit = new AuditEvent
                {
                    ActorId = string.IsNullOrWhiteSpace(actorId) ? "Anonymous" : actorId,
                    ActorEmail = string.IsNullOrWhiteSpace(actorEmail) ? "anonymous@resqnet.local" : actorEmail,
                    Action = action,
                    EntityName = entityName,
                    EntityId = entityId,
                    DetailsJson = JsonSerializer.Serialize(details),
                    IpAddress = ipAddress ?? "127.0.0.1",
                    Status = status
                };

                await _unitOfWork.Repository<AuditEvent>().AddAsync(audit, cancellationToken);
                await _unitOfWork.SaveChangesAsync(cancellationToken);
            }
            catch
            {
                // Never let audit logging failure bring down the primary transaction
            }
        }

        public async Task<IReadOnlyList<AuditEventDto>> GetRecentLogsAsync(int count = 100, string? entityName = null, CancellationToken cancellationToken = default)
        {
            var logs = string.IsNullOrWhiteSpace(entityName)
                ? await _unitOfWork.Repository<AuditEvent>().GetAllAsync(cancellationToken)
                : await _unitOfWork.Repository<AuditEvent>().FindAsync(a => a.EntityName == entityName, cancellationToken);

            return logs.OrderByDescending(l => l.CreatedAt)
                       .Take(count)
                       .Select(l => new AuditEventDto
                       {
                           Id = l.Id,
                           ActorId = l.ActorId,
                           ActorEmail = l.ActorEmail,
                           Action = l.Action,
                           EntityName = l.EntityName,
                           EntityId = l.EntityId,
                           DetailsJson = l.DetailsJson,
                           IpAddress = l.IpAddress,
                           Status = l.Status,
                           CreatedAt = l.CreatedAt
                       }).ToList();
        }
    }

    public class RoleService : IRoleService
    {
        private readonly IUnitOfWork _unitOfWork;

        public RoleService(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }

        public async Task<IReadOnlyList<RoleDto>> GetRolesAsync(CancellationToken cancellationToken = default)
        {
            var roles = await _unitOfWork.Repository<Role>().GetAllAsync(cancellationToken);
            return roles.Select(r => new RoleDto
            {
                Id = r.Id,
                Name = r.Name,
                Description = r.Description,
                IsSystemRole = r.IsSystemRole
            }).ToList();
        }

        public async Task<IReadOnlyList<Permission>> GetAllPermissionsAsync(CancellationToken cancellationToken = default)
        {
            return await _unitOfWork.Repository<Permission>().GetAllAsync(cancellationToken);
        }
    }
}
