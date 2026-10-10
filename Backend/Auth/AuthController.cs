using MyIonio.DTOs;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using Microsoft.AspNetCore.RateLimiting;

namespace MyIonio.Controllers
{
    [Route("api/auth")]
    [ApiController]
    [ResponseCache(NoStore = true, Location = ResponseCacheLocation.None)]
    public class AuthController : ControllerBase
    {
        private readonly AuthService _authService;
        private readonly IConfiguration _config;

        public AuthController(AuthService authService, IConfiguration config)
        {
            _authService = authService;
            _config = config;
        }

        [HttpPost("register")]
        [EnableRateLimiting("Signup")]
        public async Task<IActionResult> Register([FromBody] RegisterRequestDto dto)
        {
            if (dto == null)
                return BadRequest("Request data missing.");

            try
            {
                var result = await _authService.AuthRegisterAsync(dto);
                return Ok(result);
            }
            catch (Exception ex)
            {
                if (ex.Message.Contains("exists"))
                    return Conflict(new { message = ex.Message });
                
                return StatusCode(500, new { message = "Registration failed due to a server error." });
            }
        }

        [HttpPost("register-with-test")]
        [EnableRateLimiting("Signup")]
        public async Task<IActionResult> RegisterWithTest([FromBody] RegisterWithTestDto dto)
        {
            try
            {
                if (dto == null || dto.UserData == null || dto.Recommendation == null)
                    return BadRequest("Invalid signup-with-test data.");

                var result = await _authService.AuthRegisterWithTestAsync(
    dto.UserData,
    dto.Recommendation,
    dto.UserAnswers
);


                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }
        [HttpPost("login")]
        [EnableRateLimiting("Login")]
        public async Task<IActionResult> Login([FromBody] LoginRequestDto dto)
        {
            if (dto == null)
                return BadRequest("Request data missing.");

            try
            {
                var result = await _authService.AuthLoginAsync(dto);
                return Ok(result);
            }
            catch (Exception ex) when (ex.Message.Contains("Invalid"))
            {
                return Unauthorized(new { message = "Invalid credentials." });
            }
            catch (Exception)
            {
                return StatusCode(500, new { message = "Login failed due to a server error." });
            }
        }

        [HttpPost("refresh-token")]
        public async Task<IActionResult> RefreshToken([FromBody] RefreshRequestDto? dto)
        {
            var refreshToken = Request.Cookies[AuthService.RefreshCookieName] ?? dto?.RefreshToken;
            if (string.IsNullOrWhiteSpace(refreshToken))
                return BadRequest("Refresh token missing.");

            try
            {
                var result = await _authService.RefreshTokenAsync(refreshToken);
                return Ok(result);
            }
            catch
            {
                _authService.ClearAuthCookies();
                return Unauthorized(new { message = "Session expired. Please sign in again." });
            }
        }

        [HttpPost("logout")]
        public async Task<IActionResult> Logout()
        {
            var refreshToken = Request.Cookies[AuthService.RefreshCookieName];
            if (!string.IsNullOrWhiteSpace(refreshToken))
                await _authService.RevokeRefreshTokenAsync(refreshToken);
            _authService.ClearAuthCookies();
            return NoContent();
        }
        [HttpPost("google-login")]
        [EnableRateLimiting("Login")]
        public async Task<IActionResult> GoogleLogin([FromBody] GoogleLoginDto dto)
        {
            try
            {
                var result = await _authService.HandleGoogleAuthAsync(
                    dto.IdToken, 
                    dto.Semester, 
                    dto.Department, 
                    dto.Major, 
                    dto.Minor, 
                    dto.EnrolledCourses);
                return Ok(result);
            }
            catch (Google.Apis.Auth.InvalidJwtException)
            {
                return Unauthorized(new { message = "Invalid Google Token." });
            }
            catch (Exception)
            {
                return StatusCode(500, new { message = "Google authentication failed." });
            }
        }
        
        [HttpPost("google-register")]
        [EnableRateLimiting("Signup")]
        public async Task<ActionResult<AuthResponseDto>> GoogleRegister([FromBody] RegisterGoogleRequestDto dto)
        {
            try
            {
                var result = await _authService.HandleGoogleAuthAsync(
                    dto.IdToken, 
                    dto.Semester, 
                    dto.Department, 
                    null, 
                    null, 
                    null, 
                    dto.Recommendation);
                return Ok(result);
            }
            catch (Exception)
            {
                return BadRequest(new { message = "Google registration failed." });
            }
        }


        [HttpGet("me")]
        [Authorize]
        public IActionResult Me()
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var email = User.FindFirst(ClaimTypes.Email)?.Value;
            var name = User.FindFirst(ClaimTypes.Name)?.Value;
            var semester = User.FindFirst("semester")?.Value;

            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            return Ok(new 
            { 
                UserId = userId,
                Email = email,
                FirstName = name,
                Semester = semester
            });
        }
    }
}
