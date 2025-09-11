# INNKT Trending Algorithm Analysis

## Overview
This document analyzes the trending algorithm implementation in INNKT and identifies open source components and algorithms used.

## Current Implementation Analysis

### 1. Trending Topics Algorithm
**Location:** `Backend/innkt.Social/Services/TrendingService.cs`

**Algorithm Components:**
- **Time Window:** 1-hour sliding window for trending calculation
- **Engagement Scoring:** Weighted combination of likes, comments, and shares
- **Time Decay:** Exponential decay based on post age
- **Velocity Calculation:** Growth rate compared to previous window
- **Acceleration Factor:** Rate of change of velocity (simplified implementation)

**Formula:**
```
Post Score = (likes × 1.0 + comments × 2.0 + shares × 3.0) × time_decay
Trending Score = current_score × velocity × (1 + acceleration)
```

**Open Source Components Used:**
- **Entity Framework Core:** Database queries and data access
- **Redis StackExchange:** Caching for performance optimization
- **ASP.NET Core:** Web API framework

### 2. User Recommendations Algorithm
**Location:** `Backend/innkt.Social/Services/TrendingService.cs`

**Algorithm Type:** Collaborative Filtering (Friends of Friends)
**Method:**
1. Get current user's following list
2. Find users that the current user's follows are following
3. Exclude users already followed by current user
4. Rank by mutual connections count
5. Return top recommendations

**Open Source Components Used:**
- **Entity Framework Core:** Graph traversal and data queries
- **LINQ:** Data filtering and grouping operations

### 3. Post Feed Algorithm
**Location:** `Backend/innkt.Social/Services/PostService.cs`

**Current Implementation:**
```csharp
// Simple trending algorithm based on likes and recency
var query = _context.Posts
    .Where(p => p.IsPublic)
    .OrderByDescending(p => p.LikesCount * 0.7 + p.CommentsCount * 0.3)
    .ThenByDescending(p => p.CreatedAt);
```

**Algorithm Type:** Simple engagement-based ranking
**Weights:**
- Likes: 70%
- Comments: 30%
- Recency: Secondary sort

## Open Source Libraries and Frameworks Used

### 1. Core Framework
- **ASP.NET Core 8.0:** Web API framework
- **Entity Framework Core:** ORM for database operations
- **AutoMapper:** Object-to-object mapping

### 2. Caching and Performance
- **StackExchange.Redis:** Redis client for caching
- **Microsoft.Extensions.Caching.Distributed:** Distributed caching abstraction

### 3. Authentication and Security
- **Microsoft.AspNetCore.Authentication.JwtBearer:** JWT authentication
- **System.IdentityModel.Tokens.Jwt:** JWT token handling

### 4. Logging and Monitoring
- **Serilog:** Structured logging
- **Microsoft.Extensions.Logging:** Logging abstraction

### 5. Database
- **PostgreSQL:** Primary database
- **Npgsql.EntityFrameworkCore.PostgreSQL:** PostgreSQL provider for EF Core

## Algorithm Analysis

### Strengths
1. **Real-time Calculation:** Uses 1-hour sliding window for current trends
2. **Engagement Weighting:** Properly weights different types of engagement
3. **Time Decay:** Prevents old content from dominating trends
4. **Caching:** Redis caching improves performance
5. **Scalable Architecture:** Microservices design allows independent scaling

### Areas for Improvement
1. **Acceleration Calculation:** Currently simplified with random factor
2. **Content Quality:** No content quality scoring
3. **User Behavior:** No personalization based on user preferences
4. **Machine Learning:** No ML-based recommendations
5. **Real-time Updates:** No WebSocket-based real-time trending updates

## Open Source Alternatives Considered

### 1. Recommendation Engines
- **Apache Mahout:** Machine learning library for recommendations
- **TensorFlow Recommenders:** Google's recommendation system
- **Surprise:** Python scikit-learn for recommendation systems

### 2. Real-time Processing
- **Apache Kafka:** Stream processing for real-time trending
- **Apache Storm:** Real-time computation system
- **Apache Flink:** Stream processing framework

### 3. Machine Learning Libraries
- **ML.NET:** Microsoft's machine learning framework for .NET
- **Accord.NET:** Machine learning framework for .NET
- **TensorFlow.NET:** .NET bindings for TensorFlow

## Implementation Recommendations

### 1. Enhanced Trending Algorithm
```csharp
public class EnhancedTrendingService
{
    // Add content quality scoring
    private double CalculateContentQuality(Post post)
    {
        // Factors: text length, media presence, author reputation
        var textQuality = Math.Min(post.Content.Length / 100.0, 1.0);
        var mediaBonus = post.Media?.Count > 0 ? 0.2 : 0;
        var authorReputation = post.Author.FollowersCount / 1000.0;
        
        return (textQuality + mediaBonus + authorReputation) / 3.0;
    }
    
    // Add personalization
    private double CalculatePersonalizationScore(Post post, string userId)
    {
        // User's interaction history with similar content
        // User's following preferences
        // User's engagement patterns
        return 1.0; // Placeholder
    }
}
```

### 2. Real-time Trending Updates
```csharp
public class RealTimeTrendingService
{
    private readonly IHubContext<TrendingHub> _hubContext;
    
    public async Task UpdateTrendingInRealTime()
    {
        var trendingTopics = await CalculateTrendingTopicsAsync();
        await _hubContext.Clients.All.SendAsync("TrendingUpdated", trendingTopics);
    }
}
```

### 3. Machine Learning Integration
```csharp
public class MLRecommendationService
{
    private readonly MLContext _mlContext;
    private readonly ITransformer _model;
    
    public async Task<List<UserProfile>> GetMLRecommendations(string userId)
    {
        // Use ML.NET for collaborative filtering
        var predictionEngine = _mlContext.Model.CreatePredictionEngine<UserInteraction, UserRecommendation>(_model);
        
        // Generate recommendations based on user behavior
        var recommendations = new List<UserProfile>();
        // Implementation details...
        
        return recommendations;
    }
}
```

## Performance Considerations

### 1. Caching Strategy
- **Redis Caching:** 5-minute cache for trending topics
- **Database Indexing:** Proper indexes on engagement fields
- **Query Optimization:** Efficient LINQ queries

### 2. Scalability
- **Microservices:** Independent scaling of trending service
- **Database Sharding:** Potential for horizontal scaling
- **CDN Integration:** For static content delivery

### 3. Real-time Processing
- **SignalR Hubs:** For real-time updates
- **Background Services:** For periodic trending calculations
- **Queue-based Processing:** For handling high-volume updates

## Conclusion

The current INNKT trending algorithm implementation uses a solid foundation of open source technologies with a simple but effective approach to trending calculation. The system is built on proven technologies like ASP.NET Core, Entity Framework Core, and Redis, providing a good balance of performance and maintainability.

**Key Open Source Components:**
- ASP.NET Core (Microsoft)
- Entity Framework Core (Microsoft)
- StackExchange.Redis (StackExchange)
- Serilog (Serilog Contributors)
- PostgreSQL (PostgreSQL Global Development Group)

**Recommendations:**
1. Implement enhanced content quality scoring
2. Add machine learning-based recommendations
3. Implement real-time trending updates
4. Add personalization based on user behavior
5. Consider Apache Kafka for high-volume stream processing

The current implementation provides a solid foundation that can be enhanced with more sophisticated algorithms while maintaining the existing open source technology stack.
