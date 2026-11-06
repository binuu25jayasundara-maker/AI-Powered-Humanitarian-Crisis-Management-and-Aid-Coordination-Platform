using System;
using System.Collections.Generic;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using ResQnet.UnifiedApi.Models;

namespace ResQnet.UnifiedApi.Security
{
    public interface IJwtService
    {
        (string token, string refreshToken, string expiresAt) GenerateTokens(User user, string? effectiveRole = null, IEnumerable<string>? permissions = null);
    }

    public class JwtService : IJwtService
    {
        private readonly IConfiguration _config;

        public JwtService(IConfiguration config)
        {
            _config = config;
        }

        public (string token, string refreshToken, string expiresAt) GenerateTokens(User user, string? effectiveRole = null, IEnumerable<string>? permissions = null)
        {
            var keyStr = _config["Jwt:Key"] ?? "ResQnet_Secret_Super_Secure_Key_2026_SE205_3_Key!";
            var issuer = _config["Jwt:Issuer"] ?? "ResQnet.API";
            var audience = _config["Jwt:Audience"] ?? "ResQnet.Client";
            var expiryMinutes = int.TryParse(_config["Jwt:ExpiryMinutes"], out var m) ? m : 120;

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(keyStr));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var role = !string.IsNullOrWhiteSpace(effectiveRole) ? effectiveRole : user.Role;
            var expires = DateTime.UtcNow.AddMinutes(expiryMinutes);

            var claims = new List<Claim>
            {
                new Claim(JwtRegisteredClaimNames.Sub, user.Id),
                new Claim(JwtRegisteredClaimNames.Email, user.Email),
                new Claim(ClaimTypes.NameIdentifier, user.Id),
                new Claim(ClaimTypes.Name, user.FullName),
                new Claim(ClaimTypes.Email, user.Email),
                new Claim(ClaimTypes.Role, role),
                new Claim("role", role)
            };

            if (!string.IsNullOrEmpty(user.OrganizationId))
            {
                claims.Add(new Claim("organizationId", user.OrganizationId));
            }

            if (!string.IsNullOrEmpty(user.OrganizationName))
            {
                claims.Add(new Claim("organizationName", user.OrganizationName));
            }

            if (permissions != null)
            {
                foreach (var p in permissions)
                {
                    claims.Add(new Claim("permissions", p));
                }
            }
            else
            {
                // Default full permission set for dev
                claims.Add(new Claim("permissions", "all"));
            }

            var tokenDescriptor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(claims),
                Expires = expires,
                Issuer = issuer,
                Audience = audience,
                SigningCredentials = creds
            };

            var handler = new JwtSecurityTokenHandler();
            var token = handler.CreateToken(tokenDescriptor);
            var tokenString = handler.WriteToken(token);

            var refreshTokenBytes = new byte[32];
            using var rng = RandomNumberGenerator.Create();
            rng.GetBytes(refreshTokenBytes);
            var refreshToken = Convert.ToBase64String(refreshTokenBytes);

            return (tokenString, refreshToken, expires.ToString("o"));
        }
    }
}
