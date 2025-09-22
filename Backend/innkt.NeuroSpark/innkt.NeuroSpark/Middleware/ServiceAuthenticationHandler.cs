using Microsoft.AspNetCore.Authentication;
using Microsoft.Extensions.Options;
using System.Security.Claims;
using System.Text.Encodings.Web;

namespace innkt.NeuroSpark.Middleware;

public class ServiceAuthenticationHandler : AuthenticationHandler<ServiceAuthenticationSchemeOptions>
{
    public ServiceAuthenticationHandler(IOptionsMonitor<ServiceAuthenticationSchemeOptions> options, 
        ILoggerFactory logger, UrlEncoder encoder) : base(options, logger, encoder)
    {
    }

    protected override Task<AuthenticateResult> HandleAuthenticateAsync()
    {
        // Check for service token in headers
        if (!Request.Headers.TryGetValue("X-Service-Token", out var tokenValues) ||
            !Request.Headers.TryGetValue("X-Service-Name", out var serviceNameValues))
        {
            return Task.FromResult(AuthenticateResult.Fail("Missing service authentication headers"));
        }

        var token = tokenValues.FirstOrDefault();
        var serviceName = serviceNameValues.FirstOrDefault();

        if (string.IsNullOrEmpty(token) || string.IsNullOrEmpty(serviceName))
        {
            return Task.FromResult(AuthenticateResult.Fail("Invalid service authentication headers"));
        }

        // Validate service token
        if (token != Options.ServiceToken)
        {
            return Task.FromResult(AuthenticateResult.Fail("Invalid service token"));
        }

        // Create service identity
        var claims = new[]
        {
            new Claim(ClaimTypes.Name, serviceName),
            new Claim(ClaimTypes.NameIdentifier, serviceName),
            new Claim("ServiceType", "Internal"),
            new Claim("ServiceToken", token)
        };

        var identity = new ClaimsIdentity(claims, Scheme.Name);
        var principal = new ClaimsPrincipal(identity);
        var ticket = new AuthenticationTicket(principal, Scheme.Name);

        return Task.FromResult(AuthenticateResult.Success(ticket));
    }
}
