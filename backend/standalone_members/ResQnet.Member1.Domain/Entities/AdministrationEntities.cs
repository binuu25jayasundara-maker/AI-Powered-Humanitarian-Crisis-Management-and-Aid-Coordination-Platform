using System;
using System.Collections.Generic;

namespace ResQnet.Member1.Domain.Entities
{
    public class Organization : BaseEntity
    {
        public string Name { get; set; } = string.Empty;
        public string Code { get; set; } = string.Empty; // e.g. "DMC-LK", "SLRC", "UNHCR"
        public string Type { get; set; } = "NGO"; // Government, NGO, International, VolunteerGroup
        public string ContactEmail { get; set; } = string.Empty;
        public string ContactPhone { get; set; } = string.Empty;
        public string Address { get; set; } = string.Empty;
        public bool IsVerified { get; set; } = true;
        public DateTime? VerifiedAt { get; set; }

        public virtual ICollection<User> Users { get; set; } = new List<User>();
    }

    public class Role : BaseEntity
    {
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public bool IsSystemRole { get; set; } = true;
        public virtual ICollection<RolePermission> RolePermissions { get; set; } = new List<RolePermission>();
    }

    public class Permission : BaseEntity
    {
        public string Code { get; set; } = string.Empty; // e.g. "users.create", "cases.approve"
        public string Description { get; set; } = string.Empty;
        public string Category { get; set; } = "General"; // Security, Governance, Cases, Logistics, Volunteers, Donors
    }

    public class RolePermission
    {
        public Guid RoleId { get; set; }
        public virtual Role Role { get; set; } = null!;
        public Guid PermissionId { get; set; }
        public virtual Permission Permission { get; set; } = null!;
    }

    public class AuditEvent : BaseEntity
    {
        public string ActorId { get; set; } = string.Empty;
        public string ActorEmail { get; set; } = string.Empty;
        public string Action { get; set; } = string.Empty; // e.g. "AUTH_LOGIN", "USER_CREATED", "ROLE_UPDATED"
        public string EntityName { get; set; } = string.Empty; // e.g. "User", "Role", "Organization"
        public string? EntityId { get; set; }
        public string DetailsJson { get; set; } = "{}";
        public string? IpAddress { get; set; }
        public string Status { get; set; } = "Success"; // Success, Failed
    }

    public class RefreshToken : BaseEntity
    {
        public Guid UserId { get; set; }
        public virtual User User { get; set; } = null!;
        public string Token { get; set; } = string.Empty;
        public DateTime ExpiresAt { get; set; }
        public bool IsRevoked { get; set; }
        public string? ReplacedByToken { get; set; }
    }
}
