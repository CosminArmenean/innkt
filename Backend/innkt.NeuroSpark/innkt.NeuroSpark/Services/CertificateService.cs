using System.Security.Cryptography;
using System.Security.Cryptography.X509Certificates;
using System.Text;

namespace innkt.NeuroSpark.Services;

public class CertificateService : ICertificateService
{
    private readonly ILogger<CertificateService> _logger;
    private readonly IConfiguration _configuration;
    private readonly IRedisService _redisService;
    private readonly string _certificatePath;
    private readonly string _officerCertificatePath;

    public CertificateService(
        ILogger<CertificateService> logger,
        IConfiguration configuration,
        IRedisService redisService)
    {
        _logger = logger;
        _configuration = configuration;
        _redisService = redisService;
        
        _certificatePath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "Certificates", "neurospark.pfx");
        _officerCertificatePath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "Certificates", "officer.cer");
    }

    public async Task<X509Certificate2?> GetServiceCertificateAsync()
    {
        try
        {
            // Check cache first
            var cacheKey = "service_certificate";
            var cachedCert = await _redisService.GetAsync<byte[]>(cacheKey);
            if (cachedCert != null)
            {
                return new X509Certificate2(cachedCert);
            }

            // Try to load from file
            if (File.Exists(_certificatePath))
            {
                var certificate = new X509Certificate2(_certificatePath);
                await _redisService.SetAsync(cacheKey, certificate.Export(X509ContentType.Pfx), TimeSpan.FromHours(1));
                return certificate;
            }

            // Generate self-signed certificate if none exists
            _logger.LogInformation("No service certificate found, generating self-signed certificate");
            var selfSignedCert = await GenerateSelfSignedCertificateAsync("CN=NeuroSpark Service");
            
            // Save to file
            Directory.CreateDirectory(Path.GetDirectoryName(_certificatePath)!);
            File.WriteAllBytes(_certificatePath, selfSignedCert.Export(X509ContentType.Pfx));
            
            // Cache the certificate
            await _redisService.SetAsync(cacheKey, selfSignedCert.Export(X509ContentType.Pfx), TimeSpan.FromHours(1));
            
            return selfSignedCert;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting service certificate");
            return null;
        }
    }

    public async Task<X509Certificate2?> GetOfficerCertificateAsync()
    {
        try
        {
            // Check cache first
            var cacheKey = "officer_certificate";
            var cachedCert = await _redisService.GetAsync<byte[]>(cacheKey);
            if (cachedCert != null)
            {
                return new X509Certificate2(cachedCert);
            }

            // Try to load from file
            if (File.Exists(_officerCertificatePath))
            {
                var certificate = new X509Certificate2(_officerCertificatePath);
                await _redisService.SetAsync(cacheKey, certificate.Export(X509ContentType.Cert), TimeSpan.FromHours(1));
                return certificate;
            }

            _logger.LogWarning("Officer certificate not found at {Path}", _officerCertificatePath);
            return null;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting Officer certificate");
            return null;
        }
    }

    public async Task<bool> ValidateCertificateAsync(X509Certificate2 certificate)
    {
        try
        {
            // Check if certificate is expired
            if (DateTime.UtcNow < certificate.NotBefore || DateTime.UtcNow > certificate.NotAfter)
            {
                _logger.LogWarning("Certificate is expired or not yet valid. Valid from {From} to {To}", 
                    certificate.NotBefore, certificate.NotAfter);
                return false;
            }

            // Validate certificate chain
            using var chain = new X509Chain();
            chain.Build(certificate);

            var isValid = chain.ChainStatus.All(status => status.Status == X509ChainStatusFlags.NoError);
            
            if (!isValid)
            {
                _logger.LogWarning("Certificate chain validation failed: {Statuses}", 
                    string.Join(", ", chain.ChainStatus.Select(s => s.Status)));
            }

            return isValid;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error validating certificate");
            return false;
        }
    }

    public async Task<X509Certificate2> GenerateSelfSignedCertificateAsync(string subjectName, int validityDays = 365)
    {
        try
        {
            _logger.LogInformation("Generating self-signed certificate for {Subject}", subjectName);

            using var rsa = RSA.Create(2048);
            var request = new CertificateRequest(
                subjectName,
                rsa,
                HashAlgorithmName.SHA256,
                RSASignaturePadding.Pkcs1);

            // Add key usage extensions
            request.CertificateExtensions.Add(
                new X509KeyUsageExtension(X509KeyUsageFlags.DigitalSignature | X509KeyUsageFlags.KeyEncipherment, false));

            // Add basic constraints
            request.CertificateExtensions.Add(
                new X509BasicConstraintsExtension(false, false, 0, false));

            var certificate = request.CreateSelfSigned(
                DateTimeOffset.UtcNow.AddDays(-1),
                DateTimeOffset.UtcNow.AddDays(validityDays));

            _logger.LogInformation("Self-signed certificate generated successfully with thumbprint {Thumbprint}", 
                certificate.Thumbprint);

            return certificate;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating self-signed certificate");
            throw;
        }
    }

    public async Task<CertificateInfo> GetCertificateInfoAsync(X509Certificate2 certificate)
    {
        try
        {
            var info = new CertificateInfo
            {
                Subject = certificate.Subject,
                Issuer = certificate.Issuer,
                ValidFrom = certificate.NotBefore,
                ValidTo = certificate.NotAfter,
                Thumbprint = certificate.Thumbprint,
                IsValid = DateTime.UtcNow >= certificate.NotBefore && DateTime.UtcNow <= certificate.NotAfter
            };

            // Extract key usages
            var keyUsageExtension = certificate.Extensions.OfType<X509KeyUsageExtension>().FirstOrDefault();
            if (keyUsageExtension != null)
            {
                info.KeyUsages = Enum.GetValues<X509KeyUsageFlags>()
                    .Where(flag => keyUsageExtension.KeyUsages.HasFlag(flag))
                    .Select(flag => flag.ToString())
                    .ToList();
            }

            // Extract extended key usages (simplified)
            info.ExtendedKeyUsages = new List<string> { "Server Authentication" };

            return info;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting certificate info");
            return new CertificateInfo();
        }
    }
}
