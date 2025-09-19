using MongoDB.Driver;
using MongoDB.Bson;
using System.Collections.Concurrent;
using System.Text.Json;
using innkt.Social.Data;
using innkt.Social.Models.MongoDB;
using innkt.Social.Models;
using innkt.Social.DTOs;
using Microsoft.EntityFrameworkCore;
using AutoMapper;

namespace innkt.Social.Services;

/// <summary>
/// Real-time service implementation using MongoDB Change Streams and in-memory client management
/// </summary>
public class RealtimeService : IRealtimeService, IDisposable
{
    private readonly MongoDbContext _mongoContext;
    private readonly SocialDbContext _sqlContext;
    private readonly IOfficerService _officerService;
    private readonly IUserProfileCacheService _userProfileCache;
    private readonly IMapper _mapper;
    private readonly ILogger<RealtimeService> _logger;

    // Change Stream management
    private IChangeStreamCursor<ChangeStreamDocument<MongoPost>>? _postChangeStream;
    private IChangeStreamCursor<ChangeStreamDocument<MongoPollVote>>? _voteChangeStream;
    private CancellationTokenSource _changeStreamCancellation = new();
    private bool _isChangeStreamActive = false;

    // Client connection management
    private readonly ConcurrentDictionary<string, ClientConnection> _connections = new();
    private readonly ConcurrentDictionary<Guid, List<string>> _userConnections = new();
    private readonly object _connectionLock = new object();

    public bool IsChangeStreamActive => _isChangeStreamActive;

    public RealtimeService(
        MongoDbContext mongoContext,
        SocialDbContext sqlContext,
        IOfficerService officerService,
        IUserProfileCacheService userProfileCache,
        IMapper mapper,
        ILogger<RealtimeService> logger)
    {
        _mongoContext = mongoContext;
        _sqlContext = sqlContext;
        _officerService = officerService;
        _userProfileCache = userProfileCache;
        _mapper = mapper;
        _logger = logger;
    }

    public async Task StartChangeStreamsAsync()
    {
        if (_isChangeStreamActive)
        {
            _logger.LogWarning("Change streams are already active");
            return;
        }

            try
            {
                _logger.LogInformation("🚀 Starting MongoDB Change Streams for real-time notifications");
                _logger.LogInformation("📊 Data is now in MongoDB - Change Streams will provide instant real-time updates");

                // Test MongoDB connection first
                try
                {
                    await _mongoContext.Posts.CountDocumentsAsync(FilterDefinition<MongoPost>.Empty);
                    _logger.LogInformation("✅ MongoDB connection test successful - Change Streams can proceed");
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "MongoDB connection test failed - falling back to polling");
                    throw new InvalidOperationException("Cannot start Change Streams without working MongoDB connection", ex);
                }

                // Start monitoring posts collection
                _ = Task.Run(async () => await MonitorPostChangesAsync(_changeStreamCancellation.Token));
                
                // Start monitoring poll votes collection  
                _ = Task.Run(async () => await MonitorPollVoteChangesAsync(_changeStreamCancellation.Token));

                _isChangeStreamActive = true;
                _logger.LogInformation("🎉 MongoDB Change Streams started successfully - Real-time notifications are now INSTANT!");
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "MongoDB Change Streams not available - falling back to optimized MongoDB polling");
                
