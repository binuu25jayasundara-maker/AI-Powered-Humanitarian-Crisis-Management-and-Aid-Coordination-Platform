using System;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ResQnet.Member1.Application.Common;
using ResQnet.Member1.Application.DTOs;
using ResQnet.Member1.Application.Interfaces;

namespace ResQnet.Member1.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _authService;

        public AuthController(IAuthService _authService)
        {
            this._authService = _authService;
        }

        [HttpPost("login")]
        [AllowAnonymous]
        public async Task<ActionResult<ApiResponse<AuthResponse>>> Login([FromBody] LoginRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Password))
            {
                return BadRequest(ApiResponse<AuthResponse>.Fail("Email and password are required."));
            }

            var ip = HttpContext.Connection.RemoteIpAddress?.ToString();
            var response = await _authService.LoginAsync(request, ip);
            return Ok(ApiResponse<AuthResponse>.Ok(response, "Login successful."));
        }

        [HttpPost("register")]
        [AllowAnonymous]
        public async Task<ActionResult<ApiResponse<AuthResponse>>> Register([FromBody] RegisterRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Password))
            {
                return BadRequest(ApiResponse<AuthResponse>.Fail("Email and password are required."));
            }

            var ip = HttpContext.Connection.RemoteIpAddress?.ToString();
            var response = await _authService.RegisterAsync(request, ip);
            return Ok(ApiResponse<AuthResponse>.Ok(response, "Registration successful."));
        }

        [HttpPost("refresh-token")]
        [AllowAnonymous]
        public async Task<ActionResult<ApiResponse<AuthResponse>>> RefreshToken([FromBody] RefreshTokenRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.RefreshToken))
            {
                return BadRequest(ApiResponse<AuthResponse>.Fail("Refresh token is required."));
            }

            var ip = HttpContext.Connection.RemoteIpAddress?.ToString();
            var response = await _authService.RefreshTokenAsync(request.RefreshToken, ip);
            return Ok(ApiResponse<AuthResponse>.Ok(response, "Token refreshed successfully."));
        }

        [HttpGet("me")]
        [Authorize]
        public async Task<ActionResult<ApiResponse<UserDto>>> GetCurrentUserInfo()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value 
                              ?? User.FindFirst("sub")?.Value;

            if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
            {
                return Unauthorized(ApiResponse<UserDto>.Fail("Unauthorized token claims."));
            }

            var user = await _authService.GetUserByIdAsync(userId);
            if (user == null)
            {
                return NotFound(ApiResponse<UserDto>.Fail("User record not found."));
            }

            return Ok(ApiResponse<UserDto>.Ok(user));
        }
    }
}
