using innkt.Seer.Models;
using innkt.Common.Models;
using Microsoft.Extensions.Logging;
using StackExchange.Redis;
using System.Text.Json;

namespace innkt.Seer.Services
{
    public class CallManagementService
    {
        private readonly ILogger<CallManagementService> _logger;
        private readonly IDatabase _redis;
        private readonly IConnectionMultiplexer _redisConnection;
        private readonly CallEventService _callEventService;

        private const string CALL_PREFIX = "call:";
        private const string USER_CALLS_PREFIX = "user:calls:";
        private const string ACTIVE_CALLS_KEY = "active_calls";
        private const int CALL_EXPIRY_MINUTES = 60;

        public CallManagementService(
            ILogger<CallManagementService> logger,
            IConnectionMultiplexer redisConnection,
            CallEventService callEventService)
        {
            _logger = logger;
            _redisConnection = redisConnection;
            _redis = redisConnection.GetDatabase();
            _callEventService = callEventService;
        }

        public async Task<Call> CreateCallAsync(string callerId, string calleeId, CallType type, string? conversationId = null)
        {
            try
            {
                var call = new Call
                {
                    Id = Guid.NewGuid().ToString(),
                    CallerId = callerId,
                    CalleeId = calleeId,
                    Type = type,
                    Status = CallStatus.Initiated,
                    ConversationId = conversationId,
                    CreatedAt = DateTime.UtcNow,
                    RoomId = GenerateRoomId()
                };

                // Add participants
                call.Participants.Add(new CallParticipant
                {
                    CallId = call.Id,
                    UserId = callerId,
                    Role = ParticipantRole.Host,
                    Status = ParticipantStatus.Connected,
                    JoinedAt = DateTime.UtcNow
                });

                call.Participants.Add(new CallParticipant
                {
                    CallId = call.Id,
                    UserId = calleeId,
                    Role = ParticipantRole.Participant,
                    Status = ParticipantStatus.Invited
                });

                // Store call in Redis
                await StoreCallAsync(call);

                // Add to active calls
                await _redis.SetAddAsync(ACTIVE_CALLS_KEY, call.Id);

                // Add to user's call lists
                await _redis.SetAddAsync($"{USER_CALLS_PREFIX}{callerId}", call.Id);
                await _redis.SetAddAsync($"{USER_CALLS_PREFIX}{calleeId}", call.Id);

                // Log call creation event
                await _callEventService.LogEventAsync(call.Id, callerId, CallEventType.CallStarted, new Dictionary<string, object>
                {
                    ["type"] = type.ToString(),
                    ["calleeId"] = calleeId
                });

                _logger.LogInformation($"Call created: {call.Id} from {callerId} to {calleeId}");

                return call;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error creating call from {callerId} to {calleeId}");
                throw;
            }
        }

        public async Task<Call?> GetCallAsync(string callId)
        {
            try
            {
                var callJson = await _redis.StringGetAsync($"{CALL_PREFIX}{callId}");
                if (!callJson.HasValue)
                {
                    return null;
                }

                return JsonSerializer.Deserialize<Call>(callJson);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error getting call {callId}");
                return null;
            }
        }

        public async Task<bool> UpdateCallStatusAsync(string callId, CallStatus status)
        {
            try
            {
                var call = await GetCallAsync(callId);
                if (call == null)
                {
                    return false;
                }

                var oldStatus = call.Status;
                call.Status = status;

                // Update timestamps based on status
                switch (status)
                {
                    case CallStatus.Active:
                        call.StartedAt = DateTime.UtcNow;
                        break;
                    case CallStatus.Ended:
                    case CallStatus.Declined:
                    case CallStatus.Missed:
                    case CallStatus.Failed:
                        call.EndedAt = DateTime.UtcNow;
                        break;
                }

                await StoreCallAsync(call);

                // Log status change event
                await _callEventService.LogEventAsync(callId, call.CallerId, CallEventType.CallStarted, new Dictionary<string, object>
                {
                    ["oldStatus"] = oldStatus.ToString(),
                    ["newStatus"] = status.ToString()
                });

                _logger.LogInformation($"Call {callId} status updated from {oldStatus} to {status}");

                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error updating call {callId} status to {status}");
                return false;
            }
        }

