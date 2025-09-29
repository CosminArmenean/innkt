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
    /// Create a new poll
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<PollResponse>> CreatePoll([FromBody] CreatePollRequest request)
    {
        try
        {
            var userId = GetCurrentUserId();
            var poll = await _groupService.CreatePollAsync(userId, request);
            return CreatedAtAction(nameof(GetPoll), new { id = poll.Id }, poll);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating poll for user {UserId}", GetCurrentUserId());
            return StatusCode(500, "An error occurred while creating the poll");
        }
    }

    /// <summary>
    /// Get a specific poll by ID
    /// </summary>
    [HttpGet("{id}")]
    public async Task<ActionResult<PollResponse>> GetPoll(Guid id)
    {
        try
        {
            var userId = GetCurrentUserId();
            var poll = await _groupService.GetPollByIdAsync(id, userId);
            
            if (poll == null)
                return NotFound("Poll not found");
                
            return Ok(poll);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting poll {PollId}", id);
            return StatusCode(500, "An error occurred while retrieving the poll");
        }
    }

    /// <summary>
    /// Get polls for a group
    /// </summary>
    [HttpGet("group/{groupId}")]
    public async Task<ActionResult<List<PollResponse>>> GetGroupPolls(
        Guid groupId,
        [FromQuery] Guid? topicId = null,
        [FromQuery] bool? isActive = null)
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
            return StatusCode(500, "An error occurred while retrieving polls");
        }
    }

    /// <summary>
    /// Vote on a poll
    /// </summary>
    [HttpPost("{id}/vote")]
    public async Task<ActionResult<PollResponse>> VotePoll(Guid id, [FromBody] VotePollRequest request)
    {
        try
        {
            var userId = GetCurrentUserId();
            var poll = await _groupService.VotePollAsync(id, userId, request);
            return Ok(poll);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ex.Message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error voting on poll {PollId}", id);
            return StatusCode(500, "An error occurred while voting on the poll");
        }
    }

    /// <summary>
    /// Get poll results
    /// </summary>
    [HttpGet("{id}/results")]
    public async Task<ActionResult<PollResultsResponse>> GetPollResults(Guid id)
    {
        try
        {
            var userId = GetCurrentUserId();
            var results = await _groupService.GetPollResultsAsync(id, userId);
            return Ok(results);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting poll results {PollId}", id);
            return StatusCode(500, "An error occurred while retrieving poll results");
        }
    }

    /// <summary>
    /// Update poll settings
    /// </summary>
    [HttpPut("{id}")]
    public async Task<ActionResult<PollResponse>> UpdatePoll(Guid id, [FromBody] UpdatePollRequest request)
    {
        try
        {
            var userId = GetCurrentUserId();
            var poll = await _groupService.UpdatePollAsync(id, userId, request);
            return Ok(poll);
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid("You don't have permission to update this poll");
        }
        catch (KeyNotFoundException)
        {
            return NotFound("Poll not found");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating poll {PollId}", id);
            return StatusCode(500, "An error occurred while updating the poll");
        }
    }

    /// <summary>
    /// Delete a poll
    /// </summary>
    [HttpDelete("{id}")]
    public async Task<ActionResult> DeletePoll(Guid id)
    {
        try
        {
            var userId = GetCurrentUserId();
            var success = await _groupService.DeletePollAsync(id, userId);
            
            if (!success)
                return NotFound("Poll not found");
                
            return NoContent();
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid("You don't have permission to delete this poll");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting poll {PollId}", id);
            return StatusCode(500, "An error occurred while deleting the poll");
        }
    }

    /// <summary>
    /// Get user's vote for a poll
    /// </summary>
    [HttpGet("{id}/my-vote")]
    public async Task<ActionResult<PollVoteResponse>> GetMyVote(Guid id)
    {
        try
        {
            var userId = GetCurrentUserId();
            var vote = await _groupService.GetUserVoteAsync(id, userId);
            return Ok(vote);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting user vote for poll {PollId}", id);
            return StatusCode(500, "An error occurred while retrieving user vote");
        }
    }

    private Guid GetCurrentUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
        {
            throw new UnauthorizedAccessException("Invalid user ID in token");
        }
        return userId;
    }
}

