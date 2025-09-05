using innkt.NeuroSpark.Models;

namespace innkt.NeuroSpark.Services;

public interface IServiceAuthService
{
    Task<ServiceAuthResult> AuthenticateServiceAsync(string serviceToken);
    Task<ServiceAuthResult> ValidateUserTokenAsync(string userToken);
    Task<bool> IsUserAuthorizedAsync(string userId, string operation);
    Task<ServiceAuthResult> GetServiceCredentialsAsync();
    Task<bool> ValidateServiceSignatureAsync(string payload, string signature);
    Task<string> GenerateServiceTokenAsync();
}

public class ServiceAuthResult
{
    public bool IsAuthenticated { get; set; }
    public string ServiceId { get; set; } = string.Empty;
    public string UserId { get; set; } = string.Empty;
    public List<string> Permissions { get; set; } = new();
    public DateTime ExpiresAt { get; set; }
    public string ErrorMessage { get; set; } = string.Empty;
}

public class ServiceCredentials
{
    public string ServiceId { get; set; } = string.Empty;
    public string SecretKey { get; set; } = string.Empty;
    public string Issuer { get; set; } = string.Empty;
    public DateTime ValidFrom { get; set; }
    public DateTime ValidTo { get; set; }
}



