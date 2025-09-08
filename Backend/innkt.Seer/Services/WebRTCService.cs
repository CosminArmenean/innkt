using innkt.Seer.Models;
using Microsoft.Extensions.Logging;
using StackExchange.Redis;
using System.Text.Json;

namespace innkt.Seer.Services
{
    public class WebRTCService
    {
        private readonly ILogger<WebRTCService> _logger;
        private readonly IDatabase _redis;
        private readonly IConnectionMultiplexer _redisConnection;
        private readonly CallManagementService _callManagementService;

        private const string ICE_SERVERS_KEY = "webrtc:ice_servers";
        private const string CALL_QUALITY_PREFIX = "call:quality:";
        private const string STUN_SERVERS_KEY = "webrtc:stun_servers";

        public WebRTCService(
            ILogger<WebRTCService> logger,
            IConnectionMultiplexer redisConnection,
            CallManagementService callManagementService)
        {
            _logger = logger;
            _redisConnection = redisConnection;
            _redis = redisConnection.GetDatabase();
            _callManagementService = callManagementService;
        }

        public async Task<WebRTCConfiguration> GetWebRTCConfigurationAsync()
        {
            try
            {
                var configuration = new WebRTCConfiguration();

                // Get STUN servers
                var stunServers = await GetStunServersAsync();
                configuration.IceServers.AddRange(stunServers);

                // Get TURN servers (if configured)
                var turnServers = await GetTurnServersAsync();
                configuration.IceServers.AddRange(turnServers);

                _logger.LogDebug("WebRTC configuration retrieved successfully");
                return configuration;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting WebRTC configuration");
                return new WebRTCConfiguration();
            }
        }

