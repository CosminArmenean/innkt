using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;

namespace innkt.Social.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class GroupsController : ControllerBase
{
    private readonly ILogger<GroupsController> _logger;

    public GroupsController(ILogger<GroupsController> logger)
    {
        _logger = logger;
    }

    /// <summary>
    /// Get all groups
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<object>> GetGroups([FromQuery] int page = 1, [FromQuery] int limit = 20)
    {
        try
        {
            _logger.LogInformation("Fetching groups, page {Page}, limit {Limit}", page, limit);
            
            // For now, return mock data
            // In a real implementation, this would query the database
            var mockGroups = new[]
            {
                new { 
                    id = "group1", 
                    name = "Tech Enthusiasts", 
                    description = "A group for tech lovers.", 
                    memberCount = 150, 
                    isPublic = true, 
                    createdAt = DateTime.UtcNow.AddDays(-30) 
                },
                new { 
                    id = "group2", 
                    name = "Coding Challenges", 
                    description = "Solve coding problems together.", 
                    memberCount = 80, 
                    isPublic = true, 
                    createdAt = DateTime.UtcNow.AddDays(-20) 
                },
                new { 
                    id = "group3", 
                    name = "Local Community", 
                    description = "Connect with your local community.", 
                    memberCount = 200, 
                    isPublic = false, 
                    createdAt = DateTime.UtcNow.AddDays(-40) 
                }
            };

            return Ok(mockGroups.Take(limit));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching groups");
            return StatusCode(500, new { message = "Internal server error" });
        }
    }

    /// <summary>
    /// Get a specific group by ID
    /// </summary>
    [HttpGet("{id}")]
    public async Task<ActionResult<object>> GetGroup(string id)
    {
        try
        {
            _logger.LogInformation("Fetching group with ID {GroupId}", id);
            
            // For now, return mock data
            var mockGroup = new { 
                id = id, 
                name = $"Group {id}", 
                description = $"Description for group {id}.", 
                memberCount = 100, 
                isPublic = true, 
                createdAt = DateTime.UtcNow.AddDays(-50) 
            };

            return Ok(mockGroup);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching group {GroupId}", id);
            return StatusCode(500, new { message = "Internal server error" });
        }
    }
}
