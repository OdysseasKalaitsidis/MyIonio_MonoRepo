

using MyIonio.Auth.Services;
using MyIonio.Data;
using MyIonio.DTOs;
using MyIonio.Models;
using Microsoft.AspNet.Identity;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Microsoft.Extensions.Configuration;
using Microsoft.AspNetCore.Http;
using System.Net.Http;
using System.Text.Json;
using System.Text.Json.Serialization;
using Google.Apis.Auth;
namespace MyIonio
{
    public class AuthService
    {
        private readonly AppDbContext _context;
        private readonly PasswordHasherauth _passHasher;
        private readonly JwtSettings _jwtSettings;
        private readonly IConfiguration _config;
        private readonly HttpClient _httpClient;
        private readonly IHttpContextAccessor _httpContextAccessor;

        public AuthService(AppDbContext context, PasswordHasherauth passHasher, IOptions<JwtSettings> options, IConfiguration config, HttpClient httpClient, IHttpContextAccessor httpContextAccessor)
        {
            _context = context;
            _passHasher = passHasher;
            _jwtSettings = options.Value ?? throw new ArgumentNullException(nameof(options));
            _config = config;
            _httpClient = httpClient;
            _httpContextAccessor = httpContextAccessor;

            if (string.IsNullOrEmpty(_jwtSettings.Key))
                throw new InvalidOperationException("JWT key is missing in configuration!");
                
            if (string.IsNullOrEmpty(_config["Google:ClientId"]))
            {
                Console.WriteLine("WARNING: Google:ClientId is missing. Google Authentication will not work.");
            }
        }


        public async Task<RegisterResponseDto> AuthRegisterAsync(RegisterRequestDto registerRequestDto)
        {

            //Check if UserExists 
            if (await _context.Users.AnyAsync(u => u.Email == registerRequestDto.Email))
            {
                throw new Exception("This email already exists");
            }

            // Check if passwords are correct 
            if (registerRequestDto.Password != registerRequestDto.ConfirmPassword)
            {
                throw new Exception("Password Missmatching");

            }

            //Hash Password 

            var hash = _passHasher.HashPassword(registerRequestDto.ConfirmPassword);

            //Create user 

            var user = new User
            {
                Email = registerRequestDto.Email,
                FirstName = registerRequestDto.Name,
                LastName = registerRequestDto.Surname,
                PasswordHash = hash,
                Semester = registerRequestDto.Semester,
                Department = registerRequestDto.Department,
                HasCompletedTest = false
                

            }; 

            // Add user to DB
            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            // Return response
            return new RegisterResponseDto
            {
                UserId = user.Id
        

            };
        }


        public async Task<RegisterResponseWithTestDto> AuthRegisterWithTestAsync(
            RegisterRequestDto registerRequestDto,
            RecommendationDto recommendationDto,
            List<UserAnswerDto> userAnswers)
        {
            // Check if user exists
            if (await _context.Users.AnyAsync(u => u.Email == registerRequestDto.Email))
                throw new Exception("This email already exists");

            // Check password match
            if (registerRequestDto.Password != registerRequestDto.ConfirmPassword)
                throw new Exception("Password mismatch");

            // Hash password
            var hash = _passHasher.HashPassword(registerRequestDto.ConfirmPassword);

            // Create user
            var user = new User
            {
                Email = registerRequestDto.Email,
                FirstName = registerRequestDto.Name,
                LastName = registerRequestDto.Surname,
                PasswordHash = hash,
                Semester = registerRequestDto.Semester,
                Department = registerRequestDto.Department,
                HasCompletedTest = true,
                CreatedAt = DateTime.UtcNow,
            };

            _context.Users.Add(user);

            // Map DTO to entity
            var userRecommendation = new UserRecommendation
            {
                UserId = user.Id,
                PrimaryMajor = recommendationDto.PrimaryMajor,
                SecondaryMajor = recommendationDto.SecondaryMajor,
                PrimaryToolbox = recommendationDto.PrimaryToolbox,
                SecondaryToolbox = recommendationDto.SecondaryToolbox,
                ConfidenceLevel = recommendationDto.ConfidenceLevel,
                ProfileType = recommendationDto.ProfileType,
                Reasoning = recommendationDto.Reasoning,
                CreatedAt = DateTime.UtcNow,
            };

            _context.UserRecommendation.Add(userRecommendation);
            
            // Single SaveChanges for atomicity
            await _context.SaveChangesAsync();

            // Generate response
            var authResponse = await CreateAuthResponseAsync(user);

            return new RegisterResponseWithTestDto
            {
                Token = authResponse.Token,
                UserId = user.Id,
                Recommendation = new RecommendationDto
                {
                    PrimaryMajor = userRecommendation.PrimaryMajor,
                    SecondaryMajor = userRecommendation.SecondaryMajor,
                    PrimaryToolbox = userRecommendation.PrimaryToolbox,
                    SecondaryToolbox = userRecommendation.SecondaryToolbox,
                    ConfidenceLevel = userRecommendation.ConfidenceLevel,
                    ProfileType = userRecommendation.ProfileType,
                    Reasoning = userRecommendation.Reasoning,
                    UserId = userRecommendation.UserId,
                }
            };
        }