        public async Task<bool> AddParticipantAsync(string callId, string userId, ParticipantRole role = ParticipantRole.Participant)
        {
            try
            {
                var call = await GetCallAsync(callId);
                if (call == null)
                {
                    return false;
                }

                // Check if participant already exists
                if (call.Participants.Any(p => p.UserId == userId))
                {
                    return true;
                }

                // Check participant limit
                if (call.Participants.Count >= call.Settings.MaxParticipants)
                {
                    _logger.LogWarning($"Call {callId} has reached maximum participants limit");
                    return false;
                }

                var participant = new CallParticipant
                {
                    CallId = callId,
                    UserId = userId,
                    Role = role,
                    Status = ParticipantStatus.Invited,
                    JoinedAt = DateTime.UtcNow
                };

                call.Participants.Add(participant);
                await StoreCallAsync(call);

                // Add to user's call list
                await _redis.SetAddAsync($"{USER_CALLS_PREFIX}{userId}", callId);

                // Log participant added event
                await _callEventService.LogEventAsync(callId, userId, CallEventType.ParticipantJoined, new Dictionary<string, object>
                {
                    ["role"] = role.ToString()
                });

                _logger.LogInformation($"Participant {userId} added to call {callId}");

                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error adding participant {userId} to call {callId}");
                return false;
            }
        }

        public async Task<bool> RemoveParticipantAsync(string callId, string userId)
        {
            try
            {
                var call = await GetCallAsync(callId);
                if (call == null)
                {
                    return false;
                }

                var participant = call.Participants.FirstOrDefault(p => p.UserId == userId);
                if (participant == null)
                {
                    return false;
                }

                participant.Status = ParticipantStatus.Left;
                participant.LeftAt = DateTime.UtcNow;

                await StoreCallAsync(call);

                // Remove from user's call list
                await _redis.SetRemoveAsync($"{USER_CALLS_PREFIX}{userId}", callId);

                // Log participant left event
                await _callEventService.LogEventAsync(callId, userId, CallEventType.ParticipantLeft, new Dictionary<string, object>());

                _logger.LogInformation($"Participant {userId} removed from call {callId}");

                // If no participants left, end the call
                var activeParticipants = call.Participants.Count(p => p.Status == ParticipantStatus.Connected);
                if (activeParticipants == 0)
                {
                    await UpdateCallStatusAsync(callId, CallStatus.Ended);
                }

                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error removing participant {userId} from call {callId}");
                return false;
            }
        }

        public async Task<bool> UpdateParticipantStatusAsync(string callId, string userId, ParticipantStatus status)
        {
            try
            {
                var call = await GetCallAsync(callId);
                if (call == null)
                {
                    return false;
                }

                var participant = call.Participants.FirstOrDefault(p => p.UserId == userId);
                if (participant == null)
                {
                    return false;
                }

                var oldStatus = participant.Status;
                participant.Status = status;

                if (status == ParticipantStatus.Connected)
                {
                    participant.JoinedAt = DateTime.UtcNow;
                }
                else if (status == ParticipantStatus.Left)
                {
                    participant.LeftAt = DateTime.UtcNow;
                }

                await StoreCallAsync(call);

                _logger.LogInformation($"Participant {userId} status updated from {oldStatus} to {status} in call {callId}");

                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error updating participant {userId} status in call {callId}");
                return false;
            }
        }

