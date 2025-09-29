using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using innkt.Groups.Services;
using innkt.Groups.DTOs;
using innkt.Groups.Middleware;
using System.Security.Claims;

namespace innkt.Groups.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ParentKidTestController : ControllerBase
{
    private readonly IParentKidTestService _parentKidTestService;
    private readonly ILogger<ParentKidTestController> _logger;

    public ParentKidTestController(IParentKidTestService parentKidTestService, ILogger<ParentKidTestController> logger)
    {
        _parentKidTestService = parentKidTestService;
        _logger = logger;
    }

    /// <summary>
    /// Test the parent-kid system for a group
    /// </summary>
    [HttpPost("group/{groupId}")]
    [RequireRole("owner", "groupId")]
    public async Task<ActionResult<ParentKidTestResult>> TestParentKidSystem(Guid groupId)
    {
        try
        {
            var result = await _parentKidTestService.TestParentKidSystemAsync(groupId);
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error testing parent-kid system for group {GroupId}", groupId);
            return StatusCode(500, "An error occurred while testing the parent-kid system");
        }
    }

    /// <summary>
    /// Test parent-kid relationships
    /// </summary>
    [HttpPost("relationships/{groupId}")]
    [RequireRole("owner", "groupId")]
    public async Task<ActionResult<ParentKidTestResult>> TestParentKidRelationships(Guid groupId)
    {
        try
        {
            var result = await _parentKidTestService.TestParentKidRelationshipsAsync(groupId);
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error testing parent-kid relationships for group {GroupId}", groupId);
            return StatusCode(500, "An error occurred while testing parent-kid relationships");
        }
    }

    /// <summary>
    /// Test parent acting for kid
    /// </summary>
    [HttpPost("parent-acting/{groupId}")]
    [RequireRole("owner", "groupId")]
    public async Task<ActionResult<ParentKidTestResult>> TestParentActingForKid(Guid groupId)
    {
        try
        {
            var result = await _parentKidTestService.TestParentActingForKidAsync(groupId);
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error testing parent acting for kid for group {GroupId}", groupId);
            return StatusCode(500, "An error occurred while testing parent acting for kid");
        }
    }

    /// <summary>
    /// Test educational group features
    /// </summary>
    [HttpPost("educational/{groupId}")]
    [RequireRole("owner", "groupId")]
    public async Task<ActionResult<ParentKidTestResult>> TestEducationalGroupFeatures(Guid groupId)
    {
        try
        {
            var result = await _parentKidTestService.TestEducationalGroupFeaturesAsync(groupId);
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error testing educational group features for group {GroupId}", groupId);
            return StatusCode(500, "An error occurred while testing educational group features");
        }
    }

    /// <summary>
    /// Test visual indicators
    /// </summary>
    [HttpPost("visuals/{groupId}")]
    [RequireRole("owner", "groupId")]
    public async Task<ActionResult<ParentKidTestResult>> TestVisualIndicators(Guid groupId)
    {
        try
        {
            var result = await _parentKidTestService.TestVisualIndicatorsAsync(groupId);
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error testing visual indicators for group {GroupId}", groupId);
            return StatusCode(500, "An error occurred while testing visual indicators");
        }
    }

    /// <summary>
    /// Test permission matrix
    /// </summary>
    [HttpPost("permissions/{groupId}")]
    [RequireRole("owner", "groupId")]
    public async Task<ActionResult<ParentKidTestResult>> TestPermissionMatrix(Guid groupId)
    {
        try
        {
            var result = await _parentKidTestService.TestPermissionMatrixAsync(groupId);
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error testing permission matrix for group {GroupId}", groupId);
            return StatusCode(500, "An error occurred while testing permission matrix");
        }
    }

    /// <summary>
    /// Run comprehensive parent-kid tests for a group
    /// </summary>
    [HttpPost("comprehensive/{groupId}")]
    [RequireRole("owner", "groupId")]
    public async Task<ActionResult<ComprehensiveParentKidTestResult>> RunComprehensiveTests(Guid groupId)
    {
        try
        {
            var result = new ComprehensiveParentKidTestResult
            {
                GroupId = groupId,
                TestedAt = DateTime.UtcNow,
                Results = new List<ParentKidTestResult>()
            };

            // Run all tests
            result.Results.Add(await _parentKidTestService.TestParentKidSystemAsync(groupId));
            result.Results.Add(await _parentKidTestService.TestParentKidRelationshipsAsync(groupId));
            result.Results.Add(await _parentKidTestService.TestParentActingForKidAsync(groupId));
            result.Results.Add(await _parentKidTestService.TestEducationalGroupFeaturesAsync(groupId));
            result.Results.Add(await _parentKidTestService.TestVisualIndicatorsAsync(groupId));
            result.Results.Add(await _parentKidTestService.TestPermissionMatrixAsync(groupId));

            result.OverallPassed = result.Results.All(r => r.OverallPassed);
            result.TotalTests = result.Results.Sum(r => r.Tests.Count);
            result.PassedTests = result.Results.Sum(r => r.Tests.Count(t => t.Passed));
            result.FailedTests = result.TotalTests - result.PassedTests;

            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error running comprehensive parent-kid tests for group {GroupId}", groupId);
            return StatusCode(500, "An error occurred while running comprehensive parent-kid tests");
        }
    }
}

public class ComprehensiveParentKidTestResult
{
    public Guid GroupId { get; set; }
    public DateTime TestedAt { get; set; }
    public List<ParentKidTestResult> Results { get; set; } = new();
    public bool OverallPassed { get; set; }
    public int TotalTests { get; set; }
    public int PassedTests { get; set; }
    public int FailedTests { get; set; }
    public double SuccessRate => TotalTests > 0 ? (double)PassedTests / TotalTests * 100 : 0;
}
