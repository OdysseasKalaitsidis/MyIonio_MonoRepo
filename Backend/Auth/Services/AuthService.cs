

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
            await _context.SaveChangesAsync();

            //  Map DTO to entity
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
            await _context.SaveChangesAsync();

            // Generate token
            var token = GenerateJwtToken(user);

            // Return response with both JWT + recommendation
            return new RegisterResponseWithTestDto
            {
                Token = token,
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
            if (user == null)
            {
                throw new Exception("Invalid Email");
            }

            if (!_passHasher.VerifyPassword(loginRequestDto.Password, user.PasswordHash))
            {
                throw new Exception("Invalid Password");
            }

            var jwtToken = GenerateJwtToken(user);

            // Create refresh token
            var refreshToken = new RefreshToken
            {
                Token = GenerateRefreshToken(),
                UserId = user.Id,
                Expires = DateTime.UtcNow.AddDays(7) // valid for 7 days
            };

            _context.RefreshTokens.Add(refreshToken);
            await _context.SaveChangesAsync();


            return new AuthResponseDto
            {
                Token = jwtToken,
                Email = user.Email,
                FirstName = user.FirstName ?? "",
                LastName = user.LastName ?? "",
                UserId = user.Id,
                RefreshToken = refreshToken.Token,
                Semester = user.Semester,
                Department = user.Department,
                Major = user.Major,
                Minor = user.Minor
            };
        }
        
        // Google
        
        public async Task<User?> FindByEmailAsync(string email)
        {
            return await _context.Users.FirstOrDefaultAsync(u => u.Email == email);
        }

        public async Task<GoogleJsonWebSignature.Payload> ValidateGoogleTokenAsync(string idToken)
        {
            var settings = new GoogleJsonWebSignature.ValidationSettings()
            {
                Audience = new List<string>() { _config["Google:ClientId"] }
            };
            var payload = await GoogleJsonWebSignature.ValidateAsync(idToken, settings);
            return payload;
        }

        public async Task<AuthResponseDto> HandleGoogleLoginAsync(GoogleLoginDto loginDto)
        {
            // 1. Validate Token
            var payload = await ValidateGoogleTokenAsync(loginDto.IdToken);

            // 2. Use provided Course Names directly
            List<string> enrolledCourses = new List<string>();
            if (loginDto.EnrolledCourses != null && loginDto.EnrolledCourses.Any() && !string.IsNullOrEmpty(loginDto.Semester))
            {
                enrolledCourses = loginDto.EnrolledCourses;
            }

            // 3. Find User
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == payload.Email);

            if (user == null)
            {
                // 4. Create New User
                user = new User
                {
                    Email = payload.Email,
                    FirstName = payload.GivenName,
                    LastName = payload.FamilyName,
                    CreatedAt = DateTime.UtcNow,
                    PasswordHash = Guid.NewGuid().ToString(), // Random hash for Google users
                    
                    // Apply preferences if provided
                    Semester = loginDto.Semester,
                    Department = loginDto.Department,
                    Major = loginDto.Major,
                    Minor = loginDto.Minor
                };

                // Initialize EnrolledCourses with course names
                if (enrolledCourses.Any() && !string.IsNullOrEmpty(loginDto.Semester))
                {
                    user.EnrolledCourses = new Dictionary<string, List<string>>
                    {
                        { loginDto.Semester, enrolledCourses }
                    };
                }

                _context.Users.Add(user);
            }
            else
            {
                // 5. Update Existing User Preferences (only if provided in DTO)
                if (!string.IsNullOrEmpty(loginDto.Semester)) user.Semester = loginDto.Semester;
                if (!string.IsNullOrEmpty(loginDto.Department)) user.Department = loginDto.Department;
                if (!string.IsNullOrEmpty(loginDto.Major)) user.Major = loginDto.Major;
                if (!string.IsNullOrEmpty(loginDto.Minor)) user.Minor = loginDto.Minor;

                // Sync Enrolled Courses (Overwrite for this semester)
                if (enrolledCourses.Any() && !string.IsNullOrEmpty(loginDto.Semester))
                {
                    if (user.EnrolledCourses == null) user.EnrolledCourses = new Dictionary<string, List<string>>();

                    if (user.EnrolledCourses.ContainsKey(loginDto.Semester))
                    {
                        user.EnrolledCourses[loginDto.Semester] = enrolledCourses;
                    }
                    else
                    {
                        user.EnrolledCourses.Add(loginDto.Semester, enrolledCourses);
                    }
                }
            }
            
            // Save changes (covers both insert and update)
            await _context.SaveChangesAsync();

            // 6. Generate Response
            return await SignInGoogleUserAsync(user);
        }

        public async Task<AuthResponseDto> SignInGoogleUserAsync(User user)
        {
            // 1. Generate JWT
            var token = GenerateJwtToken(user);

            // 2. Set Cookie (Best Practice Backup)
            var cookieOptions = new CookieOptions
            {
                HttpOnly = true,
                Secure = true,
                SameSite = SameSiteMode.None,
                Expires = DateTime.UtcNow.AddHours(_jwtSettings.ExpiryHours)
            };
            _httpContextAccessor.HttpContext?.Response.Cookies.Append("jwt", token, cookieOptions);

            // 3. Generate Refresh Token
            var refreshToken = new RefreshToken
            {
                Token = GenerateRefreshToken(),
                UserId = user.Id,
                Expires = DateTime.UtcNow.AddDays(7)
            };
            _context.RefreshTokens.Add(refreshToken);
            await _context.SaveChangesAsync();

            // 4. Return DTO
            return new AuthResponseDto
            {
                Token = token,
                Email = user.Email,
                FirstName = user.FirstName ?? "",
                LastName = user.LastName ?? "",
                UserId = user.Id,
                RefreshToken = refreshToken.Token,
                Semester = user.Semester,
                Department = user.Department,
                Major = user.Major,
                Minor = user.Minor
            };
        }
        
        public async Task<AuthResponseDto> AuthRegisterGoogleAsync(RegisterGoogleRequestDto requestDto)
{
    // 1. Validate the Google Token and extract payload
    // We reuse your existing validation method here
    var payload = await ValidateGoogleTokenAsync(requestDto.IdToken);

    // 2. Check if user already exists
    var existingUser = await _context.Users.FirstOrDefaultAsync(u => u.Email == payload.Email);
    if (existingUser != null)
    {
        throw new Exception("User already exists. Please login with Google instead.");
    }

    // 3. Create the User Entity
    // We map Google's payload (GivenName, FamilyName, Email) to your User entity
    var user = new User
    {
        Email = payload.Email,
        FirstName = payload.GivenName, 
        LastName = payload.FamilyName,
        Semester = requestDto.Semester,
        // Assuming your User entity has a Department property:
        Department = requestDto.Department, 
        CreatedAt = DateTime.UtcNow,
        
        // Mark if they have completed the test based on whether data was sent
        HasCompletedTest = requestDto.Recommendation != null,
        
        // Since it's a Google user, we can set a random impossible password 
        // or leave it null if your DB allows it.
        PasswordHash = Guid.NewGuid().ToString() 
    };

    _context.Users.Add(user);
    await _context.SaveChangesAsync();

    // 4. Conditionally Save Test Results (Recommendation)
    if (requestDto.Recommendation != null)
    {
        var userRecommendation = new UserRecommendation
        {
            UserId = user.Id,
            PrimaryMajor = requestDto.Recommendation.PrimaryMajor,
            SecondaryMajor = requestDto.Recommendation.SecondaryMajor,
            PrimaryToolbox = requestDto.Recommendation.PrimaryToolbox,
            SecondaryToolbox = requestDto.Recommendation.SecondaryToolbox,
            ConfidenceLevel = requestDto.Recommendation.ConfidenceLevel,
            ProfileType = requestDto.Recommendation.ProfileType,
            Reasoning = requestDto.Recommendation.Reasoning,
            CreatedAt = DateTime.UtcNow
        };

        _context.UserRecommendation.Add(userRecommendation);
        await _context.SaveChangesAsync();
    }

    // 5. Generate Tokens (JWT + Refresh)
    // Reuse your existing logic
    var jwtToken = GenerateJwtToken(user);

    var refreshToken = new RefreshToken
    {
        Token = GenerateRefreshToken(),
        UserId = user.Id,
        Expires = DateTime.UtcNow.AddDays(7)
    };

    _context.RefreshTokens.Add(refreshToken);
    await _context.SaveChangesAsync();

    // 6. Return Auth Response
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
                throw new Exception("Invalid refresh token");

            // Revoke old refresh token
            storedToken.IsRevoked = true;

            // Generate new JWT
            var newJwt = GenerateJwtToken(storedToken.User);

            // Generate new refresh token
            var newRefreshToken = new RefreshToken
            {
                Token = GenerateRefreshToken(),
                UserId = storedToken.UserId,
                Expires = DateTime.UtcNow.AddDays(7)
            };

            _context.RefreshTokens.Add(newRefreshToken);
            await _context.SaveChangesAsync();

            return new AuthResponseDto
            {
                Token = newJwt,
                Email = storedToken.User.Email,
                FirstName = storedToken.User.FirstName ?? "",
                LastName = storedToken.User.LastName ?? "",
                RefreshToken = newRefreshToken.Token,
                UserId = storedToken.User.Id,
                Semester = storedToken.User.Semester,
                Department = storedToken.User.Department,
                Major = storedToken.User.Major,
                Minor = storedToken.User.Minor
            };
        }



    }
}
