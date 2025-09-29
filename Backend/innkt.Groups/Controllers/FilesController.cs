using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using innkt.Groups.Services;
using innkt.Groups.DTOs;
using innkt.Groups.Middleware;
using System.Security.Claims;

namespace innkt.Groups.Controllers;

[ApiController]
[Route("api/groups/{groupId}/files")]
[Authorize]
public class FilesController : ControllerBase
{
    private readonly IGroupService _groupService;
    private readonly ILogger<FilesController> _logger;

    public FilesController(IGroupService groupService, ILogger<FilesController> logger)
    {
        _groupService = groupService;
        _logger = logger;
    }

    /// <summary>
    /// Upload a file to a group
    /// </summary>
    [HttpPost("upload")]
    [RequirePermission("groups.manage")]
    public async Task<ActionResult<FileResponse>> UploadFile(
        Guid groupId,
        [FromForm] IFormFile file,
        [FromForm] string? description = null,
        [FromForm] string? fileCategory = "general",
        [FromForm] bool isPublic = true,
        [FromForm] bool isDownloadable = true,
        [FromForm] Guid? topicId = null,
        [FromForm] Guid? kidId = null,
        [FromForm] bool isParentUploadingForKid = false)
    {
        try
        {
            var userId = GetCurrentUserId();
            
            if (file == null || file.Length == 0)
            {
                return BadRequest("No file provided");
            }

            // Validate file size (e.g., 10MB limit)
            if (file.Length > 10 * 1024 * 1024)
            {
                return BadRequest("File size exceeds 10MB limit");
            }

            // Validate file type
            var allowedMimeTypes = new[]
            {
                "image/jpeg", "image/png", "image/gif", "image/webp",
                "application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                "application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                "text/plain", "application/zip", "video/mp4", "audio/mpeg"
            };

            if (!allowedMimeTypes.Contains(file.ContentType))
            {
                return BadRequest("File type not allowed");
            }

            // Create file path
            var uploadsPath = Path.Combine("uploads", "groups", groupId.ToString());
            Directory.CreateDirectory(uploadsPath);
            
            var fileName = $"{Guid.NewGuid()}_{file.FileName}";
            var filePath = Path.Combine(uploadsPath, fileName);

            // Save file
            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            // Create file record
            var fileData = new CreateFileRequest
            {
                GroupId = groupId,
                TopicId = topicId,
                FileName = file.FileName,
                MimeType = file.ContentType,
                FileSize = file.Length,
                FileCategory = fileCategory ?? "general",
                Description = description,
                IsPublic = isPublic,
                IsDownloadable = isDownloadable,
                KidId = kidId,
                IsParentUploadingForKid = isParentUploadingForKid
            };

            var fileResponse = await _groupService.CreateFileAsync(userId, fileData, filePath);
            
            _logger.LogInformation("File uploaded to group {GroupId} by user {UserId}: {FileName}", 
                groupId, userId, file.FileName);
            
            return CreatedAtAction(nameof(GetFile), new { groupId, fileId = fileResponse.Id }, fileResponse);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error uploading file to group {GroupId}", groupId);
            return StatusCode(500, "An error occurred while uploading the file");
        }
    }

    /// <summary>
    /// Get files for a group
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<FileListResponse>> GetGroupFiles(
        Guid groupId,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? category = null,
        [FromQuery] Guid? topicId = null)
    {
        try
        {
            var userId = GetCurrentUserId();
            var files = await _groupService.GetGroupFilesAsync(groupId, userId, page, pageSize, category, topicId);
            return Ok(files);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting files for group {GroupId}", groupId);
            return StatusCode(500, "An error occurred while retrieving files");
        }
    }

    /// <summary>
    /// Get a specific file
    /// </summary>
    [HttpGet("{fileId}")]
    public async Task<ActionResult<FileResponse>> GetFile(Guid groupId, Guid fileId)
    {
        try
        {
            var userId = GetCurrentUserId();
            var file = await _groupService.GetFileByIdAsync(fileId, userId);
            
            if (file == null)
                return NotFound("File not found");
                
            return Ok(file);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting file {FileId} from group {GroupId}", fileId, groupId);
            return StatusCode(500, "An error occurred while retrieving the file");
        }
    }

    /// <summary>
    /// Download a file
    /// </summary>
    [HttpGet("{fileId}/download")]
    public async Task<IActionResult> DownloadFile(Guid groupId, Guid fileId)
    {
        try
        {
            var userId = GetCurrentUserId();
            var file = await _groupService.GetFileByIdAsync(fileId, userId);
            
            if (file == null)
                return NotFound("File not found");

            if (!file.IsDownloadable)
                return Forbid("File is not downloadable");

            // Increment download count
            await _groupService.IncrementFileDownloadCountAsync(fileId);

            var fileBytes = await System.IO.File.ReadAllBytesAsync(file.FilePath);
            return File(fileBytes, file.MimeType, file.FileName);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error downloading file {FileId} from group {GroupId}", fileId, groupId);
            return StatusCode(500, "An error occurred while downloading the file");
        }
    }

    /// <summary>
    /// Update file metadata
    /// </summary>
    [HttpPut("{fileId}")]
    [RequirePermission("groups.manage")]
    public async Task<ActionResult<FileResponse>> UpdateFile(
        Guid groupId, 
        Guid fileId, 
        [FromBody] UpdateFileRequest request)
    {
        try
        {
            var userId = GetCurrentUserId();
            var file = await _groupService.UpdateFileAsync(fileId, userId, request);
            return Ok(file);
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid("You don't have permission to update this file");
        }
        catch (KeyNotFoundException)
        {
            return NotFound("File not found");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating file {FileId} in group {GroupId}", fileId, groupId);
            return StatusCode(500, "An error occurred while updating the file");
        }
    }

    /// <summary>
    /// Delete a file
    /// </summary>
    [HttpDelete("{fileId}")]
    [RequirePermission("groups.manage")]
    public async Task<ActionResult> DeleteFile(Guid groupId, Guid fileId)
    {
        try
        {
            var userId = GetCurrentUserId();
            var success = await _groupService.DeleteFileAsync(fileId, userId);
            
            if (!success)
                return NotFound("File not found");
                
            return NoContent();
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid("You don't have permission to delete this file");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting file {FileId} from group {GroupId}", fileId, groupId);
            return StatusCode(500, "An error occurred while deleting the file");
        }
    }

    /// <summary>
    /// Set file permissions for a role
    /// </summary>
    [HttpPost("{fileId}/permissions")]
    [RequirePermission("groups.manage")]
    public async Task<ActionResult<FilePermissionResponse>> SetFilePermission(
        Guid groupId, 
        Guid fileId, 
        [FromBody] FilePermissionRequest request)
    {
        try
        {
            var userId = GetCurrentUserId();
            var permission = await _groupService.SetFilePermissionAsync(fileId, userId, request);
            return Ok(permission);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error setting file permission for file {FileId} in group {GroupId}", fileId, groupId);
            return StatusCode(500, "An error occurred while setting file permission");
        }
    }

    /// <summary>
    /// Get file permissions
    /// </summary>
    [HttpGet("{fileId}/permissions")]
    [RequirePermission("groups.manage")]
    public async Task<ActionResult<List<FilePermissionResponse>>> GetFilePermissions(
        Guid groupId, 
        Guid fileId)
    {
        try
        {
            var userId = GetCurrentUserId();
            var permissions = await _groupService.GetFilePermissionsAsync(fileId, userId);
            return Ok(permissions);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting file permissions for file {FileId} in group {GroupId}", fileId, groupId);
            return StatusCode(500, "An error occurred while retrieving file permissions");
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

