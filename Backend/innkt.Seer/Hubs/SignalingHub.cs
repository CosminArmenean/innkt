using Microsoft.AspNetCore.SignalR;
using Microsoft.AspNetCore.Authorization;
using innkt.Seer.Models;
using innkt.Seer.Services;
using System.Security.Claims;
using System.Text.Json;

namespace innkt.Seer.Hubs
{
    [Authorize]
    public class SignalingHub : Hub
    {
        private readonly ILogger<SignalingHub> _logger;
        private readonly CallManagementService _callManagementService;
        private readonly CallEventService _callEventService;
        private readonly WebRTCService _webRTCService;

        public SignalingHub(
            ILogger<SignalingHub> logger,
            CallManagementService callManagementService,
            CallEventService callEventService,
            WebRTCService webRTCService)
        {
            _logger = logger;
            _callManagementService = callManagementService;
            _callEventService = callEventService;
            _webRTCService = webRTCService;
        }

        public override async Task OnConnectedAsync()
        {
            var userId = GetUserId();
            if (string.IsNullOrEmpty(userId))
            {
                Context.Abort();
                return;
            }

            // Add user to their personal group
            await Groups.AddToGroupAsync(Context.ConnectionId, $"user_{userId}");
            
            // Update user's connection ID in active calls
            await UpdateUserConnectionInActiveCalls(userId, Context.ConnectionId);

            _logger.LogInformation($"User {userId} connected to signaling hub with connection {Context.ConnectionId} and added to group user_{userId}");
            await base.OnConnectedAsync();
        }

        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            var userId = GetUserId();
            if (!string.IsNullOrEmpty(userId))
            {
                // Remove user from their personal group
                await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"user_{userId}");
                
                // Handle disconnection from active calls
                await HandleUserDisconnection(userId);

                _logger.LogInformation($"User {userId} disconnected from signaling hub");
            }