                // Fallback to polling mode (now queries MongoDB instead of PostgreSQL)
                try
                {
                    await StartPollingModeAsync();
                    _isChangeStreamActive = true;
                    _logger.LogInformation("✅ Successfully started optimized MongoDB polling-based real-time notifications");
                    _logger.LogInformation("📊 Polling every 3 seconds - provides near real-time experience");
                }
                catch (Exception pollingEx)
                {
                    _logger.LogError(pollingEx, "Failed to start polling mode fallback");
                    throw;
                }
            }
    }

    public async Task StopChangeStreamsAsync()
    {
        if (!_isChangeStreamActive)
        {
            return;
        }

        try
        {
            _logger.LogInformation("Stopping real-time service");

            _changeStreamCancellation.Cancel();
            
            // Stop Change Streams if active
            if (_postChangeStream != null)
            {
                _postChangeStream.Dispose();
                _postChangeStream = null;
            }

            if (_voteChangeStream != null)
            {
                _voteChangeStream.Dispose();
                _voteChangeStream = null;
            }

            // Stop polling timer if active
            if (_pollingTimer != null)
            {
                _pollingTimer.Dispose();
                _pollingTimer = null;
            }

            _isChangeStreamActive = false;
            _logger.LogInformation("Real-time service stopped");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error stopping real-time service");
        }
    }

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
                    isPoll = post.PollOptions != null && post.PollOptions.Any(),
                    content = post.Content.Length > 50 ? post.Content.Substring(0, 50) + "..." : post.Content,
                    authorProfile = ConvertToCachedProfile(post.UserSnapshot)
                }
            };

            // Notify followers + author (for testing, also notify all connected users)
            var usersToNotify = followerIds.ToList();
            if (!usersToNotify.Contains(post.UserId))
            {
                usersToNotify.Add(post.UserId); // Notify the author too
            }
            
            // For testing: Also notify the test user if not already included
            var testUserId = Guid.Parse("bdfc4c41-c42e-42e0-a57b-d8301a37b1fe");
            if (!usersToNotify.Contains(testUserId))
            {
                usersToNotify.Add(testUserId);
            }

            await NotifyUsersAsync(usersToNotify, postEvent);

            _logger.LogInformation("Notified {Count} users (followers + test users) about new post {PostId}", 
                usersToNotify.Count, post.PostId);
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
            // Get user profile for the liker
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
                } : null,
                Data = new
                {
                    postId = postId,
                    likedBy = likedByUserId,
                    action = "like"
                }
            };

            // Notify post author
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
                } : null,
                Data = new
                {
                    postId = postId,
                    commentedBy = commenterId,
                    action = "comment"
                }
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
                    } : null,
                    Data = new
                    {
                        postId = postId,
                        selectedOption = selectedOption,
                        optionIndex = optionIndex,
                        newVoteCount = optionVotes,
                        totalVotes = totalVotes,
                        newPercentage = Math.Round(percentage, 1)
                    }
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

    public async Task NotifyUserFollowedAsync(Guid followerId, Guid followedUserId)
    {
        try
        {
            var followerProfile = await _officerService.GetUserByIdAsync(followerId);
            
            var followEvent = new FollowEvent
            {
                EventType = "user_followed",
                FollowerId = followerId,
                FollowedId = followedUserId,
                FollowerProfile = followerProfile != null ? new CachedUserProfile
                {
                    UserId = followerProfile.Id,
                    DisplayName = followerProfile.DisplayName,
                    Username = followerProfile.Username,
                    AvatarUrl = followerProfile.AvatarUrl,
                    IsVerified = followerProfile.IsVerified
                } : null,
                Data = new
                {
                    followerId = followerId,
                    followedId = followedUserId,
                    action = "follow"
                }
            };

            await NotifyUsersAsync(new List<Guid> { followedUserId }, followEvent);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error notifying user followed {FollowedUserId}", followedUserId);
        }
    }

    public async Task NotifyFeedUpdateAsync(List<Guid> userIds, FeedUpdateType updateType, object data)
    {
        try
        {
            var feedEvent = new RealtimeEvent
            {
                EventType = "feed_update",
                Data = new
                {
                    updateType = updateType.ToString().ToLowerInvariant(),
                    data = data
                }
            };

            await NotifyUsersAsync(userIds, feedEvent);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error notifying feed update");
        }
    }

    public async Task NotifyTrendingPostsUpdateAsync()
    {
        try
        {
            var trendingEvent = new RealtimeEvent
            {
                EventType = "trending_update",
                Data = new
                {
                    message = "Trending posts have been updated",
                    timestamp = DateTime.UtcNow
                }
            };

            // Notify all connected users
            var allUserIds = _userConnections.Keys.ToList();
            await NotifyUsersAsync(allUserIds, trendingEvent);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error notifying trending posts update");
        }
    }

    public async Task NotifySystemMaintenanceAsync(string message)
    {
        try
        {
            var systemEvent = new SystemEvent
            {
                EventType = "system_maintenance",
                Message = message,
                Severity = "warning",
                Data = new
                {
                    message = message,
                    timestamp = DateTime.UtcNow
                }
            };

            // Notify all connected users
            var allUserIds = _userConnections.Keys.ToList();
            await NotifyUsersAsync(allUserIds, systemEvent);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error notifying system maintenance");
        }
    }

    public async Task NotifyUserCacheRefreshAsync(Guid userId)
    {
        try
        {
            var cacheEvent = new RealtimeEvent
            {
                EventType = "user_cache_refreshed",
                UserId = userId,
                Data = new
                {
                    userId = userId,
                    message = "User profile cache has been refreshed",
                    timestamp = DateTime.UtcNow
                }
            };

            await NotifyUsersAsync(new List<Guid> { userId }, cacheEvent);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error notifying user cache refresh {UserId}", userId);
        }
    }

    private Timer? _pollingTimer;
    private DateTime _lastPostPoll = DateTime.UtcNow;
    private DateTime _lastVotePoll = DateTime.UtcNow;

    private async Task StartPollingModeAsync()
    {
        _logger.LogInformation("Starting optimized polling-based real-time notifications");
        
        // Use a timer to poll for changes every 3 seconds (near real-time)
        _pollingTimer = new Timer(async _ => await PollForChangesAsync(), 
            null, TimeSpan.Zero, TimeSpan.FromSeconds(3));
        
        _logger.LogInformation("✅ Optimized polling mode started successfully");
        _logger.LogInformation("📊 Real-time notifications will be delivered within 3 seconds");
    }

    private async Task PollForChangesAsync()
    {
        try
        {
            var currentTime = DateTime.UtcNow;
            
            // Check for new posts since last poll
            await CheckForNewPostsAsync(_lastPostPoll, currentTime);
            
            // Check for new poll votes since last poll
            await CheckForNewVotesAsync(_lastVotePoll, currentTime);
            
            // Update poll timestamps
            _lastPostPoll = currentTime;
            _lastVotePoll = currentTime;
            
            _logger.LogDebug("Polling cycle completed - checked for posts and votes");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during polling cycle");
        }
    }

    private async Task CheckForNewPostsAsync(DateTime since, DateTime until)
    {
        try
        {
            // Query MongoDB for new posts (polling fallback)
            var newPosts = await _mongoContext.Posts
                .Find(Builders<MongoPost>.Filter.And(
                    Builders<MongoPost>.Filter.Gte(p => p.CreatedAt, since),
                    Builders<MongoPost>.Filter.Lt(p => p.CreatedAt, until),
                    Builders<MongoPost>.Filter.Eq(p => p.IsDeleted, false)
                ))
                .SortBy(p => p.CreatedAt)
                .ToListAsync();

            if (newPosts.Any())
            {
                _logger.LogInformation("📬 Found {Count} new posts in MongoDB - triggering real-time notifications", newPosts.Count);

                foreach (var post in newPosts)
                {
                    await HandleNewPostAsync(post);
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error checking for new posts during MongoDB polling");
        }
    }

    private async Task CheckForNewVotesAsync(DateTime since, DateTime until)
    {
        try
        {
            // Query MongoDB for new poll votes (polling fallback)
            var newVotes = await _mongoContext.PollVotes
                .Find(Builders<MongoPollVote>.Filter.And(
                    Builders<MongoPollVote>.Filter.Gte(v => v.CreatedAt, since),
                    Builders<MongoPollVote>.Filter.Lt(v => v.CreatedAt, until),
                    Builders<MongoPollVote>.Filter.Eq(v => v.IsDeleted, false)
                ))
                .SortBy(v => v.CreatedAt)
                .ToListAsync();

            if (newVotes.Any())
            {
                _logger.LogInformation("🗳️ Found {Count} new poll votes in MongoDB - triggering real-time notifications", newVotes.Count);

                foreach (var vote in newVotes)
                {
                    await HandleNewPollVoteAsync(vote);
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error checking for new votes during MongoDB polling");
        }
    }

    // Private helper methods
    private async Task MonitorPostChangesAsync(CancellationToken cancellationToken)
    {
        var retryCount = 0;
        const int maxRetries = 5;
        
        while (!cancellationToken.IsCancellationRequested && retryCount < maxRetries)
        {
            try
            {
                _logger.LogInformation("Starting to monitor post changes (attempt {Attempt})", retryCount + 1);

                var pipeline = new EmptyPipelineDefinition<ChangeStreamDocument<MongoPost>>()
                    .Match(change => change.OperationType == ChangeStreamOperationType.Insert ||
                                    change.OperationType == ChangeStreamOperationType.Update);

                var options = new ChangeStreamOptions
                {
                    FullDocument = ChangeStreamFullDocumentOption.UpdateLookup
                };

                _postChangeStream = await _mongoContext.Posts.WatchAsync(pipeline, options, cancellationToken);

            while (await _postChangeStream.MoveNextAsync(cancellationToken))
            {
                foreach (var change in _postChangeStream.Current)
                {
                    try
                    {
                        if (change.OperationType == ChangeStreamOperationType.Insert && change.FullDocument != null)
                        {
                            await HandleNewPostAsync(change.FullDocument);
                        }
                        else if (change.OperationType == ChangeStreamOperationType.Update && change.FullDocument != null)
                        {
                            await HandlePostUpdateAsync(change.FullDocument);
                        }
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "Error processing post change stream event");
                    }
                }
            }
            
            // If we reach here without cancellation, the change stream worked successfully
            _logger.LogInformation("Post change stream monitoring completed successfully");
            break;
        }
        catch (OperationCanceledException)
        {
            _logger.LogInformation("Post change stream monitoring cancelled");
            break;
        }
        catch (Exception ex)
        {
            retryCount++;
            _logger.LogError(ex, "Error in post change stream monitoring (attempt {Attempt}/{MaxRetries})", retryCount, maxRetries);
            
            if (retryCount < maxRetries)
            {
                var delay = TimeSpan.FromSeconds(Math.Pow(2, retryCount)); // Exponential backoff
                _logger.LogInformation("Retrying post change stream in {Delay} seconds", delay.TotalSeconds);
                await Task.Delay(delay, cancellationToken);
            }
            else
            {
                _logger.LogError("Max retries reached for post change stream monitoring. Giving up.");
                break;
            }
        }
        }
    }

    private async Task MonitorPollVoteChangesAsync(CancellationToken cancellationToken)
    {
        try
        {
            _logger.LogInformation("Starting to monitor poll vote changes");

            var pipeline = new EmptyPipelineDefinition<ChangeStreamDocument<MongoPollVote>>()
                .Match(change => change.OperationType == ChangeStreamOperationType.Insert);

            _voteChangeStream = await _mongoContext.PollVotes.WatchAsync(pipeline, cancellationToken: cancellationToken);

            while (await _voteChangeStream.MoveNextAsync(cancellationToken))
            {
                foreach (var change in _voteChangeStream.Current)
                {
                    try
                    {
                        if (change.OperationType == ChangeStreamOperationType.Insert && change.FullDocument != null)
                        {
                            await HandleNewPollVoteAsync(change.FullDocument);
                        }
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "Error processing poll vote change stream event");
                    }
                }
            }
        }
        catch (OperationCanceledException)
        {
            _logger.LogInformation("Poll vote change stream monitoring cancelled");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in poll vote change stream monitoring");
        }
    }

    private async Task HandleNewPostAsync(MongoPost post)
    {
        // Get followers of the post author
        var followerIds = await _sqlContext.Follows
            .Where(f => f.FollowingId == post.UserId)
            .Select(f => f.FollowerId)
            .ToListAsync();

        await NotifyNewPostAsync(post, followerIds);
    }

    private async Task HandlePostUpdateAsync(MongoPost post)
    {
        // Handle post updates (likes, comments count changes, etc.)
        var updateEvent = new RealtimeEvent
        {
            EventType = "post_updated",
            Data = new
            {
                postId = post.PostId,
                likesCount = post.LikesCount,
                commentsCount = post.CommentsCount,
                sharesCount = post.SharesCount,
                feedScore = post.FeedScore
            }
        };

        // Notify users who have interacted with this post
        var interactedUserIds = post.LikedBy.Select(Guid.Parse).ToList();
        await NotifyUsersAsync(interactedUserIds, updateEvent);
    }

    private async Task HandleNewPollVoteAsync(MongoPollVote vote)
    {
        await NotifyPollVoteAsync(vote.PostId, vote.UserId, vote.SelectedOption);
    }

    // PostgreSQL-specific handlers for polling mode
    private async Task HandleNewPostFromPostgreSQLAsync(Post newPost)
    {
        _logger.LogDebug("Handling new PostgreSQL post {PostId} from polling", newPost.Id);
        
        // Convert PostgreSQL Post to MongoPostResponse format for notifications
        var userProfile = await GetCachedUserProfileAsync(newPost.UserId);
        
        var postResponse = new MongoPostResponse
        {
            Id = newPost.Id,
            UserId = newPost.UserId,
            Content = newPost.Content,
            PostType = newPost.PostType,
            MediaUrls = newPost.MediaUrls?.ToList() ?? new List<string>(),
            Hashtags = newPost.Hashtags?.ToList() ?? new List<string>(),
            Mentions = newPost.Mentions?.ToList() ?? new List<string>(),
            Location = newPost.Location,
            IsPublic = newPost.IsPublic,
            IsPinned = newPost.IsPinned,
            PollOptions = newPost.PollOptions?.ToList(),
            PollDuration = newPost.PollDuration,
            PollExpiresAt = newPost.PollExpiresAt,
            LikesCount = newPost.LikesCount,
            CommentsCount = newPost.CommentsCount,
            SharesCount = newPost.SharesCount,
            ViewsCount = newPost.ViewsCount,
            CreatedAt = newPost.CreatedAt,
            UpdatedAt = newPost.UpdatedAt,
            UserProfile = userProfile
        };
        
        // For now, notify all connected users (in a real app, you'd get follower IDs)
        var allConnectedUsers = _userConnections.Keys.ToList();
        
        // Convert to MongoPost for the notification method
        var mongoPost = new MongoPost
        {
            PostId = newPost.Id,
            UserId = newPost.UserId,
            Content = newPost.Content,
            PostType = newPost.PostType,
            CreatedAt = newPost.CreatedAt,
            UserSnapshot = userProfile != null ? _mapper.Map<UserSnapshot>(userProfile) : new UserSnapshot { UserId = newPost.UserId.ToString() }
        };
        
        await NotifyNewPostAsync(mongoPost, allConnectedUsers);
    }

    private async Task HandleNewPollVoteFromPostgreSQLAsync(PollVote newVote)
    {
        _logger.LogDebug("Handling new PostgreSQL poll vote for post {PostId} by user {UserId}", newVote.PostId, newVote.UserId);
        await NotifyPollVoteAsync(newVote.PostId, newVote.UserId, newVote.SelectedOption);
    }

    private async Task<CachedUserProfile?> GetCachedUserProfileAsync(Guid userId)
    {
        try
        {
            // Use the new multi-layer caching service for better performance
            var cachedProfile = await _userProfileCache.GetUserProfileAsync(userId);
            if (cachedProfile != null)
            {
                _logger.LogDebug("Retrieved cached profile for user {UserId} with avatar: {AvatarUrl}", 
                    userId, cachedProfile.AvatarUrl ?? "none");
                return cachedProfile;
            }

            _logger.LogWarning("User {UserId} not found in any cache layer", userId);
            return null;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting cached profile for user {UserId}", userId);
            
            // Fallback to direct Officer service call
            try
            {
                var user = await _officerService.GetUserByIdAsync(userId);
                if (user == null)
                {
                    _logger.LogWarning("User {UserId} not found in Officer service fallback", userId);
                    return null;
                }

                return new CachedUserProfile
                {
                    UserId = user.Id,
                    DisplayName = user.DisplayName,
                    Username = user.Username,
                    AvatarUrl = user.AvatarUrl,
                    IsVerified = user.IsVerified,
                    IsActive = true,
                    LastUpdated = DateTime.UtcNow
                };
            }
            catch (Exception fallbackEx)
            {
                _logger.LogError(fallbackEx, "Fallback Officer service call also failed for user {UserId}", userId);
                return null;
            }
        }
    }

    private async Task NotifyUsersAsync(List<Guid> userIds, RealtimeEvent eventData)
    {
        // Simplified approach: Queue events for ALL specified users via SSE
        // The SSE controller will handle delivery to connected clients
        
        if (!userIds.Any())
        {
            _logger.LogDebug("No users to notify for {EventType}", eventData.EventType);
            return;
        }

        try
        {
            // Queue events for SSE delivery via RealtimeController
            foreach (var userId in userIds)
            {
                Controllers.RealtimeController.QueueEventForUser(userId, new Controllers.SseEvent
                {
                    EventType = eventData.EventType,
                    Data = eventData.Data
                });
                
                _logger.LogDebug("Queued SSE event {EventType} for user {UserId}", 
                    eventData.EventType, userId);
            }

            _logger.LogInformation("Queued {EventType} for {Count} users via SSE", 
                eventData.EventType, userIds.Count);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error queuing SSE events for {EventType}", eventData.EventType);
        }

        await Task.CompletedTask;
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
        _changeStreamCancellation?.Dispose();
    }
}

// Helper class for client connection management
public class ClientConnection
{
    public string ConnectionId { get; set; } = string.Empty;
    public Guid UserId { get; set; }
    public DateTime ConnectedAt { get; set; }
    public DateTime LastActivity { get; set; }
}
