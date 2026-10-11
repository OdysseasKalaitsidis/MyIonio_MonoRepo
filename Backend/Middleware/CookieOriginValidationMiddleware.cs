namespace MyIonio.Middleware
{
    public sealed class CookieOriginValidationMiddleware
    {
        private static readonly HashSet<string> SafeMethods = new(StringComparer.OrdinalIgnoreCase) { "GET", "HEAD", "OPTIONS", "TRACE" };
        private readonly RequestDelegate _next;
        private readonly HashSet<string> _allowedOrigins;

        public CookieOriginValidationMiddleware(RequestDelegate next, IConfiguration configuration)
        {
            _next = next;
            _allowedOrigins = (configuration["AllowedOrigins"] ?? "https://myionio.site,http://localhost:5173,http://localhost:8080")
                .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                .Select(origin => origin.TrimEnd('/'))
                .ToHashSet(StringComparer.OrdinalIgnoreCase);
        }

        public async Task InvokeAsync(HttpContext context)
        {
            var hasAuthCookie = context.Request.Cookies.ContainsKey(AuthService.AccessCookieName)
                || context.Request.Cookies.ContainsKey(AuthService.RefreshCookieName);
            if (hasAuthCookie && !SafeMethods.Contains(context.Request.Method))
            {
                var origin = context.Request.Headers.Origin.ToString().TrimEnd('/');
                var fetchSite = context.Request.Headers["Sec-Fetch-Site"].ToString();
                if ((string.IsNullOrEmpty(origin) || !_allowedOrigins.Contains(origin))
                    || string.Equals(fetchSite, "cross-site", StringComparison.OrdinalIgnoreCase))
                {
                    context.Response.StatusCode = StatusCodes.Status403Forbidden;
                    await context.Response.WriteAsJsonAsync(new { message = "Cross-site request blocked." });
                    return;
                }
            }
            await _next(context);
        }
    }
}
