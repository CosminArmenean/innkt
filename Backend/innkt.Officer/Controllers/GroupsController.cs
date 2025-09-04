using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using innkt.Officer.Data;
using innkt.Officer.Models;
using innkt.StringLibrary.Services;
using innkt.StringLibrary.Constants;
using System.Security.Claims;
using System.ComponentModel.DataAnnotations;

namespace innkt.Officer.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class GroupsController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly ILocalizationService _localization;

    public GroupsController(ApplicationDbContext context, ILocalizationService localization)
    {
        _context = context;
        _localization = localization;
    }

    [HttpPost]
    public async Task<ActionResult<Group>> CreateGroup([FromBody] CreateGroupDto request)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
            {
                var authMessage = await _localization.GetStringAsync(AppStrings.Auth.UserNotAuthenticated);
                return Unauthorized(authMessage);
            }

            var group = new Group
            {
                Name = request.Name,
                Description = request.Description,
                Type = request.Type,
                Privacy = request.Privacy,
                OwnerId = userId
            };

            _context.Groups.Add(group);
            await _context.SaveChangesAsync();

            // Add owner as admin member
            var ownerMember = new GroupMember
            {
                GroupId = group.Id,
                UserId = userId,
                Role = GroupMemberRole.Owner,
                Status = GroupMemberStatus.Active
            };

            _context.GroupMembers.Add(ownerMember);
            await _context.SaveChangesAsync();

            var successMessage = await _localization.GetStringAsync(AppStrings.Groups.CreationSuccess);
            return CreatedAtAction(nameof(GetGroup), new { id = group.Id }, new { group, message = successMessage });
        }
        catch (Exception ex)
        {
            var errorMessage = await _localization.GetStringAsync(AppStrings.Groups.CreationFailed);
            return StatusCode(500, new { message = errorMessage, error = ex.Message });
        }
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<Group>> GetGroup(string id)
    {
        try
        {
            var group = await _context.Groups
                .Include(g => g.Owner)
                .Include(g => g.Members)
                .ThenInclude(m => m.User)
                .FirstOrDefaultAsync(g => g.Id == id && g.IsActive);

            if (group == null)
            {
                var notFoundMessage = await _localization.GetStringAsync(AppStrings.Groups.NotFound);
                return NotFound(new { message = notFoundMessage });
            }

            // Check if user has access to the group
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var isMember = await _context.GroupMembers
                .AnyAsync(m => m.GroupId == id && m.UserId == userId && m.Status == GroupMemberStatus.Active);

            if (group.Privacy == GroupPrivacy.Private && !isMember && group.OwnerId != userId)
            {
                var accessDeniedMessage = await _localization.GetStringAsync(AppStrings.Groups.AccessDenied);
                return Forbid();
            }

            return Ok(group);
        }
        catch (Exception ex)
        {
            var errorMessage = await _localization.GetStringAsync(AppStrings.General.ServerError);
            return StatusCode(500, new { message = errorMessage, error = ex.Message });
        }
    }

    [HttpGet]
    public async Task<ActionResult<List<Group>>> GetGroups([FromQuery] GroupType? type = null, [FromQuery] GroupPrivacy? privacy = null)
    {
        try
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var query = _context.Groups
                .Include(g => g.Owner)
                .Where(g => g.IsActive);

            if (type.HasValue)
                query = query.Where(g => g.Type == type.Value);

            if (privacy.HasValue)
                query = query.Where(g => g.Privacy == privacy.Value);

            // For private groups, only show if user is a member
            var privateGroups = await _context.GroupMembers
                .Where(m => m.UserId == userId && m.Status == GroupMemberStatus.Active)
                .Select(m => m.GroupId)
                .ToListAsync();

            query = query.Where(g => g.Privacy == GroupPrivacy.Public || 
                                   g.OwnerId == userId || 
                                   privateGroups.Contains(g.Id));

            var groups = await query
                .OrderByDescending(g => g.CreatedAt)
                .Take(50)
                .ToListAsync();

            return Ok(groups);
        }
        catch (Exception ex)
        {
            var errorMessage = await _localization.GetStringAsync(AppStrings.General.ServerError);
            return StatusCode(500, new { message = errorMessage, error = ex.Message });
        }
    }

    [HttpPost("{groupId}/members")]
    public async Task<ActionResult> AddMember(string groupId, [FromBody] AddMemberDto request)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
            {
                var authMessage = await _localization.GetStringAsync(AppStrings.Auth.UserNotAuthenticated);
                return Unauthorized(authMessage);
            }

            // Check if user is admin or owner of the group
            var userRole = await _context.GroupMembers
                .Where(m => m.GroupId == groupId && m.UserId == userId && m.Status == GroupMemberStatus.Active)
                .Select(m => m.Role)
                .FirstOrDefaultAsync();

            if (userRole != GroupMemberRole.Admin && userRole != GroupMemberRole.Owner)
            {
                var accessDeniedMessage = await _localization.GetStringAsync(AppStrings.Groups.AccessDenied);
                return Forbid();
            }

            // Check if user is already a member
            var existingMember = await _context.GroupMembers
                .FirstOrDefaultAsync(m => m.GroupId == groupId && m.UserId == request.UserId);

            if (existingMember != null)
            {
                if (existingMember.Status == GroupMemberStatus.Active)
                {
                    return BadRequest("User is already a member of this group");
                }
                else
                {
                    // Reactivate member
                    existingMember.Status = GroupMemberStatus.Active;
                    existingMember.Role = request.Role;
                    existingMember.JoinedAt = DateTime.UtcNow;
                }
            }
            else
            {
                var newMember = new GroupMember
                {
                    GroupId = groupId,
                    UserId = request.UserId,
                    Role = request.Role,
                    Status = GroupMemberStatus.Active,
                    InvitedByUserId = userId
                };

                _context.GroupMembers.Add(newMember);
            }

            await _context.SaveChangesAsync();

            var successMessage = await _localization.GetStringAsync(AppStrings.Groups.MemberAddedSuccess);
            return Ok(new { message = successMessage });
        }
        catch (Exception ex)
        {
            var errorMessage = await _localization.GetStringAsync(AppStrings.Groups.MemberAddedFailed);
            return StatusCode(500, new { message = errorMessage, error = ex.Message });
        }
    }

    [HttpPost("{groupId}/posts")]
    public async Task<ActionResult<GroupPost>> CreatePost(string groupId, [FromBody] CreateGroupPostDto request)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
            {
                var authMessage = await _localization.GetStringAsync(AppStrings.Auth.UserNotAuthenticated);
                return Unauthorized(authMessage);
            }

            // Check if user is a member of the group
            var isMember = await _context.GroupMembers
                .AnyAsync(m => m.GroupId == groupId && m.UserId == userId && m.Status == GroupMemberStatus.Active);

            if (!isMember)
            {
                var accessDeniedMessage = await _localization.GetStringAsync(AppStrings.Groups.AccessDenied);
                return Forbid();
            }

            var post = new GroupPost
            {
                GroupId = groupId,
                AuthorId = userId,
                TextContent = request.TextContent,
                ImageUrl = request.ImageUrl,
                VideoUrl = request.VideoUrl,
                DocumentUrl = request.DocumentUrl,
                ContentType = request.ContentType,
                Visibility = request.Visibility
            };

            _context.GroupPosts.Add(post);
            await _context.SaveChangesAsync();

            var successMessage = await _localization.GetStringAsync(AppStrings.Groups.PostCreatedSuccess);
            return CreatedAtAction(nameof(GetPost), new { groupId, postId = post.Id }, new { post, message = successMessage });
        }
        catch (Exception ex)
        {
            var errorMessage = await _localization.GetStringAsync(AppStrings.Groups.PostCreatedFailed);
            return StatusCode(500, new { message = errorMessage, error = ex.Message });
        }
    }

    [HttpGet("{groupId}/posts/{postId}")]
    public async Task<ActionResult<GroupPost>> GetPost(string groupId, string postId)
    {
        try
        {
            var post = await _context.GroupPosts
                .Include(p => p.Author)
                .Include(p => p.Reactions)
                .Include(p => p.Comments)
                .FirstOrDefaultAsync(p => p.Id == postId && p.GroupId == groupId && !p.IsDeleted);

            if (post == null)
            {
                var notFoundMessage = await _localization.GetStringAsync(AppStrings.Groups.PostNotFound);
                return NotFound(new { message = notFoundMessage });
            }

            return Ok(post);
        }
        catch (Exception ex)
        {
            var errorMessage = await _localization.GetStringAsync(AppStrings.General.ServerError);
            return StatusCode(500, new { message = errorMessage, error = ex.Message });
        }
    }

    [HttpGet("{groupId}/posts")]
    public async Task<ActionResult<List<GroupPost>>> GetGroupPosts(string groupId, [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        try
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            
            // Check if user has access to the group
            var isMember = await _context.GroupMembers
                .AnyAsync(m => m.GroupId == groupId && m.UserId == userId && m.Status == GroupMemberStatus.Active);

            var group = await _context.Groups.FindAsync(groupId);
            if (group == null)
            {
                var notFoundMessage = await _localization.GetStringAsync(AppStrings.Groups.NotFound);
                return NotFound(new { message = notFoundMessage });
            }

            if (group.Privacy == GroupPrivacy.Private && !isMember && group.OwnerId != userId)
            {
                var accessDeniedMessage = await _localization.GetStringAsync(AppStrings.Groups.AccessDenied);
                return Forbid();
            }

            var posts = await _context.GroupPosts
                .Include(p => p.Author)
                .Include(p => p.Reactions)
                .Include(p => p.Comments)
                .Where(p => p.GroupId == groupId && !p.IsDeleted)
                .OrderByDescending(p => p.IsPinned)
                .ThenByDescending(p => p.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            return Ok(posts);
        }
        catch (Exception ex)
        {
            var errorMessage = await _localization.GetStringAsync(AppStrings.General.ServerError);
            return StatusCode(500, new { message = errorMessage, error = ex.Message });
        }
    }
}

// DTOs
public class CreateGroupDto
{
    [Required]
    [StringLength(100)]
    public string Name { get; set; } = string.Empty;

    [StringLength(500)]
    public string? Description { get; set; }

    [Required]
    public GroupType Type { get; set; }

    [Required]
    public GroupPrivacy Privacy { get; set; }
}

public class AddMemberDto
{
    [Required]
    public string UserId { get; set; } = string.Empty;

    [Required]
    public GroupMemberRole Role { get; set; } = GroupMemberRole.Member;
}

public class CreateGroupPostDto
{
    [StringLength(1000)]
    public string? TextContent { get; set; }

    [StringLength(500)]
    public string? ImageUrl { get; set; }

    [StringLength(500)]
    public string? VideoUrl { get; set; }

    [StringLength(500)]
    public string? DocumentUrl { get; set; }

    [Required]
    public PostContentType ContentType { get; set; } = PostContentType.Text;

    [Required]
    public PostVisibility Visibility { get; set; } = PostVisibility.GroupMembers;
}
