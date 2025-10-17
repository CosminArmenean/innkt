using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using innkt.Seer.Models;
using innkt.Seer.Services;
using innkt.Seer.Hubs;
using innkt.Common.Models;
using System.Security.Claims;

namespace innkt.Seer.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class CallController : ControllerBase
    {
        private readonly ILogger<CallController> _logger;
        private readonly CallManagementService _callManagementService;
        private readonly CallEventService _callEventService;
        private readonly WebRTCService _webRTCService;
        private readonly IHubContext<SignalingHub> _hubContext;

        public CallController(
            ILogger<CallController> logger,
            CallManagementService callManagementService,
            CallEventService callEventService,
            WebRTCService webRTCService,
            IHubContext<SignalingHub> hubContext)
        {
            _logger = logger;
            _callManagementService = callManagementService;
            _callEventService = callEventService;
            _webRTCService = webRTCService;
            _hubContext = hubContext;
        }

        /// <summary>
        /// Start a new call
        /// </summary>
        [HttpPost("start")]
        public async Task<ActionResult<ApiResponse<Call>>> StartCall([FromBody] StartCallRequest request)
        {
            try
            {
                var callerId = GetUserId();
                if (string.IsNullOrEmpty(callerId))
                {
                    return Unauthorized(new ApiResponse<Call>
                    {
                        Success = false,
                        Message = "Unauthorized"
                    });
                }

                // Validate request
                if (string.IsNullOrEmpty(request.CalleeId))
                {
                    return BadRequest(new ApiResponse<Call>
                    {
                        Success = false,
                        Message = "Callee ID is required"
                    });
                }

                if (callerId == request.CalleeId)
                {
                    return BadRequest(new ApiResponse<Call>
                    {
                        Success = false,
                        Message = "Cannot call yourself"
                    });
                }

                // Create call
                var call = await _callManagementService.CreateCallAsync(
                    callerId, 
                    request.CalleeId, 
                    request.Type, 
                    request.ConversationId);

                // Send incoming call notification to callee via SignalR
                _logger.LogInformation($"Sending IncomingCall notification to user_{request.CalleeId} for call {call.Id}");
                await _hubContext.Clients.Group($"user_{request.CalleeId}").SendAsync("IncomingCall", new
                {
                    CallId = call.Id,
                    CallerId = callerId,
                    CallType = request.Type,
                    ConversationId = request.ConversationId,
                    CreatedAt = call.CreatedAt
                });
                _logger.LogInformation($"IncomingCall notification sent to user_{request.CalleeId}");

                _logger.LogInformation($"Call started: {call.Id} from {callerId} to {request.CalleeId}");

                return Ok(new ApiResponse<Call>
                {
                    Success = true,
                    Data = call,
                    Message = "Call started successfully"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error starting call");
                return StatusCode(500, new ApiResponse<Call>
                {
                    Success = false,
                    Message = "Failed to start call"
                });
            }
        }

        /// <summary>
        /// Get call details
        /// </summary>
        [HttpGet("{callId}")]
        public async Task<ActionResult<ApiResponse<Call>>> GetCall(string callId)
        {
            try
            {
                var userId = GetUserId();
                if (string.IsNullOrEmpty(userId))
                {
                    return Unauthorized(new ApiResponse<Call>
                    {
                        Success = false,
                        Message = "Unauthorized"
                    });
                }

                var call = await _callManagementService.GetCallAsync(callId);
                if (call == null)
                {
                    return NotFound(new ApiResponse<Call>
                    {
                        Success = false,
                        Message = "Call not found"
                    });
                }

                // Check if user is part of the call
                if (!call.Participants.Any(p => p.UserId == userId))
                {
                    return Forbid();
                }

                return Ok(new ApiResponse<Call>
                {
                    Success = true,
                    Data = call,
                    Message = "Call retrieved successfully"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error getting call {callId}");
                return StatusCode(500, new ApiResponse<Call>
                {
                    Success = false,
                    Message = "Failed to get call"
                });
            }
        }

        /// <summary>
        /// Join a call
        /// </summary>
        [HttpPost("{callId}/join")]
        public async Task<ActionResult<ApiResponse<object>>> JoinCall(string callId)
        {
            try
            {
                var userId = GetUserId();
                if (string.IsNullOrEmpty(userId))
                {
                    return Unauthorized(new ApiResponse<object>
                    {
                        Success = false,
                        Message = "Unauthorized"
                    });
                }

                var call = await _callManagementService.GetCallAsync(callId);
                if (call == null)
                {
                    return NotFound(new ApiResponse<object>
                    {
                        Success = false,
                        Message = "Call not found"
                    });
                }

                // Check if user is invited to the call
                var participant = call.Participants.FirstOrDefault(p => p.UserId == userId);
                if (participant == null)
                {
                    return Forbid();
                }

                // Update participant status
                var success = await _callManagementService.UpdateParticipantStatusAsync(callId, userId, ParticipantStatus.Connected);
                if (!success)
                {
                    return BadRequest(new ApiResponse<object>
                    {
                        Success = false,
                        Message = "Failed to join call"
                    });
                }

                _logger.LogInformation($"User {userId} joined call {callId}");

                return Ok(new ApiResponse<object>
                {
                    Success = true,
                    Message = "Joined call successfully"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error joining call {callId}");
                return StatusCode(500, new ApiResponse<object>
                {
                    Success = false,
                    Message = "Failed to join call"
                });
            }
        }

        /// <summary>
        /// Leave a call
        /// </summary>
        [HttpPost("{callId}/leave")]
        public async Task<ActionResult<ApiResponse<object>>> LeaveCall(string callId)
        {
            try
            {
                var userId = GetUserId();
                if (string.IsNullOrEmpty(userId))
                {
                    return Unauthorized(new ApiResponse<object>
                    {
                        Success = false,
                        Message = "Unauthorized"
                    });
                }

                var success = await _callManagementService.RemoveParticipantAsync(callId, userId);
                if (!success)
                {
                    return BadRequest(new ApiResponse<object>
                    {
                        Success = false,
                        Message = "Failed to leave call"
                    });
                }

                _logger.LogInformation($"User {userId} left call {callId}");

                return Ok(new ApiResponse<object>
                {
                    Success = true,
                    Message = "Left call successfully"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error leaving call {callId}");
                return StatusCode(500, new ApiResponse<object>
                {
                    Success = false,
                    Message = "Failed to leave call"
                });
            }
        }

        /// <summary>
        /// End a call
        /// </summary>
        [HttpPost("{callId}/end")]
        public async Task<ActionResult<ApiResponse<object>>> EndCall(string callId)
        {
            try
            {
                var userId = GetUserId();
                if (string.IsNullOrEmpty(userId))
                {
                    return Unauthorized(new ApiResponse<object>
                    {
                        Success = false,
                        Message = "Unauthorized"
                    });
                }

                var call = await _callManagementService.GetCallAsync(callId);
                if (call == null)
                {
                    return NotFound(new ApiResponse<object>
                    {
                        Success = false,
                        Message = "Call not found"
                    });
                }

                // Check if user is part of the call
                if (!call.Participants.Any(p => p.UserId == userId))
                {
                    return Forbid();
                }

                var success = await _callManagementService.EndCallAsync(callId, userId);
                if (!success)
                {
                    return BadRequest(new ApiResponse<object>
                    {
                        Success = false,
                        Message = "Failed to end call"
                    });
                }

                _logger.LogInformation($"Call {callId} ended by {userId}");

                return Ok(new ApiResponse<object>
                {
                    Success = true,
                    Message = "Call ended successfully"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error ending call {callId}");
                return StatusCode(500, new ApiResponse<object>
                {
                    Success = false,
                    Message = "Failed to end call"
                });
            }
        }

        /// <summary>
        /// Get user's call history
        /// </summary>
        [HttpGet("history")]
        public async Task<ActionResult<ApiResponse<List<Call>>>> GetCallHistory([FromQuery] int limit = 50)
        {
            try
            {
                var userId = GetUserId();
                if (string.IsNullOrEmpty(userId))
                {
                    return Unauthorized(new ApiResponse<List<Call>>
                    {
                        Success = false,
                        Message = "Unauthorized"
                    });
                }

                var calls = await _callManagementService.GetUserCallsAsync(userId, limit);

                return Ok(new ApiResponse<List<Call>>
                {
                    Success = true,
                    Data = calls,
                    Message = $"Retrieved {calls.Count} calls"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting call history");
                return StatusCode(500, new ApiResponse<List<Call>>
                {
                    Success = false,
                    Message = "Failed to get call history"
                });
            }
        }

        /// <summary>
        /// Get active calls
        /// </summary>
        [HttpGet("active")]
        public async Task<ActionResult<ApiResponse<List<Call>>>> GetActiveCalls()
        {
            try
            {
                var userId = GetUserId();
                if (string.IsNullOrEmpty(userId))
                {
                    return Unauthorized(new ApiResponse<List<Call>>
                    {
                        Success = false,
                        Message = "Unauthorized"
                    });
                }

                var activeCalls = await _callManagementService.GetActiveCallsAsync();
                
                // Filter to only include calls where user is a participant
                var userCalls = activeCalls.Where(c => c.Participants.Any(p => p.UserId == userId)).ToList();

                return Ok(new ApiResponse<List<Call>>
                {
                    Success = true,
                    Data = userCalls,
                    Message = $"Retrieved {userCalls.Count} active calls"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting active calls");
                return StatusCode(500, new ApiResponse<List<Call>>
                {
                    Success = false,
                    Message = "Failed to get active calls"
                });
            }
        }

        /// <summary>
        /// Update call settings
        /// </summary>
        [HttpPut("{callId}/settings")]
        public async Task<ActionResult<ApiResponse<object>>> UpdateCallSettings(string callId, [FromBody] CallSettings settings)
        {
            try
            {
                var userId = GetUserId();
                if (string.IsNullOrEmpty(userId))
                {
                    return Unauthorized(new ApiResponse<object>
                    {
                        Success = false,
                        Message = "Unauthorized"
                    });
                }

                var call = await _callManagementService.GetCallAsync(callId);
                if (call == null)
                {
                    return NotFound(new ApiResponse<object>
                    {
                        Success = false,
                        Message = "Call not found"
                    });
                }

                // Check if user is the host
                var participant = call.Participants.FirstOrDefault(p => p.UserId == userId);
                if (participant == null || participant.Role != ParticipantRole.Host)
                {
                    return Forbid();
                }

                call.Settings = settings;
                // Note: You'll need to add a method to update call settings in CallManagementService
                // await _callManagementService.UpdateCallSettingsAsync(callId, settings);

                _logger.LogInformation($"Call settings updated for call {callId} by {userId}");

                return Ok(new ApiResponse<object>
                {
                    Success = true,
                    Message = "Call settings updated successfully"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error updating call settings for call {callId}");
                return StatusCode(500, new ApiResponse<object>
                {
                    Success = false,
                    Message = "Failed to update call settings"
                });
            }
        }

        private string? GetUserId()
        {
            return User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        }
    }

    // Request/Response Models
    public class StartCallRequest
    {
        public string CalleeId { get; set; } = string.Empty;
        public CallType Type { get; set; } = CallType.Voice;
        public string? ConversationId { get; set; }
    }
}