        public async Task<bool> UpdateParticipantMediaAsync(string callId, string userId, bool? isMuted = null, bool? isVideoEnabled = null, bool? isScreenSharing = null)
        {
            try
            {
                var call = await GetCallAsync(callId);
                if (call == null)
                {
                    return false;
                }

                var participant = call.Participants.FirstOrDefault(p => p.UserId == userId);
                if (participant == null)
                {
                    return false;
                }

                var changes = new List<string>();

                if (isMuted.HasValue && participant.IsMuted != isMuted.Value)
                {
                    participant.IsMuted = isMuted.Value;
                    changes.Add($"muted: {isMuted.Value}");
                }

                if (isVideoEnabled.HasValue && participant.IsVideoEnabled != isVideoEnabled.Value)
                {
                    participant.IsVideoEnabled = isVideoEnabled.Value;
                    changes.Add($"video: {isVideoEnabled.Value}");
                }

                if (isScreenSharing.HasValue && participant.IsScreenSharing != isScreenSharing.Value)
                {
                    participant.IsScreenSharing = isScreenSharing.Value;
                    changes.Add($"screenShare: {isScreenSharing.Value}");
                }

                if (changes.Any())
                {
                    await StoreCallAsync(call);

                    // Log media change events
                    foreach (var change in changes)
                    {
                        var eventType = change.Contains("muted") 
                            ? (participant.IsMuted ? CallEventType.ParticipantMuted : CallEventType.ParticipantUnmuted)
                            : change.Contains("video")
                            ? (participant.IsVideoEnabled ? CallEventType.VideoEnabled : CallEventType.VideoDisabled)
                            : change.Contains("screenShare")
                            ? (participant.IsScreenSharing ? CallEventType.ScreenShareStarted : CallEventType.ScreenShareStopped)
                            : CallEventType.QualityChanged;

                        await _callEventService.LogEventAsync(callId, userId, eventType, new Dictionary<string, object>
                        {
                            ["change"] = change
                        });
                    }

                    _logger.LogInformation($"Participant {userId} media updated in call {callId}: {string.Join(", ", changes)}");
                }

                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error updating participant {userId} media in call {callId}");
                return false;
            }
        }

        public async Task<List<Call>> GetUserCallsAsync(string userId, int limit = 50)
        {
            try
            {
                var callIds = await _redis.SetMembersAsync($"{USER_CALLS_PREFIX}{userId}");
                var calls = new List<Call>();

                foreach (var callId in callIds.Take(limit))
                {
                    var call = await GetCallAsync(callId);
                    if (call != null)
                    {
                        calls.Add(call);
                    }
                }

                return calls.OrderByDescending(c => c.CreatedAt).ToList();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error getting calls for user {userId}");
                return new List<Call>();
            }
        }

        public async Task<List<Call>> GetActiveCallsAsync()
        {
            try
            {
                var callIds = await _redis.SetMembersAsync(ACTIVE_CALLS_KEY);
                var calls = new List<Call>();

                foreach (var callId in callIds)
                {
                    var call = await GetCallAsync(callId);
                    if (call != null && call.Status == CallStatus.Active)
                    {
                        calls.Add(call);
                    }
                }

                return calls;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting active calls");
                return new List<Call>();
            }
        }

        public async Task<bool> EndCallAsync(string callId, string endedByUserId)
        {
            try
            {
                var call = await GetCallAsync(callId);
                if (call == null)
                {
                    return false;
                }

                call.Status = CallStatus.Ended;
                call.EndedAt = DateTime.UtcNow;

                // Update all participants to left status
                foreach (var participant in call.Participants.Where(p => p.Status == ParticipantStatus.Connected))
                {
                    participant.Status = ParticipantStatus.Left;
                    participant.LeftAt = DateTime.UtcNow;
                }

                await StoreCallAsync(call);

                // Remove from active calls
                await _redis.SetRemoveAsync(ACTIVE_CALLS_KEY, callId);

                // Log call ended event
                await _callEventService.LogEventAsync(callId, endedByUserId, CallEventType.CallEnded, new Dictionary<string, object>
                {
                    ["duration"] = call.Duration?.TotalSeconds ?? 0,
                    ["endedBy"] = endedByUserId
                });

                _logger.LogInformation($"Call {callId} ended by {endedByUserId}");

                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error ending call {callId}");
                return false;
            }
        }

        private async Task StoreCallAsync(Call call)
        {
            var callJson = JsonSerializer.Serialize(call);
            await _redis.StringSetAsync($"{CALL_PREFIX}{call.Id}", callJson, TimeSpan.FromMinutes(CALL_EXPIRY_MINUTES));
        }

        private string GenerateRoomId()
        {
            return $"room_{Guid.NewGuid().ToString("N")[..8]}";
        }
    }
}
