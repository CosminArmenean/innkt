using Microsoft.AspNetCore.Mvc;
using innkt.NeuroSpark.Services;
using innkt.NeuroSpark.Models;

namespace innkt.NeuroSpark.Controllers;

[ApiController]
[Route("api/[controller]")]
public class QrCodeController : ControllerBase
{
    private readonly IQrCodeService _qrCodeService;
    private readonly ILogger<QrCodeController> _logger;

    public QrCodeController(IQrCodeService qrCodeService, ILogger<QrCodeController> logger)
    {
        _qrCodeService = qrCodeService;
        _logger = logger;
    }

    /// <summary>
    /// Generate QR code for kid group pairing
    /// </summary>
    [HttpPost("generate")]
    public async Task<ActionResult<QrCodeResult>> GenerateQrCode([FromBody] QrCodeGenerationRequest request)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var result = await _qrCodeService.GenerateQrCodeAsync(request);
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating QR code");
            return StatusCode(500, "An error occurred while generating the QR code");
        }
    }

    /// <summary>
    /// Generate QR code for kid account pairing with parent
    /// </summary>
    [HttpPost("generate-kid-pairing")]
    public async Task<ActionResult<QrCodeResult>> GenerateKidPairingQrCode([FromBody] KidPairingQrRequest request)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var result = await _qrCodeService.GenerateKidPairingQrCodeAsync(request);
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating kid pairing QR code");
            return StatusCode(500, "An error occurred while generating the kid pairing QR code");
        }
    }

    /// <summary>
    /// Scan and validate QR code
    /// </summary>
    [HttpPost("scan")]
    public async Task<ActionResult<QrCodeScanResult>> ScanQrCode(IFormFile qrCodeImage)
    {
        try
        {
            if (qrCodeImage == null || qrCodeImage.Length == 0)
            {
                return BadRequest("No QR code image provided");
            }

            var result = await _qrCodeService.ScanQrCodeAsync(qrCodeImage);
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error scanning QR code");
            return StatusCode(500, "An error occurred while scanning the QR code");
        }
    }

    /// <summary>
    /// Validate QR code data without scanning image
    /// </summary>
    [HttpPost("validate")]
    public async Task<ActionResult<QrCodeValidationResult>> ValidateQrCode([FromBody] QrCodeValidationRequest request)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var result = await _qrCodeService.ValidateQrCodeAsync(request);
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error validating QR code");
            return StatusCode(500, "An error occurred while validating the QR code");
        }
    }
}



