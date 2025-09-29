using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using innkt.Groups.Services;
using innkt.Groups.DTOs;
using innkt.Groups.Middleware;
using System.Security.Claims;
using System.ComponentModel.DataAnnotations;

namespace innkt.Groups.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class PermissionTestController : ControllerBase
{
    private readonly IPermissionTestService _permissionTestService;
    private readonly ILogger<PermissionTestController> _logger;

    public PermissionTestController(IPermissionTestService permissionTestService, ILogger<PermissionTestController> logger)
    {
        _permissionTestService = permissionTestService;
        _logger = logger;
    }

    /// <summary>
    /// Test the permission system for a group
    /// </summary>
    [HttpPost("group/{groupId}")]
    [RequireRole("owner", "groupId")]
    public async Task<ActionResult<PermissionTestResult>> TestGroupPermissions(Guid groupId)
    {
        try
        {
            var result = await _permissionTestService.TestPermissionSystemAsync(groupId);
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error testing permissions for group {GroupId}", groupId);
            return StatusCode(500, "An error occurred while testing permissions");
        }
    }

    /// <summary>
    /// Test educational group specific permissions
    /// </summary>
    [HttpPost("educational/{groupId}")]
    [RequireRole("owner", "groupId")]
    public async Task<ActionResult<PermissionTestResult>> TestEducationalPermissions(Guid groupId)
    {
        try
        {
            var result = await _permissionTestService.TestEducationalGroupPermissionsAsync(groupId);
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error testing educational permissions for group {GroupId}", groupId);
            return StatusCode(500, "An error occurred while testing educational permissions");
        }
    }

    /// <summary>
    /// Test family group specific permissions
    /// </summary>
    [HttpPost("family/{groupId}")]
    [RequireRole("owner", "groupId")]
    public async Task<ActionResult<PermissionTestResult>> TestFamilyPermissions(Guid groupId)
    {
        try
        {
            var result = await _permissionTestService.TestFamilyGroupPermissionsAsync(groupId);
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error testing family permissions for group {GroupId}", groupId);
            return StatusCode(500, "An error occurred while testing family permissions");
        }
    }

    /// <summary>
    /// Test role-based permissions
    /// </summary>
    [HttpPost("roles/{groupId}")]
    [RequireRole("owner", "groupId")]
    public async Task<ActionResult<PermissionTestResult>> TestRolePermissions(Guid groupId)
    {
        try
        {
            var result = await _permissionTestService.TestRoleBasedPermissionsAsync(groupId);
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error testing role permissions for group {GroupId}", groupId);
            return StatusCode(500, "An error occurred while testing role permissions");
        }
    }

    /// <summary>
    /// Test parent-kid relationship permissions
    /// </summary>
    [HttpPost("parent-kid/{groupId}")]
    [RequireRole("owner", "groupId")]
    public async Task<ActionResult<PermissionTestResult>> TestParentKidPermissions(Guid groupId)
    {
        try
        {
            var result = await _permissionTestService.TestParentKidPermissionsAsync(groupId);
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error testing parent-kid permissions for group {GroupId}", groupId);
            return StatusCode(500, "An error occurred while testing parent-kid permissions");
        }
    }

    /// <summary>
    /// Run comprehensive permission tests for a group
    /// </summary>
    [HttpPost("comprehensive/{groupId}")]
    [RequireRole("owner", "groupId")]
    public async Task<ActionResult<ComprehensivePermissionTestResult>> RunComprehensiveTests(Guid groupId)
    {
        try
        {
            var result = new ComprehensivePermissionTestResult
            {
                GroupId = groupId,
                TestedAt = DateTime.UtcNow,
                Results = new List<PermissionTestResult>()
            };

            // Run all tests
            result.Results.Add(await _permissionTestService.TestPermissionSystemAsync(groupId));
            result.Results.Add(await _permissionTestService.TestEducationalGroupPermissionsAsync(groupId));
            result.Results.Add(await _permissionTestService.TestFamilyGroupPermissionsAsync(groupId));
            result.Results.Add(await _permissionTestService.TestRoleBasedPermissionsAsync(groupId));
            result.Results.Add(await _permissionTestService.TestParentKidPermissionsAsync(groupId));

            result.OverallPassed = result.Results.All(r => r.OverallPassed);
            result.TotalTests = result.Results.Sum(r => r.Tests.Count);
            result.PassedTests = result.Results.Sum(r => r.Tests.Count(t => t.Passed));
            result.FailedTests = result.TotalTests - result.PassedTests;

            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error running comprehensive permission tests for group {GroupId}", groupId);
            return StatusCode(500, "An error occurred while running comprehensive permission tests");
        }
    }
}

public class ComprehensivePermissionTestResult
{
    public Guid GroupId { get; set; }
    public DateTime TestedAt { get; set; }
    public List<PermissionTestResult> Results { get; set; } = new();
    public bool OverallPassed { get; set; }
    public int TotalTests { get; set; }
    public int PassedTests { get; set; }
    public int FailedTests { get; set; }
    public double SuccessRate => TotalTests > 0 ? (double)PassedTests / TotalTests * 100 : 0;
}
