using System.Security.Cryptography.X509Certificates;

namespace innkt.NeuroSpark.Services;

public interface ICertificateService
{
    /// <summary>
    /// Gets the service's own certificate for client authentication
    /// </summary>
    Task<X509Certificate2?> GetServiceCertificateAsync();
    
    /// <summary>
    /// Gets the Officer service's certificate for validation
    /// </summary>
    Task<X509Certificate2?> GetOfficerCertificateAsync();
    
    /// <summary>
    /// Validates a certificate chain
    /// </summary>
    Task<bool> ValidateCertificateAsync(X509Certificate2 certificate);
    
    /// <summary>
    /// Generates a self-signed certificate for development/testing
    /// </summary>
    Task<X509Certificate2> GenerateSelfSignedCertificateAsync(string subjectName, int validityDays = 365);
    
    /// <summary>
    /// Gets certificate information for monitoring
    /// </summary>
    Task<CertificateInfo> GetCertificateInfoAsync(X509Certificate2 certificate);
}

public class CertificateInfo
{
    public string Subject { get; set; } = string.Empty;
    public string Issuer { get; set; } = string.Empty;
    public DateTime ValidFrom { get; set; }
    public DateTime ValidTo { get; set; }
    public string Thumbprint { get; set; } = string.Empty;
    public bool IsValid { get; set; }
    public List<string> KeyUsages { get; set; } = new();
    public List<string> ExtendedKeyUsages { get; set; } = new();
}


