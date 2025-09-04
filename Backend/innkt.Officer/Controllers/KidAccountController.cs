using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using innkt.Officer.Models.DTOs;
using innkt.Officer.Services;
using innkt.StringLibrary.Services;
using innkt.StringLibrary.Constants;
using System.Security.Claims;

namespace innkt.Officer.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class KidAccountController : ControllerBase
{
    private readonly IKidAccountService _kidAccountService;
    private readonly IEnhancedLoggingService _logger;
    private readonly ILocalizationService _localization;

    public KidAccountController(IKidAccountService kidAccountService, IEnhancedLoggingService logger, ILocalizationService localization)
    {
        _kidAccountService = kidAccountService;
        _logger = logger;
        _localization = localization;
    }

    [HttpPost("create")]
    public async Task<ActionResult<string>> CreateKidAccount([FromBody] CreateKidAccountDto request)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var parentUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(parentUserId))
            {
                var authMessage = await _localization.GetStringAsync(AppStrings.Auth.UserNotAuthenticated);
                return Unauthorized(authMessage);
            }

            var kidAccountId = await _kidAccountService.CreateKidAccountAsync(parentUserId, request);
            var successMessage = await _localization.GetStringAsync(AppStrings.KidAccount.CreationSuccess);
            return Ok(new { kidAccountId, message = successMessage });
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(AppStrings.KidAccount.CreationFailed, ex);
            return BadRequest(ex.Message);
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning(AppStrings.KidAccount.CreationFailed, ex);
            return BadRequest(ex.Message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, AppStrings.KidAccount.CreationFailed);
            var errorMessage = await _localization.GetStringAsync(AppStrings.General.ServerError);
            return StatusCode(500, new { message = errorMessage });
        }
    }

    [HttpPost("pair")]
    public async Task<ActionResult> PairKidAccount([FromBody] KidAccountPairingDto request)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            // For pairing, we need to identify the kid account by QR code first
            // This is a simplified implementation - in real app you'd have a way to identify the account
            var success = await _kidAccountService.PairKidAccountAsync("temp", request);
            if (success)
            {
                var successMessage = await _localization.GetStringAsync(AppStrings.KidAccount.PairingSuccess);
                return Ok(new { message = successMessage });
            }

            var errorMessage = await _localization.GetStringAsync(AppStrings.KidAccount.PairingFailed);
            return BadRequest(new { message = errorMessage });
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning(AppStrings.KidAccount.PairingFailed, ex);
            return BadRequest(ex.Message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, AppStrings.KidAccount.PairingFailed);
            var errorMessage = await _localization.GetStringAsync(AppStrings.General.ServerError);
            return StatusCode(500, new { message = errorMessage });
        }
    }

    [HttpGet("status/{kidAccountId}")]
    public async Task<ActionResult<KidAccountStatusDto>> GetKidAccountStatus(string kidAccountId)
    {
        try
        {
            if (string.IsNullOrEmpty(kidAccountId))
            {
                var validationMessage = await _localization.GetStringAsync(AppStrings.Validation.KidAccountIdRequired);
                return BadRequest(validationMessage);
            }

            var status = await _kidAccountService.GetKidAccountStatusAsync(kidAccountId);
            return Ok(status);
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning(AppStrings.KidAccount.StatusRetrievalFailed, ex);
            return BadRequest(ex.Message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, AppStrings.KidAccount.StatusRetrievalFailed);
            var errorMessage = await _localization.GetStringAsync(AppStrings.General.ServerError);
            return StatusCode(500, new { message = errorMessage });
        }
    }

    [HttpGet("parent-accounts")]
    public async Task<ActionResult<List<KidAccountStatusDto>>> GetParentKidAccounts()
    {
        try
        {
            var parentUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(parentUserId))
            {
                var authMessage = await _localization.GetStringAsync(AppStrings.Auth.UserNotAuthenticated);
                return Unauthorized(authMessage);
            }

            var kidAccounts = await _kidAccountService.GetParentKidAccountsAsync(parentUserId);
            return Ok(kidAccounts);
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning(AppStrings.KidAccount.ParentAccountsRetrievalFailed, ex);
            return BadRequest(ex.Message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, AppStrings.KidAccount.ParentAccountsRetrievalFailed);
            var errorMessage = await _localization.GetStringAsync(AppStrings.General.ServerError);
            return StatusCode(500, new { message = errorMessage });
        }
    }

    [HttpPost("independence-date")]
    public async Task<ActionResult> SetIndependenceDate([FromBody] SetIndependenceDateDto request)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var parentUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(parentUserId))
            {
                var authMessage = await _localization.GetStringAsync(AppStrings.Auth.UserNotAuthenticated);
                return Unauthorized(authMessage);
            }

            var success = await _kidAccountService.SetKidIndependenceDateAsync(request.KidAccountId, request.IndependenceDate);
            if (success)
            {
                var successMessage = await _localization.GetStringAsync(AppStrings.KidAccount.IndependenceDateSetSuccess);
                return Ok(new { message = successMessage });
            }

            var errorMessage = await _localization.GetStringAsync(AppStrings.KidAccount.IndependenceDateSetFailed);
            return BadRequest(new { message = errorMessage });
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning(AppStrings.KidAccount.IndependenceDateSetFailed, ex);
            return BadRequest(ex.Message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, AppStrings.KidAccount.IndependenceDateSetFailed);
            var errorMessage = await _localization.GetStringAsync(AppStrings.General.ServerError);
            return StatusCode(500, new { message = errorMessage });
        }
    }

    [HttpPost("make-independent")]
    public async Task<ActionResult> MakeKidAccountIndependent([FromBody] KidAccountIndependenceDto request)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var success = await _kidAccountService.MakeKidAccountIndependentAsync(request.KidAccountId, request);
            if (success)
            {
                var successMessage = await _localization.GetStringAsync(AppStrings.KidAccount.IndependenceSuccess);
                return Ok(new { message = successMessage });
            }

            var errorMessage = await _localization.GetStringAsync(AppStrings.KidAccount.IndependenceFailed);
            return BadRequest(new { message = errorMessage });
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(AppStrings.KidAccount.IndependenceFailed, ex);
            return BadRequest(ex.Message);
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning(AppStrings.KidAccount.IndependenceFailed, ex);
            return BadRequest(ex.Message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, AppStrings.KidAccount.IndependenceFailed);
            var errorMessage = await _localization.GetStringAsync(AppStrings.General.ServerError);
            return StatusCode(500, new { message = errorMessage });
        }
    }

    [HttpPost("follow-request")]
    public async Task<ActionResult> SendFollowRequest([FromBody] KidFollowRequestDto request)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var success = await _kidAccountService.SubmitFollowRequestAsync(request);
            if (success)
            {
                var successMessage = await _localization.GetStringAsync(AppStrings.KidAccount.FollowRequestSentSuccess);
                return Ok(new { message = successMessage });
            }

            var errorMessage = await _localization.GetStringAsync(AppStrings.KidAccount.FollowRequestSentFailed);
            return BadRequest(new { message = errorMessage });
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(AppStrings.KidAccount.FollowRequestSentFailed, ex);
            return BadRequest(ex.Message);
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning(AppStrings.KidAccount.FollowRequestSentFailed, ex);
            return BadRequest(ex.Message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, AppStrings.KidAccount.FollowRequestSentFailed);
            var errorMessage = await _localization.GetStringAsync(AppStrings.General.ServerError);
            return StatusCode(500, new { message = errorMessage });
        }
    }

    [HttpPost("approve-follow-request")]
    public async Task<ActionResult> ApproveFollowRequest([FromBody] ApproveFollowRequestDto request)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var parentUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(parentUserId))
            {
                var authMessage = await _localization.GetStringAsync(AppStrings.Auth.UserNotAuthenticated);
                return Unauthorized(authMessage);
            }

            var approvalDto = new KidFollowApprovalDto
            {
                FollowRequestId = request.FollowRequestId,
                IsApproved = true
            };

            var success = await _kidAccountService.ApproveFollowRequestAsync(parentUserId, approvalDto);
            if (success)
            {
                var successMessage = await _localization.GetStringAsync(AppStrings.KidAccount.FollowRequestApprovedSuccess);
                return Ok(new { message = successMessage });
            }

            var errorMessage = await _localization.GetStringAsync(AppStrings.KidAccount.FollowRequestApprovedFailed);
            return BadRequest(new { message = errorMessage });
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(AppStrings.KidAccount.FollowRequestApprovedFailed, ex);
            return BadRequest(ex.Message);
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning(AppStrings.KidAccount.FollowRequestApprovedFailed, ex);
            return BadRequest(ex.Message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, AppStrings.KidAccount.FollowRequestApprovedFailed);
            var errorMessage = await _localization.GetStringAsync(AppStrings.General.ServerError);
            return StatusCode(500, new { message = errorMessage });
        }
    }

    [HttpPost("reject-follow-request")]
    public async Task<ActionResult> RejectFollowRequest([FromBody] RejectFollowRequestDto request)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var parentUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(parentUserId))
            {
                var authMessage = await _localization.GetStringAsync(AppStrings.Auth.UserNotAuthenticated);
                return Unauthorized(authMessage);
            }

            var approvalDto = new KidFollowApprovalDto
            {
                FollowRequestId = request.FollowRequestId,
                IsApproved = false,
                RejectionReason = request.Reason
            };

            var success = await _kidAccountService.RejectFollowRequestAsync(parentUserId, approvalDto);
            if (success)
            {
                var successMessage = await _localization.GetStringAsync(AppStrings.KidAccount.FollowRequestRejectedSuccess);
                return Ok(new { message = successMessage });
            }

            var errorMessage = await _localization.GetStringAsync(AppStrings.KidAccount.FollowRequestRejectedFailed);
            return BadRequest(new { message = errorMessage });
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(AppStrings.KidAccount.FollowRequestRejectedFailed, ex);
            return BadRequest(ex.Message);
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning(AppStrings.KidAccount.FollowRequestRejectedFailed, ex);
            return BadRequest(ex.Message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, AppStrings.KidAccount.FollowRequestRejectedFailed);
            var errorMessage = await _localization.GetStringAsync(AppStrings.General.ServerError);
            return StatusCode(500, new { message = errorMessage });
        }
    }

    [HttpPost("unfollow")]
    public async Task<ActionResult> UnfollowUser([FromBody] KidUnfollowDto request)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            // Note: This method doesn't exist in the service yet, so we'll return a not implemented response
            var errorMessage = await _localization.GetStringAsync(AppStrings.General.ServiceUnavailable);
            return StatusCode(501, new { message = errorMessage });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, AppStrings.KidAccount.UnfollowFailed);
            var errorMessage = await _localization.GetStringAsync(AppStrings.General.ServerError);
            return StatusCode(500, new { message = errorMessage });
        }
    }

    [HttpGet("followers/{kidAccountId}")]
    public async Task<ActionResult<List<KidFollowerDto>>> GetFollowers(string kidAccountId)
    {
        try
        {
            if (string.IsNullOrEmpty(kidAccountId))
            {
                var validationMessage = await _localization.GetStringAsync(AppStrings.Validation.KidAccountIdRequired);
                return BadRequest(validationMessage);
            }

            // Note: This method doesn't exist in the service yet, so we'll return a not implemented response
            var errorMessage = await _localization.GetStringAsync(AppStrings.General.ServiceUnavailable);
            return StatusCode(501, new { message = errorMessage });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, AppStrings.KidAccount.FollowersRetrievalFailed);
            var errorMessage = await _localization.GetStringAsync(AppStrings.General.ServerError);
            return StatusCode(500, new { message = errorMessage });
        }
    }

    [HttpGet("following/{kidAccountId}")]
    public async Task<ActionResult<List<KidFollowingDto>>> GetFollowing(string kidAccountId)
    {
        try
        {
            if (string.IsNullOrEmpty(kidAccountId))
            {
                var validationMessage = await _localization.GetStringAsync(AppStrings.Validation.KidAccountIdRequired);
                return BadRequest(validationMessage);
            }

            // Note: This method doesn't exist in the service yet, so we'll return a not implemented response
            var errorMessage = await _localization.GetStringAsync(AppStrings.General.ServiceUnavailable);
            return StatusCode(501, new { message = errorMessage });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, AppStrings.KidAccount.FollowingRetrievalFailed);
            var errorMessage = await _localization.GetStringAsync(AppStrings.General.ServerError);
            return StatusCode(500, new { message = errorMessage });
        }
    }

    [HttpPost("content-restrictions")]
    public async Task<ActionResult> SetContentRestrictions([FromBody] SetContentRestrictionsDto request)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var parentUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(parentUserId))
            {
                var authMessage = await _localization.GetStringAsync(AppStrings.Auth.UserNotAuthenticated);
                return Unauthorized(authMessage);
            }

            // Note: This method doesn't exist in the service yet, so we'll return a not implemented response
            var errorMessage = await _localization.GetStringAsync(AppStrings.General.ServiceUnavailable);
            return StatusCode(501, new { message = errorMessage });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, AppStrings.KidAccount.ContentRestrictionsSetFailed);
            var errorMessage = await _localization.GetStringAsync(AppStrings.General.ServerError);
            return StatusCode(500, new { message = errorMessage });
        }
    }

    [HttpGet("content-restrictions/{kidAccountId}")]
    public async Task<ActionResult<List<string>>> GetContentRestrictions(string kidAccountId)
    {
        try
        {
            if (string.IsNullOrEmpty(kidAccountId))
            {
                var validationMessage = await _localization.GetStringAsync(AppStrings.Validation.KidAccountIdRequired);
                return BadRequest(validationMessage);
            }

            // Note: This method doesn't exist in the service yet, so we'll return a not implemented response
            var errorMessage = await _localization.GetStringAsync(AppStrings.General.ServiceUnavailable);
            return StatusCode(501, new { message = errorMessage });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, AppStrings.KidAccount.ContentRestrictionsRetrievalFailed);
            var errorMessage = await _localization.GetStringAsync(AppStrings.General.ServerError);
            return StatusCode(500, new { message = errorMessage });
        }
    }
}