        public async Task<AuthResponseDto> AuthLoginAsync(LoginRequestDto loginRequestDto)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == loginRequestDto.Email);
            if (user == null || !_passHasher.VerifyPassword(loginRequestDto.Password, user.PasswordHash))
            {
                throw new Exception("Invalid email or password");
            }

            return await CreateAuthResponseAsync(user);
        }
        
        // Google
        
        public async Task<User?> FindByEmailAsync(string email)
        {
            return await _context.Users.FirstOrDefaultAsync(u => u.Email == email);
        }

        public async Task<GoogleJsonWebSignature.Payload> ValidateGoogleTokenAsync(string idToken)
        {
            var clientId = _config["Google:ClientId"];
            if (string.IsNullOrEmpty(clientId))
            {
                throw new InvalidOperationException("Google Client ID is not configured on the server.");
            }

            var settings = new GoogleJsonWebSignature.ValidationSettings()
            {
                Audience = new List<string>() { clientId }
            };
            var payload = await GoogleJsonWebSignature.ValidateAsync(idToken, settings);
            return payload;
        }

        public async Task<AuthResponseDto> HandleGoogleAuthAsync(string idToken, string? semester = null, string? department = null, string? major = null, string? minor = null, List<string>? enrolledCourses = null, RecommendationDto? recommendation = null)
        {
            // 1. Validate Token
            var payload = await ValidateGoogleTokenAsync(idToken);

            // 2. Find or Create User
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == payload.Email);

            if (user == null)
            {
                user = new User
                {
                    Email = payload.Email,
                    FirstName = payload.GivenName,
                    LastName = payload.FamilyName,
                    CreatedAt = DateTime.UtcNow,
                    PasswordHash = "GOOGLE_USER_" + Guid.NewGuid().ToString("N"),
                    Semester = semester,
                    Department = department,
                    Major = major,
                    Minor = minor,
                    HasCompletedTest = recommendation != null
                };

                if (enrolledCourses != null && enrolledCourses.Any() && !string.IsNullOrEmpty(semester))
                {
                    user.EnrolledCourses = new Dictionary<string, List<string>> { { semester, enrolledCourses } };
                }

                _context.Users.Add(user);
                
                if (recommendation != null)
                {
                    var userRec = new UserRecommendation
                    {
                        UserId = user.Id,
                        PrimaryMajor = recommendation.PrimaryMajor,
                        SecondaryMajor = recommendation.SecondaryMajor,
                        PrimaryToolbox = recommendation.PrimaryToolbox,
                        SecondaryToolbox = recommendation.SecondaryToolbox,
                        ConfidenceLevel = recommendation.ConfidenceLevel,
                        ProfileType = recommendation.ProfileType,
                        Reasoning = recommendation.Reasoning,
                        CreatedAt = DateTime.UtcNow
                    };
                    _context.UserRecommendation.Add(userRec);
                }
            }
            else
            {
                // Update existing user preferences if provided
                if (!string.IsNullOrEmpty(semester)) user.Semester = semester;
                if (!string.IsNullOrEmpty(department)) user.Department = department;
                if (!string.IsNullOrEmpty(major)) user.Major = major;
                if (!string.IsNullOrEmpty(minor)) user.Minor = minor;
                if (recommendation != null) user.HasCompletedTest = true;

                if (enrolledCourses != null && enrolledCourses.Any() && !string.IsNullOrEmpty(semester))
                {
                    user.EnrolledCourses ??= new Dictionary<string, List<string>>();
                    user.EnrolledCourses[semester] = enrolledCourses;
                }
            }

            await _context.SaveChangesAsync();
            return await CreateAuthResponseAsync(user);
        }


        //JWT SERVICE
        private string GenerateRefreshToken()
        {
            var randomBytes = new byte[64]; // 512-bit token
            using var rng = RandomNumberGenerator.Create();
            rng.GetBytes(randomBytes);
            return Convert.ToBase64String(randomBytes);
        }


        public string GenerateJwtToken(User user)
        {
            var tokenHandler = new JwtSecurityTokenHandler();
            var key = Encoding.UTF8.GetBytes(_jwtSettings.Key);

            var tokenDescriptor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(new[]
                {
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new Claim(ClaimTypes.Email, user.Email),
                new Claim(ClaimTypes.Name, user.FirstName ?? "User"),
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
                new Claim("semester", user.Semester ?? "")

            }),
                Expires = DateTime.UtcNow.AddHours(_jwtSettings.ExpiryHours),
                Issuer = _jwtSettings.Issuer,
                Audience = _jwtSettings.Audience,
                SigningCredentials = new SigningCredentials(
                    new SymmetricSecurityKey(key),
                    SecurityAlgorithms.HmacSha256Signature)
            };

            var token = tokenHandler.CreateToken(tokenDescriptor);
            return tokenHandler.WriteToken(token);
        }


        public async Task<AuthResponseDto> RefreshTokenAsync(string refreshToken)
        {
            var storedToken = await _context.RefreshTokens
                .Include(rt => rt.User)
                .FirstOrDefaultAsync(rt => rt.Token == refreshToken);

            if (storedToken == null || !storedToken.IsActive)
                throw new Exception("Invalid or expired refresh token");

            // Revoke old refresh token
            storedToken.IsRevoked = true;
            
            // Create new auth state
            return await CreateAuthResponseAsync(storedToken.User);
        }

        private async Task<AuthResponseDto> CreateAuthResponseAsync(User user)
        {
            var jwtToken = GenerateJwtToken(user);
            var refreshToken = new RefreshToken
            {
                Token = GenerateRefreshToken(),
                UserId = user.Id,
                Expires = DateTime.UtcNow.AddDays(7)
            };

            _context.RefreshTokens.Add(refreshToken);
            await _context.SaveChangesAsync();

            // Set HTTP-only cookie for extra security layer
            var cookieOptions = new CookieOptions
            {
                HttpOnly = true,
                Secure = true, // Assumes HTTPS in production
                SameSite = SameSiteMode.None,
                Expires = DateTime.UtcNow.AddHours(_jwtSettings.ExpiryHours)
            };
            _httpContextAccessor.HttpContext?.Response.Cookies.Append("jwt", jwtToken, cookieOptions);

            return new AuthResponseDto
            {
                Token = jwtToken,
                RefreshToken = refreshToken.Token,
                Email = user.Email,
                FirstName = user.FirstName ?? "",
                LastName = user.LastName ?? "",
                UserId = user.Id,
                Semester = user.Semester,
                Department = user.Department,
                Major = user.Major,
                Minor = user.Minor
            };
        }



    }
}
