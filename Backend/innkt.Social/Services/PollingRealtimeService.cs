using MongoDB.Driver;
using System.Collections.Concurrent;
using System.Text.Json;
using innkt.Social.Data;
using innkt.Social.Models.MongoDB;
using innkt.Social.DTOs;
using Microsoft.EntityFrameworkCore;

namespace innkt.Social.Services;

/// <summary>
/// Polling-based real-time service as fallback when Change Streams are not available
/// Uses periodic polling to detect changes and trigger notifications
/// </summary>
public class PollingRealtimeService : IRealtimeService, IDisposable
{
    private readonly MongoDbContext _mongoContext;
    private readonly SocialDbContext _sqlContext;
    private readonly IOfficerService _officerService;
    private readonly ILogger<PollingRealtimeService> _logger;

    // Polling management
    private Timer? _pollingTimer;
    private CancellationTokenSource _pollingCancellation = new();
    private bool _isPollingActive = false;
    private readonly object _pollingLock = new object();

    // Client connection management (same as Change Stream version)
    private readonly ConcurrentDictionary<string, ClientConnection> _connections = new();
    private readonly ConcurrentDictionary<Guid, List<string>> _userConnections = new();
    private readonly object _connectionLock = new object();

    // Tracking last processed items
    private DateTime _lastPostCheck = DateTime.UtcNow.AddMinutes(-5);
    private DateTime _lastVoteCheck = DateTime.UtcNow.AddMinutes(-5);

    public bool IsChangeStreamActive => _isPollingActive;

    public PollingRealtimeService(
        MongoDbContext mongoContext,
        SocialDbContext sqlContext,
        IOfficerService officerService,
        ILogger<PollingRealtimeService> logger)
    {
        _mongoContext = mongoContext;
        _sqlContext = sqlContext;
        _officerService = officerService;
        _logger = logger;
    }

    public async Task StartChangeStreamsAsync()
    {
        if (_isPollingActive)
        {
            _logger.LogWarning("Polling is already active");
            return;
        }

        try
        {
            _logger.LogInformation("Starting polling-based real-time notifications (Change Streams not available)");

            lock (_pollingLock)
            {
                _pollingTimer = new Timer(async _ => await PollForChangesAsync(), 
                    null, TimeSpan.Zero, TimeSpan.FromSeconds(5)); // Poll every 5 seconds

                _isPollingActive = true;
            }

            _logger.LogInformation("Polling-based real-time service started successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to start polling-based real-time service");
            throw;
        }
    }

    public async Task StopChangeStreamsAsync()
    {
        if (!_isPollingActive)
        {
            return;
        }

        try
        {
            _logger.LogInformation("Stopping polling-based real-time service");

            lock (_pollingLock)
            {
                _pollingTimer?.Dispose();
                _pollingTimer = null;
                _isPollingActive = false;
            }

            _pollingCancellation.Cancel();

            _logger.LogInformation("Polling-based real-time service stopped");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error stopping polling-based real-time service");
        }
    }

    private async Task PollForChangesAsync()
    {
        if (_pollingCancellation.Token.IsCancellationRequested)
            return;

        try
        {
            // Check for new posts
            await CheckForNewPostsAsync();

            // Check for new poll votes  
            await CheckForNewPollVotesAsync();

            _logger.LogDebug("Polling cycle completed successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during polling cycle");
        }
    }

