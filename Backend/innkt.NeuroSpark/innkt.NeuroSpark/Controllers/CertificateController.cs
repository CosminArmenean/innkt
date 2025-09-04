using Microsoft.AspNetCore.Mvc;
using innkt.NeuroSpark.Services;
using System.Security.Cryptography.X509Certificates;

namespace innkt.NeuroSpark.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CertificateController : ControllerBase
{
    private readonly ICertificateService _certificateService;
    private readonly ILogger<CertificateController> _logger;

    public CertificateController(
        ICertificateService certificateService,
        ILogger<CertificateController> logger)
    {
        _certificateService = certificateService;
        _logger = logger;
    }

    /// <summary>
    /// Get information about the service's own certificate
    /// </summary>
    [HttpGet("service")]
    public async Task<IActionResult> GetServiceCertificateInfo()
    {
        try
        {
            var certificate = await _certificateService.GetServiceCertificateAsync();
            if (certificate == null)
            {
                return NotFound("Service certificate not found");
            }

            var info = await _certificateService.GetCertificateInfoAsync(certificate);
            return Ok(info);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting service certificate info");
            return StatusCode(500, "Internal server error");
        }
    }

    /// <summary>
    /// Get information about the Officer service's certificate
    /// </summary>
    [HttpGet("officer")]
    public async Task<IActionResult> GetOfficerCertificateInfo()
    {
        try
        {
            var certificate = await _certificateService.GetOfficerCertificateAsync();
            if (certificate == null)
            {
                return NotFound("Officer certificate not found");
            }

            var info = await _certificateService.GetCertificateInfoAsync(certificate);
            return Ok(info);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting Officer certificate info");
            return StatusCode(500, "Internal server error");
        }
    }

    /// <summary>
    /// Generate a new self-signed certificate for the service
    /// </summary>
    [HttpPost("generate")]
    public async Task<IActionResult> GenerateNewCertificate([FromBody] GenerateCertificateRequest request)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(request.SubjectName))
            {
                return BadRequest("Subject name is required");
            }

            var certificate = await _certificateService.GenerateSelfSignedCertificateAsync(
                request.SubjectName, 
                request.ValidityDays);

            var info = await _certificateService.GetCertificateInfoAsync(certificate);
            
            _logger.LogInformation("New certificate generated: {Thumbprint}", info.Thumbprint);
            
            return Ok(new
            {
                Message = "Certificate generated successfully",
                Certificate = info
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating new certificate");
            return StatusCode(500, "Internal server error");
        }
    }

    /// <summary>
    /// Validate a certificate
    /// </summary>
    [HttpPost("validate")]
    public async Task<IActionResult> ValidateCertificate([FromBody] ValidateCertificateRequest request)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(request.CertificateData))
            {
                return BadRequest("Certificate data is required");
            }

            // Convert base64 certificate data to X509Certificate2
            var certificateBytes = Convert.FromBase64String(request.CertificateData);
            var certificate = new X509Certificate2(certificateBytes);

            var isValid = await _certificateService.ValidateCertificateAsync(certificate);
            var info = await _certificateService.GetCertificateInfoAsync(certificate);

            return Ok(new
            {
                IsValid = isValid,
                Certificate = info,
                ValidationMessage = isValid ? "Certificate is valid" : "Certificate validation failed"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error validating certificate");
            return StatusCode(500, "Internal server error");
        }
    }

    /// <summary>
    /// Get certificate health status
    /// </summary>
    [HttpGet("health")]
    public async Task<IActionResult> GetCertificateHealth()
    {
        try
        {
            var serviceCert = await _certificateService.GetServiceCertificateAsync();
            var officerCert = await _certificateService.GetOfficerCertificateAsync();

            var serviceCertValid = serviceCert != null && 
                await _certificateService.ValidateCertificateAsync(serviceCert);
            
            var officerCertValid = officerCert != null && 
                await _certificateService.ValidateCertificateAsync(officerCert);

            var health = new
            {
                ServiceCertificate = new
                {
                    Exists = serviceCert != null,
                    IsValid = serviceCertValid,
                    ExpiresIn = serviceCert?.NotAfter - DateTime.UtcNow
                },
                OfficerCertificate = new
                {
                    Exists = officerCert != null,
                    IsValid = officerCertValid,
                    ExpiresIn = officerCert?.NotAfter - DateTime.UtcNow
                },
                OverallStatus = serviceCertValid && officerCertValid ? "Healthy" : "Unhealthy",
                LastChecked = DateTime.UtcNow
            };

            return Ok(health);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting certificate health");
            return StatusCode(500, "Internal server error");
        }
    }
}

public class GenerateCertificateRequest
{
    public string SubjectName { get; set; } = string.Empty;
    public int ValidityDays { get; set; } = 365;
}

public class ValidateCertificateRequest
{
    public string CertificateData { get; set; } = string.Empty; // Base64 encoded certificate
}


