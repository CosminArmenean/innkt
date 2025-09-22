namespace innkt.NeuroSpark.Middleware;

public class ServiceAuthenticationSchemeOptions : Microsoft.AspNetCore.Authentication.AuthenticationSchemeOptions
{
    public string ServiceToken { get; set; } = string.Empty;
}
