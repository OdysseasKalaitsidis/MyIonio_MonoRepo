

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
using MyIonio.Auth;
namespace MyIonio
{
    public class AuthService
    {
        public const string AccessCookieName = "myionio_access";
        public const string RefreshCookieName = "myionio_refresh";
        public const string GoogleNonceCookieName = "myionio_google_nonce";
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
            EnsureLegalAcceptance(registerRequestDto.AcceptTerms, registerRequestDto.AcknowledgePrivacy, registerRequestDto.TermsVersion, registerRequestDto.PrivacyVersion);
            ValidateAcademicProfile(registerRequestDto.Semester, registerRequestDto.Department);
            registerRequestDto.Email = NormalizeEmail(registerRequestDto.Email);
            registerRequestDto.Name = registerRequestDto.Name.Trim();
            registerRequestDto.Surname = registerRequestDto.Surname.Trim();

            //Check if UserExists 
            if (await _context.Users.AnyAsync(u => u.Email.ToLower() == registerRequestDto.Email))
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
                HasCompletedTest = false,
                AcceptedTermsVersion = LegalDocumentVersions.Terms,
                TermsAcceptedAt = DateTime.UtcNow,
                AcknowledgedPrivacyVersion = LegalDocumentVersions.Privacy,
                PrivacyAcknowledgedAt = DateTime.UtcNow
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
            EnsureLegalAcceptance(registerRequestDto.AcceptTerms, registerRequestDto.AcknowledgePrivacy, registerRequestDto.TermsVersion, registerRequestDto.PrivacyVersion);
            ValidateAcademicProfile(registerRequestDto.Semester, registerRequestDto.Department);
            registerRequestDto.Email = NormalizeEmail(registerRequestDto.Email);
            registerRequestDto.Name = registerRequestDto.Name.Trim();
            registerRequestDto.Surname = registerRequestDto.Surname.Trim();
            // Check if user exists
            if (await _context.Users.AnyAsync(u => u.Email.ToLower() == registerRequestDto.Email))
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
                AcceptedTermsVersion = LegalDocumentVersions.Terms,
                TermsAcceptedAt = DateTime.UtcNow,
                AcknowledgedPrivacyVersion = LegalDocumentVersions.Privacy,
                PrivacyAcknowledgedAt = DateTime.UtcNow,
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
                Token = null,
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
            var normalizedEmail = NormalizeEmail(loginRequestDto.Email);
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email.ToLower() == normalizedEmail);
            if (user == null || !_passHasher.VerifyPassword(loginRequestDto.Password, user.PasswordHash))
            {
                throw new Exception("Invalid email or password");
            }

