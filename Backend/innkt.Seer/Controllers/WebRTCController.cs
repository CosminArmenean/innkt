using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using innkt.Seer.Models;
using innkt.Seer.Services;
using innkt.Common.Models;
using System.Security.Claims;

namespace innkt.Seer.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class WebRTCController : ControllerBase
    {
        private readonly ILogger<WebRTCController> _logger;
        private readonly WebRTCService _webRTCService;
        private readonly CallManagementService _callManagementService;

        public WebRTCController(
            ILogger<WebRTCController> logger,
            WebRTCService webRTCService,
            CallManagementService callManagementService)
        {
            _logger = logger;
            _webRTCService = webRTCService;
            _callManagementService = callManagementService;
        }

        /// <summary>
        /// Get WebRTC configuration (STUN/TURN servers)
        /// </summary>
        [HttpGet("config")]
        public async Task<ActionResult<ApiResponse<WebRTCConfiguration>>> GetWebRTCConfiguration()
        {
            try
            {
                var configuration = await _webRTCService.GetWebRTCConfigurationAsync();
                
                // Validate configuration
                var isValid = await _webRTCService.ValidateWebRTCConfigurationAsync(configuration);
                if (!isValid)
                {
                    _logger.LogWarning("WebRTC configuration validation failed");
                }

                return Ok(new ApiResponse<WebRTCConfiguration>
                {
                    Success = true,
                    Data = configuration,
                    Message = "WebRTC configuration retrieved successfully"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting WebRTC configuration");
                return StatusCode(500, new ApiResponse<WebRTCConfiguration>
                {
                    Success = false,
                    Message = "Failed to get WebRTC configuration"
                });
            }
        }

        /// <summary>
        /// Get call quality information
        /// </summary>
        [HttpGet("call/{callId}/quality")]
        public async Task<ActionResult<ApiResponse<CallQuality>>> GetCallQuality(string callId)
        {
            try
            {
                var userId = GetUserId();
                if (string.IsNullOrEmpty(userId))
                {
                    return Unauthorized(new ApiResponse<CallQuality>
                    {
                        Success = false,
                        Message = "Unauthorized"
                    });
                }

                var call = await _callManagementService.GetCallAsync(callId);
                if (call == null)
                {
                    return NotFound(new ApiResponse<CallQuality>
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

                var quality = await _webRTCService.GetCallQualityAsync(callId);

                return Ok(new ApiResponse<CallQuality>
                {
                    Success = true,
                    Data = quality,
                    Message = "Call quality retrieved successfully"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error getting call quality for call {callId}");
                return StatusCode(500, new ApiResponse<CallQuality>
                {
                    Success = false,
                    Message = "Failed to get call quality"
                });
            }
        }

        /// <summary>
        /// Get participant quality information
        /// </summary>
        [HttpGet("call/{callId}/participant/{userId}/quality")]
        public async Task<ActionResult<ApiResponse<ParticipantQuality>>> GetParticipantQuality(string callId, string userId)
        {
            try
            {
                var currentUserId = GetUserId();
                if (string.IsNullOrEmpty(currentUserId))
                {
                    return Unauthorized(new ApiResponse<ParticipantQuality>
                    {
                        Success = false,
                        Message = "Unauthorized"
                    });
                }

                var call = await _callManagementService.GetCallAsync(callId);
                if (call == null)
                {
                    return NotFound(new ApiResponse<ParticipantQuality>
                    {
                        Success = false,
                        Message = "Call not found"
                    });
                }

                // Check if current user is part of the call
                if (!call.Participants.Any(p => p.UserId == currentUserId))
                {
                    return Forbid();
                }

                var quality = await _webRTCService.GetParticipantQualityAsync(callId, userId);
                if (quality == null)
                {
                    return NotFound(new ApiResponse<ParticipantQuality>
                    {
                        Success = false,
                        Message = "Participant quality not found"
                    });
                }

                return Ok(new ApiResponse<ParticipantQuality>
                {
                    Success = true,
                    Data = quality,
                    Message = "Participant quality retrieved successfully"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error getting participant quality for user {userId} in call {callId}");
                return StatusCode(500, new ApiResponse<ParticipantQuality>
                {
                    Success = false,
                    Message = "Failed to get participant quality"
                });
            }
        }

        /// <summary>
        /// Get media stream information
        /// </summary>
        [HttpGet("call/{callId}/media")]
        public async Task<ActionResult<ApiResponse<MediaStreamInfo>>> GetMediaStreamInfo(string callId)
        {
            try
            {
                var userId = GetUserId();
                if (string.IsNullOrEmpty(userId))
                {
                    return Unauthorized(new ApiResponse<MediaStreamInfo>
                    {
                        Success = false,
                        Message = "Unauthorized"
                    });
                }

                var call = await _callManagementService.GetCallAsync(callId);
                if (call == null)
                {
                    return NotFound(new ApiResponse<MediaStreamInfo>
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

                var streamInfo = await _webRTCService.GetMediaStreamInfoAsync(callId, userId);

                return Ok(new ApiResponse<MediaStreamInfo>
                {
                    Success = true,
                    Data = streamInfo,
                    Message = "Media stream info retrieved successfully"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error getting media stream info for call {callId}");
                return StatusCode(500, new ApiResponse<MediaStreamInfo>
                {
                    Success = false,
                    Message = "Failed to get media stream info"
                });
            }
        }

        /// <summary>
        /// Update media stream information
        /// </summary>
        [HttpPut("call/{callId}/media")]
        public async Task<ActionResult<ApiResponse<object>>> UpdateMediaStreamInfo(string callId, [FromBody] MediaStreamInfo streamInfo)
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

                // Update user's media stream info
                streamInfo.UserId = userId;
                var success = await _webRTCService.UpdateMediaStreamInfoAsync(callId, userId, streamInfo);
                if (!success)
                {
                    return BadRequest(new ApiResponse<object>
                    {
                        Success = false,
                        Message = "Failed to update media stream info"
                    });
                }

                _logger.LogInformation($"Media stream info updated for user {userId} in call {callId}");

                return Ok(new ApiResponse<object>
                {
                    Success = true,
                    Message = "Media stream info updated successfully"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error updating media stream info for call {callId}");
                return StatusCode(500, new ApiResponse<object>
                {
                    Success = false,
                    Message = "Failed to update media stream info"
                });
            }
        }

        /// <summary>
        /// Send call statistics
        /// </summary>
        [HttpPost("call/{callId}/stats")]
        public async Task<ActionResult<ApiResponse<object>>> SendCallStats(string callId, [FromBody] WebRTCStats stats)
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

                // Update call quality with stats
                await _webRTCService.UpdateCallQualityAsync(callId, userId, stats);

                _logger.LogDebug($"Call stats received from user {userId} for call {callId}");

                return Ok(new ApiResponse<object>
                {
                    Success = true,
                    Message = "Call stats received successfully"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error processing call stats for call {callId}");
                return StatusCode(500, new ApiResponse<object>
                {
                    Success = false,
                    Message = "Failed to process call stats"
                });
            }
        }

        /// <summary>
        /// Get STUN servers
        /// </summary>
        [HttpGet("stun-servers")]
        public async Task<ActionResult<ApiResponse<List<IceServerConfig>>>> GetStunServers()
        {
            try
            {
                var stunServers = await _webRTCService.GetStunServersAsync();

                return Ok(new ApiResponse<List<IceServerConfig>>
                {
                    Success = true,
                    Data = stunServers,
                    Message = $"Retrieved {stunServers.Count} STUN servers"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting STUN servers");
                return StatusCode(500, new ApiResponse<List<IceServerConfig>>
                {
                    Success = false,
                    Message = "Failed to get STUN servers"
                });
            }
        }

        /// <summary>
        /// Get TURN servers
        /// </summary>
        [HttpGet("turn-servers")]
        public async Task<ActionResult<ApiResponse<List<IceServerConfig>>>> GetTurnServers()
        {
            try
            {
                var turnServers = await _webRTCService.GetTurnServersAsync();

                return Ok(new ApiResponse<List<IceServerConfig>>
                {
                    Success = true,
                    Data = turnServers,
                    Message = $"Retrieved {turnServers.Count} TURN servers"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting TURN servers");
                return StatusCode(500, new ApiResponse<List<IceServerConfig>>
                {
                    Success = false,
                    Message = "Failed to get TURN servers"
                });
            }
        }

        private string? GetUserId()
        {
            return User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        }
    }
}
