using innkt.Seer.Models;
using Microsoft.Extensions.Logging;
using StackExchange.Redis;
using System.Text.Json;

namespace innkt.Seer.Services
{
    public class CallEventService
    {
        private readonly ILogger<CallEventService> _logger;
        private readonly IDatabase _redis;
        private readonly IConnectionMultiplexer _redisConnection;

        private const string CALL_EVENTS_PREFIX = "call:events:";
        private const string USER_EVENTS_PREFIX = "user:events:";
        private const int EVENT_EXPIRY_HOURS = 24;

        public CallEventService(
            ILogger<CallEventService> logger,
            IConnectionMultiplexer redisConnection)
        {
            _logger = logger;
            _redisConnection = redisConnection;
            _redis = redisConnection.GetDatabase();
        }

        public async Task LogEventAsync(string callId, string userId, CallEventType eventType, Dictionary<string, object> data)
        {
            try
            {
                var callEvent = new CallEvent
                {
                    Id = Guid.NewGuid().ToString(),
                    CallId = callId,
                    UserId = userId,
                    Type = eventType,
                    Timestamp = DateTime.UtcNow,
                    Data = data
                };

                var eventJson = JsonSerializer.Serialize(callEvent);

                // Store event in call events list
                await _redis.ListLeftPushAsync($"{CALL_EVENTS_PREFIX}{callId}", eventJson);

                // Store event in user events list
                await _redis.ListLeftPushAsync($"{USER_EVENTS_PREFIX}{userId}", eventJson);

                // Set expiry for both lists
                await _redis.KeyExpireAsync($"{CALL_EVENTS_PREFIX}{callId}", TimeSpan.FromHours(EVENT_EXPIRY_HOURS));
                await _redis.KeyExpireAsync($"{USER_EVENTS_PREFIX}{userId}", TimeSpan.FromHours(EVENT_EXPIRY_HOURS));

                _logger.LogDebug($"Call event logged: {eventType} for call {callId} by user {userId}");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error logging call event {eventType} for call {callId}");
            }
        }

        public async Task<List<CallEvent>> GetCallEventsAsync(string callId, int limit = 100)
        {
            try
            {
                var eventJsons = await _redis.ListRangeAsync($"{CALL_EVENTS_PREFIX}{callId}", 0, limit - 1);
                var events = new List<CallEvent>();

                foreach (var eventJson in eventJsons)
                {
                    try
                    {
                        var callEvent = JsonSerializer.Deserialize<CallEvent>(eventJson);
                        if (callEvent != null)
                        {
                            events.Add(callEvent);
                        }
                    }
                    catch (JsonException ex)
                    {
                        _logger.LogWarning(ex, $"Failed to deserialize call event: {eventJson}");
                    }
                }

                return events.OrderBy(e => e.Timestamp).ToList();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error getting events for call {callId}");
                return new List<CallEvent>();
            }
        }

        public async Task<List<CallEvent>> GetUserEventsAsync(string userId, int limit = 100)
        {
            try
            {
                var eventJsons = await _redis.ListRangeAsync($"{USER_EVENTS_PREFIX}{userId}", 0, limit - 1);
                var events = new List<CallEvent>();

                foreach (var eventJson in eventJsons)
                {
                    try
                    {
                        var callEvent = JsonSerializer.Deserialize<CallEvent>(eventJson);
                        if (callEvent != null)
                        {
                            events.Add(callEvent);
                        }
                    }
                    catch (JsonException ex)
                    {
                        _logger.LogWarning(ex, $"Failed to deserialize user event: {eventJson}");
                    }
                }

                return events.OrderByDescending(e => e.Timestamp).ToList();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error getting events for user {userId}");
                return new List<CallEvent>();
            }
        }

        public async Task<List<CallEvent>> GetEventsByTypeAsync(CallEventType eventType, int limit = 100)
        {
            try
            {
                var events = new List<CallEvent>();
                var server = _redisConnection.GetServer(_redisConnection.GetEndPoints().First());
                var keys = server.Keys(pattern: $"{CALL_EVENTS_PREFIX}*");

                foreach (var key in keys.Take(limit))
                {
                    var eventJsons = await _redis.ListRangeAsync(key, 0, 50);
                    
                    foreach (var eventJson in eventJsons)
                    {
                        try
                        {
                            var callEvent = JsonSerializer.Deserialize<CallEvent>(eventJson);
                            if (callEvent != null && callEvent.Type == eventType)
                            {
                                events.Add(callEvent);
                            }
                        }
                        catch (JsonException ex)
                        {
                            _logger.LogWarning(ex, $"Failed to deserialize event: {eventJson}");
                        }
                    }
                }

                return events.OrderByDescending(e => e.Timestamp).Take(limit).ToList();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error getting events by type {eventType}");
                return new List<CallEvent>();
            }
        }

        public async Task<Dictionary<string, int>> GetEventStatisticsAsync(string callId)
        {
            try
            {
                var events = await GetCallEventsAsync(callId);
                var stats = new Dictionary<string, int>();

                foreach (var eventType in Enum.GetValues<CallEventType>())
                {
                    stats[eventType.ToString()] = events.Count(e => e.Type == eventType);
                }

                return stats;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error getting event statistics for call {callId}");
                return new Dictionary<string, int>();
            }
        }

        public async Task<Dictionary<string, int>> GetUserEventStatisticsAsync(string userId, DateTime? fromDate = null, DateTime? toDate = null)
        {
            try
            {
                var events = await GetUserEventsAsync(userId);
                
                if (fromDate.HasValue)
                {
                    events = events.Where(e => e.Timestamp >= fromDate.Value).ToList();
                }
                
                if (toDate.HasValue)
                {
                    events = events.Where(e => e.Timestamp <= toDate.Value).ToList();
                }

                var stats = new Dictionary<string, int>();

                foreach (var eventType in Enum.GetValues<CallEventType>())
                {
                    stats[eventType.ToString()] = events.Count(e => e.Type == eventType);
                }

                return stats;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error getting user event statistics for user {userId}");
                return new Dictionary<string, int>();
            }
        }

        public async Task CleanupOldEventsAsync()
        {
            try
            {
                var server = _redisConnection.GetServer(_redisConnection.GetEndPoints().First());
                var callEventKeys = server.Keys(pattern: $"{CALL_EVENTS_PREFIX}*");
                var userEventKeys = server.Keys(pattern: $"{USER_EVENTS_PREFIX}*");

                var tasks = new List<Task>();

                // Clean up call events
                foreach (var key in callEventKeys)
                {
                    tasks.Add(_redis.KeyExpireAsync(key, TimeSpan.FromHours(EVENT_EXPIRY_HOURS)));
                }

                // Clean up user events
                foreach (var key in userEventKeys)
                {
                    tasks.Add(_redis.KeyExpireAsync(key, TimeSpan.FromHours(EVENT_EXPIRY_HOURS)));
                }

                await Task.WhenAll(tasks);

                _logger.LogInformation($"Cleaned up {callEventKeys.Count() + userEventKeys.Count()} event keys");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error cleaning up old events");
            }
        }
    }
}
