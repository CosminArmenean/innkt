using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using innkt.Kinder.Services;
using innkt.Kinder.Models;

namespace innkt.Kinder.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class KidSafetyController : ControllerBase
{
    private readonly IKidSafetyService _kidSafetyService;
    private readonly ILogger<KidSafetyController> _logger;

    public KidSafetyController(IKidSafetyService kidSafetyService, ILogger<KidSafetyController> logger)
    {
        _kidSafetyService = kidSafetyService;
        _logger = logger;
    }

    [HttpGet("test")]
    [AllowAnonymous]
    public ActionResult<object> Test()
    {
        return Ok(new { 
            service = "Kinder", 
            status = "operational", 
            timestamp = DateTime.UtcNow,
            message = "🛡️ Child protection service ready!",
            port = 5004
        });
    }

    [HttpPost("kid-accounts")]
    public async Task<ActionResult<KidAccount>> CreateKidAccount([FromBody] CreateKidAccountRequest request)
    {
        try
        {
            var parentId = Guid.NewGuid(); // TODO: Get from JWT token
            var kidAccount = await _kidSafetyService.CreateKidAccountAsync(parentId, request.UserId, request.Age);
            return Ok(kidAccount);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating kid account");
            return StatusCode(500, "Error creating kid account");
        }
    }
}

public class CreateKidAccountRequest
{
    public Guid UserId { get; set; }
    public int Age { get; set; }
}

