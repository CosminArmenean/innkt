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
public class PollsController : ControllerBase
{
    private readonly IGroupService _groupService;
    private readonly ILogger<PollsController> _logger;

    public PollsController(IGroupService groupService, ILogger<PollsController> logger)
    {
        _groupService = groupService;
        _logger = logger;
    }

    /// <summary>
    /// Get polls for a specific group
    /// </summary>
    [HttpGet("group/{groupId}")]
    public async Task<ActionResult<object>> GetGroupPolls(Guid groupId, [FromQuery] Guid? topicId = null, [FromQuery] bool? isActive = null)
    {
        try
        {
            var userId = GetCurrentUserId();
            var polls = await _groupService.GetGroupPollsAsync(groupId, userId, topicId, isActive);
            return Ok(polls);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting polls for group {GroupId}", groupId);
            return StatusCode(500, "An error occurred while getting group polls");
        }
    }

    /// <summary>
    /// Get a specific poll
    /// </summary>
    [HttpGet("{pollId}")]
    public async Task<ActionResult<object>> GetPoll(Guid pollId)
    {
        try
        {
            var userId = GetCurrentUserId();
            var poll = await _groupService.GetPollByIdAsync(pollId, userId);
            if (poll == null)
                return NotFound("Poll not found");
            
            return Ok(poll);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting poll {PollId}", pollId);
            return StatusCode(500, "An error occurred while getting the poll");
        }
    }

    /// <summary>
    /// Create a new poll
    /// </summary>
    [HttpPost]
    [RequirePermission("create_poll")]
    public async Task<ActionResult<object>> CreatePoll([FromBody] CreatePollRequest request)
    {
        try
        {
            var userId = GetCurrentUserId();
            var poll = await _groupService.CreatePollAsync(userId, request);
            return CreatedAtAction(nameof(GetPoll), new { pollId = poll.Id }, poll);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating poll for user {UserId}", GetCurrentUserId());
            return StatusCode(500, "An error occurred while creating the poll");
        }
    }

    /// <summary>
    /// Vote on a poll
    /// </summary>
    [HttpPost("{pollId}/vote")]
    public async Task<ActionResult> VoteOnPoll(Guid pollId, [FromBody] VotePollRequest request)
    {
        try
        {
            var userId = GetCurrentUserId();
            var result = await _groupService.VotePollAsync(pollId, userId, request);
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error voting on poll {PollId} for user {UserId}", pollId, GetCurrentUserId());
            return StatusCode(500, "An error occurred while voting on the poll");
        }
    }

    private Guid GetCurrentUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
        {
            throw new UnauthorizedAccessException("Invalid user ID");
        }
        return userId;
    }
}