            return await CreateAuthResponseAsync(user);
        }
        
        // Google
        
        public async Task<User?> FindByEmailAsync(string email)
        {
            var normalizedEmail = NormalizeEmail(email);
            return await _context.Users.FirstOrDefaultAsync(u => u.Email.ToLower() == normalizedEmail);
        }
        public string IssueGoogleNonce()
        {
            var nonce = Convert.ToHexString(RandomNumberGenerator.GetBytes(32)).ToLowerInvariant();
            var response = _httpContextAccessor.HttpContext?.Response;
            if (response == null) throw new InvalidOperationException("No HTTP response is available.");
            response.Cookies.Append(GoogleNonceCookieName, nonce, new CookieOptions
            {
                HttpOnly = true,
                Secure = true,
                SameSite = SameSiteMode.Lax,
                Path = "/api/auth",
                MaxAge = TimeSpan.FromMinutes(10),
                IsEssential = true
            });
            return nonce;
        }

        public bool ConsumeGoogleNonce(string requestedNonce)
        {
            var context = _httpContextAccessor.HttpContext;
            var storedNonce = context?.Request.Cookies[GoogleNonceCookieName];
            context?.Response.Cookies.Delete(GoogleNonceCookieName, new CookieOptions { Path = "/api/auth" });
            return NonceMatches(storedNonce, requestedNonce);
        }


        public async Task<GoogleJsonWebSignature.Payload> ValidateGoogleTokenAsync(string idToken, string nonce)
        {
            var clientId = _config["Google:ClientId"];
            if (string.IsNullOrEmpty(clientId))
                throw new InvalidOperationException("Google Client ID is not configured on the server.");

            var payload = await GoogleJsonWebSignature.ValidateAsync(idToken, new GoogleJsonWebSignature.ValidationSettings
            {
                Audience = new List<string> { clientId }
            });

            if (payload.EmailVerified != true || string.IsNullOrWhiteSpace(payload.Email) || string.IsNullOrWhiteSpace(payload.Subject))
                throw new InvalidGoogleIdentityException();

            if (!NonceMatches(payload.Nonce, nonce))
                throw new InvalidGoogleIdentityException();

            return payload;
        }

        public async Task<AuthResponseDto> HandleGoogleAuthAsync(
            string idToken,
            string nonce,
            bool allowRegistration,
            string? semester = null,
            string? department = null,
            string? major = null,
            string? minor = null,
            List<string>? enrolledCourses = null,
            RecommendationDto? recommendation = null,
            bool acceptTerms = false,
            bool acknowledgePrivacy = false,
            string? termsVersion = null,
            string? privacyVersion = null)
        {
            var payload = await ValidateGoogleTokenAsync(idToken, nonce);
            return await HandleVerifiedGoogleIdentityAsync(payload, allowRegistration, semester, department, major, minor, enrolledCourses, recommendation, acceptTerms, acknowledgePrivacy, termsVersion, privacyVersion);
        }

        public async Task<AuthResponseDto> HandleVerifiedGoogleIdentityAsync(
            GoogleJsonWebSignature.Payload payload,
            bool allowRegistration,
            string? semester = null,
            string? department = null,
            string? major = null,
            string? minor = null,
            List<string>? enrolledCourses = null,
            RecommendationDto? recommendation = null,
            bool acceptTerms = false,
            bool acknowledgePrivacy = false,
            string? termsVersion = null,
            string? privacyVersion = null)
        {
            if (payload.EmailVerified != true || string.IsNullOrWhiteSpace(payload.Email) || string.IsNullOrWhiteSpace(payload.Subject))
                throw new InvalidGoogleIdentityException();

            var normalizedEmail = NormalizeEmail(payload.Email);
            var user = await _context.Users.FirstOrDefaultAsync(u => u.GoogleSubject == payload.Subject);

            if (user == null)
            {
                var emailMatch = await _context.Users.FirstOrDefaultAsync(u => u.Email.ToLower() == normalizedEmail);
                if (emailMatch != null)
                {
                    if (!string.IsNullOrEmpty(emailMatch.GoogleSubject) || !emailMatch.PasswordHash.StartsWith("GOOGLE_USER_", StringComparison.Ordinal))
                        throw new GoogleAccountLinkRequiredException();

                    emailMatch.GoogleSubject = payload.Subject;
                    user = emailMatch;
                }
            }

            if (user == null && !allowRegistration)
                throw new GoogleAccountNotRegisteredException();

            if (user == null)
            {
                EnsureLegalAcceptance(acceptTerms, acknowledgePrivacy, termsVersion, privacyVersion);
                ValidateAcademicProfile(semester, department);
                var now = DateTime.UtcNow;
                user = new User
                {
                    Email = normalizedEmail,
                    GoogleSubject = payload.Subject,
                    FirstName = (payload.GivenName ?? "Student").Trim()[..Math.Min((payload.GivenName ?? "Student").Trim().Length, 50)],
                    LastName = (payload.FamilyName ?? "").Trim()[..Math.Min((payload.FamilyName ?? "").Trim().Length, 50)],
                    CreatedAt = now,
                    PasswordHash = "GOOGLE_USER_" + Guid.NewGuid().ToString("N"),
                    Semester = semester,
                    Department = department,
                    Major = major,
                    Minor = minor,
                    HasCompletedTest = recommendation != null,
                    AcceptedTermsVersion = LegalDocumentVersions.Terms,
                    TermsAcceptedAt = now,
                    AcknowledgedPrivacyVersion = LegalDocumentVersions.Privacy,
                    PrivacyAcknowledgedAt = now
                };

                if (enrolledCourses?.Any() == true && !string.IsNullOrEmpty(semester))
                    user.EnrolledCourses = new Dictionary<string, List<string>> { { semester, enrolledCourses.Distinct().Take(100).ToList() } };

                _context.Users.Add(user);
                if (recommendation != null)
                {
                    _context.UserRecommendation.Add(new UserRecommendation
                    {
                        UserId = user.Id,
                        PrimaryMajor = recommendation.PrimaryMajor,
                        SecondaryMajor = recommendation.SecondaryMajor,
                        PrimaryToolbox = recommendation.PrimaryToolbox,
                        SecondaryToolbox = recommendation.SecondaryToolbox,
                        ConfidenceLevel = recommendation.ConfidenceLevel,
                        ProfileType = recommendation.ProfileType,
                        Reasoning = recommendation.Reasoning,
                        CreatedAt = now
                    });
                }
            }
            else if (allowRegistration)
            {
                EnsureLegalAcceptance(acceptTerms, acknowledgePrivacy, termsVersion, privacyVersion);
                ValidateAcademicProfile(semester, department);
                user.AcceptedTermsVersion ??= LegalDocumentVersions.Terms;
                user.TermsAcceptedAt ??= DateTime.UtcNow;
                user.AcknowledgedPrivacyVersion ??= LegalDocumentVersions.Privacy;
                user.PrivacyAcknowledgedAt ??= DateTime.UtcNow;
            }

            if (user.GoogleSubject != payload.Subject)
                throw new InvalidGoogleIdentityException();

            if (allowRegistration)
            {
                if (!string.IsNullOrEmpty(semester)) user.Semester = semester;
                if (!string.IsNullOrEmpty(department)) user.Department = department;
                if (!string.IsNullOrEmpty(major)) user.Major = major;
                if (!string.IsNullOrEmpty(minor)) user.Minor = minor;
                if (recommendation != null) user.HasCompletedTest = true;
            }

            await _context.SaveChangesAsync();
            return await CreateAuthResponseAsync(user);
        }

        private static bool NonceMatches(string? tokenNonce, string requestedNonce)
        {
            if (string.IsNullOrWhiteSpace(tokenNonce) || string.IsNullOrWhiteSpace(requestedNonce)) return false;
            var left = Encoding.UTF8.GetBytes(tokenNonce);
            var right = Encoding.UTF8.GetBytes(requestedNonce);
            return left.Length == right.Length && CryptographicOperations.FixedTimeEquals(left, right);
        }

        private static void EnsureLegalAcceptance(bool acceptTerms, bool acknowledgePrivacy, string? termsVersion, string? privacyVersion)
        {
            if (!acceptTerms || !acknowledgePrivacy || termsVersion != LegalDocumentVersions.Terms || privacyVersion != LegalDocumentVersions.Privacy)
                throw new LegalAcceptanceRequiredException();
        }

        private static void ValidateAcademicProfile(string? semester, string? department)
        {
            var semesters = new HashSet<string> { "Α", "Γ", "Ε", "Ζ" };
            var departments = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
            {
                "Informatics", "Department of Informatics", "Tourism", "Translation",
                "Τμήμα Πληροφορικής", "Τμήμα Τουρισμού", "Τμήμα Ξένων Γλωσσών, Μετάφρασης και Διερμηνείας"
            };
            if (semester == null || !semesters.Contains(semester) || department == null || !departments.Contains(department))
                throw new InvalidAcademicProfileException();
        }


        //JWT SERVICE
        private string GenerateRefreshToken()
        {
            var randomBytes = new byte[64]; // 512-bit token
            using var rng = RandomNumberGenerator.Create();
            rng.GetBytes(randomBytes);
            return Convert.ToBase64String(randomBytes);
        }

        private static string NormalizeEmail(string email) => email.Trim().ToLowerInvariant();

        private static string HashRefreshToken(string token) =>
            Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(token)));


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
                new Claim("semester", user.Semester ?? ""),
                new Claim(ClaimTypes.Role, IsConfiguredAdmin(user.Email) ? "Admin" : "Student")

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

        private bool IsConfiguredAdmin(string email)
        {
            var configured = _config["Admin:Emails"] ?? "";
            return configured.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                .Any(item => string.Equals(item, email, StringComparison.OrdinalIgnoreCase));
        }


        public async Task<AuthResponseDto> RefreshTokenAsync(string refreshToken)
        {
            var hashedToken = HashRefreshToken(refreshToken);
            var storedToken = await _context.RefreshTokens
                .Include(rt => rt.User)
                .FirstOrDefaultAsync(rt => rt.Token == hashedToken || rt.Token == refreshToken);

            if (storedToken == null || !storedToken.IsActive)
                throw new Exception("Invalid or expired refresh token");

            // Revoke old refresh token
            storedToken.IsRevoked = true;
            
            // Create new auth state
            return await CreateAuthResponseAsync(storedToken.User);
        }

        public async Task RevokeRefreshTokenAsync(string refreshToken)
        {
            var hashedToken = HashRefreshToken(refreshToken);
            var storedToken = await _context.RefreshTokens
                .FirstOrDefaultAsync(rt => rt.Token == hashedToken || rt.Token == refreshToken);
            if (storedToken == null) return;
            storedToken.IsRevoked = true;
            await _context.SaveChangesAsync();
        }

        private async Task<AuthResponseDto> CreateAuthResponseAsync(User user)
        {
            var jwtToken = GenerateJwtToken(user);
            var rawRefreshToken = GenerateRefreshToken();
            var refreshToken = new RefreshToken
            {
                Token = HashRefreshToken(rawRefreshToken),
                UserId = user.Id,
                Expires = DateTime.UtcNow.AddDays(7)
            };

            _context.RefreshTokens.Add(refreshToken);
            await _context.SaveChangesAsync();

            SetAuthCookies(jwtToken, rawRefreshToken);

            return new AuthResponseDto
            {
                Token = null,
                RefreshToken = null,
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

        private void SetAuthCookies(string jwtToken, string refreshToken)
        {
            var response = _httpContextAccessor.HttpContext?.Response;
            if (response == null) return;

            const bool secure = true;
            response.Cookies.Append(AccessCookieName, jwtToken, new CookieOptions
            {
                HttpOnly = true,
                Secure = secure,
                SameSite = SameSiteMode.Lax,
                Path = "/api",
                Expires = DateTimeOffset.UtcNow.AddHours(_jwtSettings.ExpiryHours)
            });
            response.Cookies.Append(RefreshCookieName, refreshToken, new CookieOptions
            {
                HttpOnly = true,
                Secure = secure,
                SameSite = SameSiteMode.Lax,
                Path = "/api/auth",
                Expires = DateTimeOffset.UtcNow.AddDays(7)
            });
        }

        public void ClearAuthCookies()
        {
            var response = _httpContextAccessor.HttpContext?.Response;
            if (response == null) return;
            response.Cookies.Delete(AccessCookieName, new CookieOptions { Path = "/api" });
            response.Cookies.Delete(RefreshCookieName, new CookieOptions { Path = "/api/auth" });
            response.Cookies.Delete("jwt", new CookieOptions { Path = "/" });
            response.Cookies.Delete(GoogleNonceCookieName, new CookieOptions { Path = "/api/auth" });
        }



    }
}