    private async Task CheckForNewPostsAsync()
    {
        try
        {
            var newPosts = await _mongoContext.Posts
                .Find(Builders<MongoPost>.Filter.And(
                    Builders<MongoPost>.Filter.Gt(p => p.CreatedAt, _lastPostCheck),
                    Builders<MongoPost>.Filter.Eq(p => p.IsDeleted, false)
                ))
                .SortBy(p => p.CreatedAt)
                .ToListAsync();

            if (newPosts.Any())
            {
                _logger.LogInformation("Found {Count} new posts since last check", newPosts.Count);

                foreach (var post in newPosts)
                {
                    await HandleNewPostAsync(post);
                }

                _lastPostCheck = newPosts.Max(p => p.CreatedAt);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error checking for new posts");
        }
    }

    private async Task CheckForNewPollVotesAsync()
    {
        try
        {
            var newVotes = await _mongoContext.PollVotes
                .Find(Builders<MongoPollVote>.Filter.And(
                    Builders<MongoPollVote>.Filter.Gt(v => v.CreatedAt, _lastVoteCheck),
                    Builders<MongoPollVote>.Filter.Eq(v => v.IsDeleted, false)
                ))
                .SortBy(v => v.CreatedAt)
                .ToListAsync();

            if (newVotes.Any())
            {
                _logger.LogInformation("Found {Count} new poll votes since last check", newVotes.Count);

                foreach (var vote in newVotes)
                {
                    await HandleNewPollVoteAsync(vote);
                }

                _lastVoteCheck = newVotes.Max(v => v.CreatedAt);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error checking for new poll votes");
        }
    }

    // Same client management methods as Change Stream version
    public async Task AddClientAsync(Guid userId, string connectionId)
    {
        lock (_connectionLock)
        {
            var connection = new ClientConnection
            {
                ConnectionId = connectionId,
                UserId = userId,
                ConnectedAt = DateTime.UtcNow,
                LastActivity = DateTime.UtcNow
            };

            _connections[connectionId] = connection;

            if (!_userConnections.ContainsKey(userId))
            {
                _userConnections[userId] = new List<string>();
            }
            _userConnections[userId].Add(connectionId);

            _logger.LogInformation("Added client connection {ConnectionId} for user {UserId}", 
                connectionId, userId);
        }

        await Task.CompletedTask;
    }

    public async Task RemoveClientAsync(string connectionId)
    {
        lock (_connectionLock)
        {
            if (_connections.TryRemove(connectionId, out var connection))
            {
                if (_userConnections.TryGetValue(connection.UserId, out var userConnections))
                {
                    userConnections.Remove(connectionId);
                    if (userConnections.Count == 0)
                    {
                        _userConnections.TryRemove(connection.UserId, out _);
                    }
                }

                _logger.LogInformation("Removed client connection {ConnectionId} for user {UserId}", 
                    connectionId, connection.UserId);
            }
        }

        await Task.CompletedTask;
    }

    public async Task<int> GetConnectedClientsCount()
    {
        return await Task.FromResult(_connections.Count);
    }

    public async Task<List<string>> GetUserConnections(Guid userId)
    {
        return await Task.FromResult(_userConnections.TryGetValue(userId, out var connections) 
            ? new List<string>(connections) 
            : new List<string>());
    }

    // Same notification methods as Change Stream version
    public async Task NotifyNewPostAsync(MongoPost post, List<Guid> followerIds)
    {
        try
        {
            var postEvent = new PostEvent
            {
                EventType = "new_post",
                PostId = post.PostId,
                AuthorId = post.UserId,
                Content = post.Content.Length > 100 ? post.Content.Substring(0, 100) + "..." : post.Content,
                AuthorProfile = ConvertToCachedProfile(post.UserSnapshot),
                Data = new
                {
                    postId = post.PostId,
                    authorId = post.UserId,
                    postType = post.PostType,
                    hasMedia = post.MediaUrls.Any(),
                    isPoll = post.PollOptions != null && post.PollOptions.Any()
                }
            };

            await NotifyUsersAsync(followerIds, postEvent);

            _logger.LogInformation("Notified {Count} followers about new post {PostId}", 
                followerIds.Count, post.PostId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error notifying new post {PostId}", post.PostId);
        }
    }

    public async Task NotifyPostLikedAsync(Guid postId, Guid likedByUserId, Guid postAuthorId)
    {
        try
        {
            var userProfile = await _officerService.GetUserByIdAsync(likedByUserId);
            
            var engagementEvent = new EngagementEvent
            {
                EventType = "post_liked",
                PostId = postId,
                UserId = likedByUserId,
                ActionType = "like",
                UserProfile = userProfile != null ? new CachedUserProfile
                {
                    UserId = userProfile.Id,
                    DisplayName = userProfile.DisplayName,
                    Username = userProfile.Username,
                    AvatarUrl = userProfile.AvatarUrl,
                    IsVerified = userProfile.IsVerified
                } : null
            };

            await NotifyUsersAsync(new List<Guid> { postAuthorId }, engagementEvent);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error notifying post liked {PostId}", postId);
        }
    }

    public async Task NotifyPostCommentedAsync(Guid postId, Guid commenterId, Guid postAuthorId)
    {
        try
        {
            var userProfile = await _officerService.GetUserByIdAsync(commenterId);
            
            var engagementEvent = new EngagementEvent
            {
                EventType = "post_commented",
                PostId = postId,
                UserId = commenterId,
                ActionType = "comment",
                UserProfile = userProfile != null ? new CachedUserProfile
                {
                    UserId = userProfile.Id,
                    DisplayName = userProfile.DisplayName,
                    Username = userProfile.Username,
                    AvatarUrl = userProfile.AvatarUrl,
                    IsVerified = userProfile.IsVerified
                } : null
            };

            await NotifyUsersAsync(new List<Guid> { postAuthorId }, engagementEvent);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error notifying post commented {PostId}", postId);
        }
    }

    public async Task NotifyPollVoteAsync(Guid postId, Guid voterId, string selectedOption)
    {
        try
        {
            var userProfile = await _officerService.GetUserByIdAsync(voterId);
            
            // Get updated poll results
            var post = await _mongoContext.Posts
                .Find(Builders<MongoPost>.Filter.Eq(p => p.PostId, postId))
                .FirstOrDefaultAsync();

            if (post?.PollOptions != null)
            {
                var votes = await _mongoContext.PollVotes
                    .Find(Builders<MongoPollVote>.Filter.Eq(v => v.PostId, postId))
                    .ToListAsync();

                var optionIndex = post.PollOptions.IndexOf(selectedOption);
                var optionVotes = votes.Count(v => v.OptionIndex == optionIndex);
                var totalVotes = votes.Count;
                var percentage = totalVotes > 0 ? (double)optionVotes / totalVotes * 100 : 0;

                var pollVoteEvent = new PollVoteEvent
                {
                    EventType = "poll_voted",
                    PostId = postId,
                    VoterId = voterId,
                    SelectedOption = selectedOption,
                    OptionIndex = optionIndex,
                    NewVoteCount = optionVotes,
                    NewPercentage = Math.Round(percentage, 1),
                    VoterProfile = userProfile != null ? new CachedUserProfile
                    {
                        UserId = userProfile.Id,
                        DisplayName = userProfile.DisplayName,
                        Username = userProfile.Username,
                        AvatarUrl = userProfile.AvatarUrl,
                        IsVerified = userProfile.IsVerified
                    } : null
                };

                // Notify all users who have voted on this poll or are following the post
                var allVoters = votes.Select(v => v.UserId).Distinct().ToList();
                allVoters.Add(post.UserId); // Include post author
                
                await NotifyUsersAsync(allVoters, pollVoteEvent);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error notifying poll vote {PostId}", postId);
        }
    }

    // Implement remaining interface methods (same as Change Stream version)
    public async Task NotifyUserFollowedAsync(Guid followerId, Guid followedUserId) { /* Same implementation */ }
    public async Task NotifyFeedUpdateAsync(List<Guid> userIds, FeedUpdateType updateType, object data) { /* Same implementation */ }
    public async Task NotifyTrendingPostsUpdateAsync() { /* Same implementation */ }
    public async Task NotifySystemMaintenanceAsync(string message) { /* Same implementation */ }
    public async Task NotifyUserCacheRefreshAsync(Guid userId) { /* Same implementation */ }

    // Helper methods
    private async Task HandleNewPostAsync(MongoPost post)
    {
        var followerIds = await _sqlContext.Follows
            .Where(f => f.FollowingId == post.UserId)
            .Select(f => f.FollowerId)
            .ToListAsync();

        await NotifyNewPostAsync(post, followerIds);
    }

    private async Task HandleNewPollVoteAsync(MongoPollVote vote)
    {
        await NotifyPollVoteAsync(vote.PostId, vote.UserId, vote.SelectedOption);
    }

    private async Task NotifyUsersAsync(List<Guid> userIds, RealtimeEvent eventData)
    {
        var connectedUserIds = userIds.Where(id => _userConnections.ContainsKey(id)).ToList();
        
        if (!connectedUserIds.Any())
        {
            return;
        }

        // Queue events for SSE delivery (same as Change Stream version)
        foreach (var userId in connectedUserIds)
        {
            Controllers.RealtimeController.QueueEventForUser(userId, new Controllers.SseEvent
            {
                EventType = eventData.EventType,
                Data = eventData.Data
            });
        }

        _logger.LogInformation("Queued {EventType} for {Count} connected users", 
            eventData.EventType, connectedUserIds.Count);
    }

    private CachedUserProfile? ConvertToCachedProfile(UserSnapshot? userSnapshot)
    {
        if (userSnapshot == null) return null;

        return new CachedUserProfile
        {
            UserId = Guid.Parse(userSnapshot.UserId),
            DisplayName = userSnapshot.DisplayName,
            Username = userSnapshot.Username,
            AvatarUrl = userSnapshot.AvatarUrl,
            IsVerified = userSnapshot.IsVerified,
            IsActive = userSnapshot.IsActive,
            LastUpdated = userSnapshot.LastUpdated
        };
    }

    public void Dispose()
    {
        StopChangeStreamsAsync().GetAwaiter().GetResult();
        _pollingTimer?.Dispose();
        _pollingCancellation?.Dispose();
    }
}
