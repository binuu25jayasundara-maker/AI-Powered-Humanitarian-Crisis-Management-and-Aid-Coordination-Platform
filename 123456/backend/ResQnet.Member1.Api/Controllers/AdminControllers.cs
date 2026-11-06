using System;
using System.Collections.Generic;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ResQnet.Member1.Application.Common;
using ResQnet.Member1.Application.DTOs;
using ResQnet.Member1.Application.Interfaces;
using ResQnet.Member1.Domain.Entities;

namespace ResQnet.Member1.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class UsersController : ControllerBase
    {
        private readonly IUserService _userService;

        public UsersController(IUserService userService)
        {
            _userService = userService;
        }

        [HttpGet]
        public async Task<ActionResult<ApiResponse<IReadOnlyList<UserDto>>>> GetAll()
        {
            var users = await _userService.GetAllUsersAsync();
            return Ok(ApiResponse<IReadOnlyList<UserDto>>.Ok(users));
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<ApiResponse<UserDto>>> GetById(Guid id)
        {
            var user = await _userService.GetByIdAsync(id);
            if (user == null) return NotFound(ApiResponse<UserDto>.Fail("User not found"));
            return Ok(ApiResponse<UserDto>.Ok(user));
        }

        [HttpPost]
        public async Task<ActionResult<ApiResponse<UserDto>>> Create([FromBody] CreateUserRequest request)
        {
            var actor = User.FindFirst(ClaimTypes.Email)?.Value ?? "admin@resqnet.org";
            var created = await _userService.CreateUserAsync(request, actor);
            return CreatedAtAction(nameof(GetById), new { id = created.Id }, ApiResponse<UserDto>.Ok(created, "User created successfully."));
        }

        [HttpPut("{id}")]
        public async Task<ActionResult<ApiResponse<UserDto>>> Update(Guid id, [FromBody] UpdateUserRequest request)
        {
            var actor = User.FindFirst(ClaimTypes.Email)?.Value ?? "admin@resqnet.org";
            var updated = await _userService.UpdateUserAsync(id, request, actor);
            return Ok(ApiResponse<UserDto>.Ok(updated, "User updated successfully."));
        }

        [HttpPost("{id}/toggle-status")]
        public async Task<ActionResult<ApiResponse<bool>>> ToggleStatus(Guid id)
        {
            var actor = User.FindFirst(ClaimTypes.Email)?.Value ?? "admin@resqnet.org";
            var status = await _userService.ToggleUserStatusAsync(id, actor);
            return Ok(ApiResponse<bool>.Ok(status, status ? "User activated." : "User deactivated."));
        }
    }

    [ApiController]
    [Route("api/[controller]")]
    public class RolesController : ControllerBase
    {
        private readonly IRoleService _roleService;

        public RolesController(IRoleService roleService)
        {
            _roleService = roleService;
        }

        [HttpGet]
        public async Task<ActionResult<ApiResponse<IReadOnlyList<RoleDto>>>> GetRoles()
        {
            var roles = await _roleService.GetRolesAsync();
            return Ok(ApiResponse<IReadOnlyList<RoleDto>>.Ok(roles));
        }

        [HttpGet("permissions")]
        public async Task<ActionResult<ApiResponse<IReadOnlyList<Permission>>>> GetPermissions()
        {
            var perms = await _roleService.GetAllPermissionsAsync();
            return Ok(ApiResponse<IReadOnlyList<Permission>>.Ok(perms));
        }
    }

    [ApiController]
    [Route("api/[controller]")]
    public class OrganizationsController : ControllerBase
    {
        private readonly IOrganizationService _orgService;

        public OrganizationsController(IOrganizationService orgService)
        {
            _orgService = orgService;
        }

        [HttpGet]
        public async Task<ActionResult<ApiResponse<IReadOnlyList<OrganizationDto>>>> GetAll()
        {
            var orgs = await _orgService.GetAllAsync();
            return Ok(ApiResponse<IReadOnlyList<OrganizationDto>>.Ok(orgs));
        }

        [HttpPost]
        public async Task<ActionResult<ApiResponse<OrganizationDto>>> Create([FromBody] CreateOrganizationRequest request)
        {
            var actor = User.FindFirst(ClaimTypes.Email)?.Value ?? "admin@resqnet.org";
            var created = await _orgService.CreateAsync(request, actor);
            return Ok(ApiResponse<OrganizationDto>.Ok(created, "Organization created."));
        }

        [HttpPost("{id}/verify")]
        public async Task<ActionResult<ApiResponse<bool>>> Verify(Guid id)
        {
            var actor = User.FindFirst(ClaimTypes.Email)?.Value ?? "admin@resqnet.org";
            var verified = await _orgService.VerifyAsync(id, actor);
            return Ok(ApiResponse<bool>.Ok(verified, "Organization verified successfully."));
        }
    }

    [ApiController]
    [Route("api/[controller]")]
    public class AuditController : ControllerBase
    {
        private readonly IAuditService _auditService;

        public AuditController(IAuditService auditService)
        {
            _auditService = auditService;
        }

        [HttpGet]
        public async Task<ActionResult<ApiResponse<IReadOnlyList<AuditEventDto>>>> GetLogs([FromQuery] int count = 100, [FromQuery] string? entityName = null)
        {
            var logs = await _auditService.GetRecentLogsAsync(count, entityName);
            return Ok(ApiResponse<IReadOnlyList<AuditEventDto>>.Ok(logs));
        }
    }
}