            await base.OnDisconnectedAsync(exception);
        }

        // WebRTC Signaling Methods
        public async Task SendOffer(string callId, string toUserId, string sdp)
        {
            try
            {
                var fromUserId = GetUserId();
                if (string.IsNullOrEmpty(fromUserId))
                {
                    await Clients.Caller.SendAsync("Error", "Unauthorized");
                    return;
                }

                var call = await _callManagementService.GetCallAsync(callId);
                if (call == null)
                {
                    await Clients.Caller.SendAsync("Error", "Call not found");
                    return;
                }

                // Verify user is part of the call
                if (!call.Participants.Any(p => p.UserId == fromUserId))
                {
                    await Clients.Caller.SendAsync("Error", "Not authorized for this call");
                    return;
                }

                var offer = new WebRTCOffer
                {
                    CallId = callId,
                    FromUserId = fromUserId,
                    ToUserId = toUserId,
                    Sdp = sdp,
                    Type = RTCSessionDescriptionInit.Offer
                };

                // Send offer to target user
                await Clients.Group($"user_{toUserId}").SendAsync("ReceiveOffer", offer);

                _logger.LogDebug($"WebRTC offer sent from {fromUserId} to {toUserId} for call {callId}");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error sending WebRTC offer for call {callId}");
                await Clients.Caller.SendAsync("Error", "Failed to send offer");
            }
        }

        public async Task SendAnswer(string callId, string toUserId, string sdp)
        {
            try
            {
                var fromUserId = GetUserId();
                if (string.IsNullOrEmpty(fromUserId))
                {
                    await Clients.Caller.SendAsync("Error", "Unauthorized");
                    return;
                }

                var call = await _callManagementService.GetCallAsync(callId);
                if (call == null)
                {
                    await Clients.Caller.SendAsync("Error", "Call not found");
                    return;
                }

                // Verify user is part of the call
                if (!call.Participants.Any(p => p.UserId == fromUserId))
                {
                    await Clients.Caller.SendAsync("Error", "Not authorized for this call");
                    return;
                }

                var answer = new WebRTCAnswer
                {
                    CallId = callId,
                    FromUserId = fromUserId,
                    ToUserId = toUserId,
                    Sdp = sdp,
                    Type = RTCSessionDescriptionInit.Answer
                };

                // Send answer to target user
                await Clients.Group($"user_{toUserId}").SendAsync("ReceiveAnswer", answer);

                _logger.LogDebug($"WebRTC answer sent from {fromUserId} to {toUserId} for call {callId}");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error sending WebRTC answer for call {callId}");
                await Clients.Caller.SendAsync("Error", "Failed to send answer");
            }
        }

        public async Task SendIceCandidate(string callId, string toUserId, string candidate, string sdpMid, int sdpMLineIndex)
        {
            try
            {
                var fromUserId = GetUserId();
                if (string.IsNullOrEmpty(fromUserId))
                {
                    await Clients.Caller.SendAsync("Error", "Unauthorized");
                    return;
                }

                var call = await _callManagementService.GetCallAsync(callId);
                if (call == null)
                {
                    await Clients.Caller.SendAsync("Error", "Call not found");
                    return;
                }

                // Verify user is part of the call
                if (!call.Participants.Any(p => p.UserId == fromUserId))
                {
                    await Clients.Caller.SendAsync("Error", "Not authorized for this call");
                    return;
                }

                var iceCandidate = new WebRTCIceCandidate
                {
                    CallId = callId,
                    FromUserId = fromUserId,
                    ToUserId = toUserId,
                    Candidate = candidate,
                    SdpMid = sdpMid,
                    SdpMLineIndex = sdpMLineIndex
                };

                // Send ICE candidate to target user
                await Clients.Group($"user_{toUserId}").SendAsync("ReceiveIceCandidate", iceCandidate);

                _logger.LogDebug($"ICE candidate sent from {fromUserId} to {toUserId} for call {callId}");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error sending ICE candidate for call {callId}");
                await Clients.Caller.SendAsync("Error", "Failed to send ICE candidate");
            }
        }

        // Call Management Methods
        public async Task JoinCall(string callId)
        {
            try
            {
                var userId = GetUserId();
                if (string.IsNullOrEmpty(userId))
                {
                    await Clients.Caller.SendAsync("Error", "Unauthorized");
                    return;
                }

                var call = await _callManagementService.GetCallAsync(callId);
                if (call == null)
                {
                    await Clients.Caller.SendAsync("Error", "Call not found");
                    return;
                }

                // Check if user is invited to the call
                var participant = call.Participants.FirstOrDefault(p => p.UserId == userId);
                if (participant == null)
                {
                    await Clients.Caller.SendAsync("Error", "Not invited to this call");
                    return;
                }

                // Update participant status
                await _callManagementService.UpdateParticipantStatusAsync(callId, userId, ParticipantStatus.Connected);

                // Add user to call group
                await Groups.AddToGroupAsync(Context.ConnectionId, $"call_{callId}");

                // Update connection ID
                participant.ConnectionId = Context.ConnectionId;
                await _callManagementService.UpdateParticipantStatusAsync(callId, userId, ParticipantStatus.Connected);

                // Notify other participants
                await Clients.Group($"call_{callId}").SendAsync("ParticipantJoined", new
                {
                    CallId = callId,
                    UserId = userId,
                    Timestamp = DateTime.UtcNow
                });

                _logger.LogInformation($"User {userId} joined call {callId}");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error joining call {callId}");
                await Clients.Caller.SendAsync("Error", "Failed to join call");
            }
        }

        public async Task LeaveCall(string callId)
        {
            try
            {
                var userId = GetUserId();
                if (string.IsNullOrEmpty(userId))
                {
                    await Clients.Caller.SendAsync("Error", "Unauthorized");
                    return;
                }

                var call = await _callManagementService.GetCallAsync(callId);
                if (call == null)
                {
                    await Clients.Caller.SendAsync("Error", "Call not found");
                    return;
                }

                // Remove user from call group
                await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"call_{callId}");

                // Update participant status
                await _callManagementService.RemoveParticipantAsync(callId, userId);

                // Notify other participants
                await Clients.Group($"call_{callId}").SendAsync("ParticipantLeft", new
                {
                    CallId = callId,
                    UserId = userId,
                    Timestamp = DateTime.UtcNow
                });

                _logger.LogInformation($"User {userId} left call {callId}");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error leaving call {callId}");
                await Clients.Caller.SendAsync("Error", "Failed to leave call");
            }
        }

        public async Task UpdateMediaState(string callId, bool? isMuted = null, bool? isVideoEnabled = null, bool? isScreenSharing = null)
        {
            try
            {
                var userId = GetUserId();
                if (string.IsNullOrEmpty(userId))
                {
                    await Clients.Caller.SendAsync("Error", "Unauthorized");
                    return;
                }

                var call = await _callManagementService.GetCallAsync(callId);
                if (call == null)
                {
                    await Clients.Caller.SendAsync("Error", "Call not found");
                    return;
                }

                // Update participant media state
                await _callManagementService.UpdateParticipantMediaAsync(callId, userId, isMuted, isVideoEnabled, isScreenSharing);

                // Notify other participants
                await Clients.Group($"call_{callId}").SendAsync("MediaStateChanged", new
                {
                    CallId = callId,
                    UserId = userId,
                    IsMuted = isMuted,
                    IsVideoEnabled = isVideoEnabled,
                    IsScreenSharing = isScreenSharing,
                    Timestamp = DateTime.UtcNow
                });

                _logger.LogDebug($"Media state updated for user {userId} in call {callId}");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error updating media state for call {callId}");
                await Clients.Caller.SendAsync("Error", "Failed to update media state");
            }
        }

        public async Task SendCallStats(string callId, WebRTCStats stats)
        {
            try
            {
                var userId = GetUserId();
                if (string.IsNullOrEmpty(userId))
                {
                    return;
                }

                // Update call quality
                await _webRTCService.UpdateCallQualityAsync(callId, userId, stats);

                _logger.LogDebug($"Call stats received from user {userId} for call {callId}");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error processing call stats for call {callId}");
            }
        }

        // Utility Methods
        private string? GetUserId()
        {
            return Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        }

        private async Task UpdateUserConnectionInActiveCalls(string userId, string connectionId)
        {
            try
            {
                var activeCalls = await _callManagementService.GetActiveCallsAsync();
                foreach (var call in activeCalls)
                {
                    var participant = call.Participants.FirstOrDefault(p => p.UserId == userId);
                    if (participant != null)
                    {
                        participant.ConnectionId = connectionId;
                        await _callManagementService.UpdateParticipantStatusAsync(call.Id, userId, participant.Status);
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error updating connection for user {userId}");
            }
        }

        private async Task HandleUserDisconnection(string userId)
        {
            try
            {
                var activeCalls = await _callManagementService.GetActiveCallsAsync();
                foreach (var call in activeCalls)
                {
                    var participant = call.Participants.FirstOrDefault(p => p.UserId == userId && p.Status == ParticipantStatus.Connected);
                    if (participant != null)
                    {
                        // Notify other participants about disconnection
                        await Clients.Group($"call_{call.Id}").SendAsync("ParticipantDisconnected", new
                        {
                            CallId = call.Id,
                            UserId = userId,
                            Timestamp = DateTime.UtcNow
                        });

                        // Update participant status
                        await _callManagementService.UpdateParticipantStatusAsync(call.Id, userId, ParticipantStatus.Disconnected);
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error handling disconnection for user {userId}");
            }
        }
    }
}