        public async Task<List<IceServerConfig>> GetStunServersAsync()
        {
            try
            {
                var stunServersJson = await _redis.StringGetAsync(STUN_SERVERS_KEY);
                if (stunServersJson.HasValue)
                {
                    var servers = JsonSerializer.Deserialize<List<IceServerConfig>>(stunServersJson);
                    if (servers != null)
                    {
                        return servers;
                    }
                }

                // Default STUN servers
                return new List<IceServerConfig>
                {
                    new IceServerConfig
                    {
                        Urls = new List<string> { "stun:stun.l.google.com:19302" }
                    },
                    new IceServerConfig
                    {
                        Urls = new List<string> { "stun:stun1.l.google.com:19302" }
                    },
                    new IceServerConfig
                    {
                        Urls = new List<string> { "stun:stun2.l.google.com:19302" }
                    }
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting STUN servers");
                return new List<IceServerConfig>();
            }
        }

        public async Task<List<IceServerConfig>> GetTurnServersAsync()
        {
            try
            {
                // For production, you would configure TURN servers here
                // For now, return empty list (STUN only)
                return new List<IceServerConfig>();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting TURN servers");
                return new List<IceServerConfig>();
            }
        }

        public async Task UpdateCallQualityAsync(string callId, string userId, WebRTCStats stats)
        {
            try
            {
                var quality = new ParticipantQuality
                {
                    Latency = stats.Latency,
                    PacketLoss = stats.PacketLoss,
                    Jitter = stats.Jitter,
                    Bitrate = stats.Bitrate,
                    Quality = DetermineQualityLevel(stats),
                    LastUpdated = DateTime.UtcNow
                };

                var qualityJson = JsonSerializer.Serialize(quality);
                await _redis.StringSetAsync($"{CALL_QUALITY_PREFIX}{callId}:{userId}", qualityJson, TimeSpan.FromMinutes(5));

                _logger.LogDebug($"Call quality updated for user {userId} in call {callId}: {quality.Quality}");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error updating call quality for user {userId} in call {callId}");
            }
        }

        public async Task<ParticipantQuality?> GetParticipantQualityAsync(string callId, string userId)
        {
            try
            {
                var qualityJson = await _redis.StringGetAsync($"{CALL_QUALITY_PREFIX}{callId}:{userId}");
                if (!qualityJson.HasValue)
                {
                    return null;
                }

                return JsonSerializer.Deserialize<ParticipantQuality>(qualityJson);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error getting participant quality for user {userId} in call {callId}");
                return null;
            }
        }

        public async Task<CallQuality> GetCallQualityAsync(string callId)
        {
            try
            {
                var server = _redisConnection.GetServer(_redisConnection.GetEndPoints().First());
                var qualityKeys = server.Keys(pattern: $"{CALL_QUALITY_PREFIX}{callId}:*");

                var qualities = new List<ParticipantQuality>();
                foreach (var key in qualityKeys)
                {
                    var qualityJson = await _redis.StringGetAsync(key);
                    if (qualityJson.HasValue)
                    {
                        var quality = JsonSerializer.Deserialize<ParticipantQuality>(qualityJson);
                        if (quality != null)
                        {
                            qualities.Add(quality);
                        }
                    }
                }

                if (!qualities.Any())
                {
                    return new CallQuality
                    {
                        OverallQuality = QualityLevel.Poor,
                        LastUpdated = DateTime.UtcNow
                    };
                }

                var callQuality = new CallQuality
                {
                    AverageLatency = qualities.Average(q => q.Latency),
                    PacketLoss = qualities.Average(q => q.PacketLoss),
                    Jitter = qualities.Average(q => q.Jitter),
                    Bitrate = (int)qualities.Average(q => q.Bitrate),
                    OverallQuality = DetermineOverallQuality(qualities),
                    LastUpdated = DateTime.UtcNow
                };

                return callQuality;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error getting call quality for call {callId}");
                return new CallQuality
                {
                    OverallQuality = QualityLevel.Poor,
                    LastUpdated = DateTime.UtcNow
                };
            }
        }

        public async Task<bool> ValidateWebRTCConfigurationAsync(WebRTCConfiguration configuration)
        {
            try
            {
                // Validate ICE servers
                if (configuration.IceServers == null || !configuration.IceServers.Any())
                {
                    _logger.LogWarning("No ICE servers configured");
                    return false;
                }

                // Validate STUN/TURN server URLs
                foreach (var server in configuration.IceServers)
                {
                    if (server.Urls == null || !server.Urls.Any())
                    {
                        _logger.LogWarning("ICE server has no URLs");
                        return false;
                    }

                    foreach (var url in server.Urls)
                    {
                        if (!IsValidIceServerUrl(url))
                        {
                            _logger.LogWarning($"Invalid ICE server URL: {url}");
                            return false;
                        }
                    }
                }

                _logger.LogDebug("WebRTC configuration validation successful");
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error validating WebRTC configuration");
                return false;
            }
        }

        public async Task<MediaStreamInfo> GetMediaStreamInfoAsync(string callId, string userId)
        {
            try
            {
                var call = await _callManagementService.GetCallAsync(callId);
                if (call == null)
                {
                    return new MediaStreamInfo();
                }

                var participant = call.Participants.FirstOrDefault(p => p.UserId == userId);
                if (participant == null)
                {
                    return new MediaStreamInfo();
                }

                return new MediaStreamInfo
                {
                    UserId = userId,
                    HasAudio = !participant.IsMuted,
                    HasVideo = participant.IsVideoEnabled,
                    IsMuted = participant.IsMuted,
                    IsVideoEnabled = participant.IsVideoEnabled,
                    IsScreenSharing = participant.IsScreenSharing,
                    VideoQuality = call.Settings.VideoQuality,
                    AudioQuality = call.Settings.AudioQuality
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error getting media stream info for user {userId} in call {callId}");
                return new MediaStreamInfo();
            }
        }

        public async Task<bool> UpdateMediaStreamInfoAsync(string callId, string userId, MediaStreamInfo streamInfo)
        {
            try
            {
                var call = await _callManagementService.GetCallAsync(callId);
                if (call == null)
                {
                    return false;
                }

                var participant = call.Participants.FirstOrDefault(p => p.UserId == userId);
                if (participant == null)
                {
                    return false;
                }

                // Update participant media state
                await _callManagementService.UpdateParticipantMediaAsync(
                    callId, 
                    userId, 
                    streamInfo.IsMuted, 
                    streamInfo.IsVideoEnabled, 
                    streamInfo.IsScreenSharing);

                _logger.LogDebug($"Media stream info updated for user {userId} in call {callId}");
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error updating media stream info for user {userId} in call {callId}");
                return false;
            }
        }

        private QualityLevel DetermineQualityLevel(WebRTCStats stats)
        {
            // Quality determination based on WebRTC stats
            if (stats.Latency < 100 && stats.PacketLoss < 1 && stats.Jitter < 20)
            {
                return QualityLevel.Excellent;
            }
            else if (stats.Latency < 200 && stats.PacketLoss < 3 && stats.Jitter < 50)
            {
                return QualityLevel.Good;
            }
            else if (stats.Latency < 500 && stats.PacketLoss < 5 && stats.Jitter < 100)
            {
                return QualityLevel.Fair;
            }
            else
            {
                return QualityLevel.Poor;
            }
        }

        private QualityLevel DetermineOverallQuality(List<ParticipantQuality> qualities)
        {
            if (!qualities.Any())
            {
                return QualityLevel.Poor;
            }

            var averageQuality = qualities.Average(q => (int)q.Quality);
            return (QualityLevel)Math.Round(averageQuality);
        }

        private bool IsValidIceServerUrl(string url)
        {
            if (string.IsNullOrEmpty(url))
            {
                return false;
            }

            // Check for valid STUN/TURN URL format
            return url.StartsWith("stun:") || url.StartsWith("turn:") || url.StartsWith("turns:");
        }

        private async Task<Call?> GetCallAsync(string callId)
        {
            return await _callManagementService.GetCallAsync(callId);
        }
    }
}
