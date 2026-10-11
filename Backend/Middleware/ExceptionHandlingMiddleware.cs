using System.Net;
using System.Text.Json;

namespace MyIonio.Middleware
{
    public class ExceptionHandlingMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly ILogger<ExceptionHandlingMiddleware> _logger;
        public ExceptionHandlingMiddleware(RequestDelegate next, ILogger<ExceptionHandlingMiddleware> logger) { _next = next; _logger = logger; }
        public async Task InvokeAsync(HttpContext context)
        {
            try { await _next(context); }
            catch (Exception ex)
            {
                var incidentId = context.TraceIdentifier;
                _logger.LogError(ex, "Unhandled exception. Incident {IncidentId}", incidentId);
                context.Response.ContentType = "application/json";
                context.Response.StatusCode = (int)HttpStatusCode.InternalServerError;
                context.Response.Headers.CacheControl = "no-store";
                await context.Response.WriteAsync(JsonSerializer.Serialize(new
                {
                    statusCode = context.Response.StatusCode,
                    message = "Unexpected server error.",
                    incidentId
                }));
            }
        }
    }
}
