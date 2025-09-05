# X (Twitter) Algorithm Analysis & Open Source Alternatives

## Overview
This document analyzes X's (formerly Twitter) feed algorithms and provides open source alternatives that can be implemented in INNKT.

## X's Core Algorithm Components

### 1. Timeline Ranking Algorithm
**What it does:** Orders posts in the user's feed based on relevance and engagement
**Key factors:**
- Recency (time decay)
- User engagement (likes, retweets, replies)
- User relationship strength
- Content type preferences
- Device and location context

### 2. Engagement Scoring
**What it does:** Calculates a score for each post based on user interactions
**Formula (simplified):**
```
Score = (likes × 1) + (retweets × 2) + (replies × 3) + (bookmarks × 1.5)
```

### 3. Content Recommendation
**What it does:** Suggests posts from users you don't follow
**Methods:**
- Collaborative filtering
- Content-based filtering
- Hybrid approaches
- Real-time trending detection

### 4. Real-time Updates
**What it does:** Pushes new content to users in real-time
**Technology:** WebSocket connections, Redis pub/sub

## Open Source Alternatives for INNKT

### 1. Timeline Algorithm Implementation

#### Redis-based Timeline Service
```javascript
// Timeline scoring algorithm
class TimelineAlgorithm {
  calculateScore(post, user, context) {
    const recencyScore = this.calculateRecency(post.timestamp);
    const engagementScore = this.calculateEngagement(post);
    const relationshipScore = this.calculateRelationship(post.author, user);
    const contentScore = this.calculateContentRelevance(post, user);
    
    return (recencyScore * 0.3) + 
           (engagementScore * 0.4) + 
           (relationshipScore * 0.2) + 
           (contentScore * 0.1);
  }
  
  calculateRecency(timestamp) {
    const now = Date.now();
    const age = now - timestamp;
    const hours = age / (1000 * 60 * 60);
    return Math.exp(-hours / 24); // Exponential decay
  }
  
  calculateEngagement(post) {
    const totalEngagement = post.likes + (post.retweets * 2) + (post.replies * 3);
    const timeDecay = this.calculateRecency(post.timestamp);
    return totalEngagement * timeDecay;
  }
}
```

#### Database Schema for Timeline
```sql
-- Posts table
CREATE TABLE posts (
  id UUID PRIMARY KEY,
  author_id UUID REFERENCES users(id),
  content TEXT NOT NULL,
  media_urls TEXT[],
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  is_public BOOLEAN DEFAULT true,
  engagement_score FLOAT DEFAULT 0
);

-- User interactions
CREATE TABLE user_interactions (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  post_id UUID REFERENCES posts(id),
  interaction_type VARCHAR(20), -- 'like', 'retweet', 'reply', 'bookmark'
  created_at TIMESTAMP DEFAULT NOW()
);

-- Timeline cache
CREATE TABLE timeline_cache (
  user_id UUID REFERENCES users(id),
  post_id UUID REFERENCES posts(id),
  score FLOAT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (user_id, post_id)
);
```

### 2. Real-time Feed Updates

#### WebSocket Implementation
```javascript
// Real-time feed updates using Socket.IO
class FeedUpdateService {
  constructor(io) {
    this.io = io;
    this.redis = new Redis();
  }
  
  async publishPost(post) {
    // Get all followers
    const followers = await this.getFollowers(post.author_id);
    
    // Calculate scores for each follower
    for (const follower of followers) {
      const score = this.calculateScore(post, follower);
      await this.updateTimeline(follower.id, post.id, score);
      
      // Send real-time update
      this.io.to(`user_${follower.id}`).emit('new_post', {
        post,
        score,
        timestamp: Date.now()
      });
    }
  }
  
  async updateTimeline(userId, postId, score) {
    // Update Redis cache
    await this.redis.zadd(`timeline:${userId}`, score, postId);
    
    // Keep only top 1000 posts
    await this.redis.zremrangebyrank(`timeline:${userId}`, 0, -1001);
  }
}
```

### 3. Content Recommendation Engine

#### Collaborative Filtering
```javascript
class RecommendationEngine {
  async getRecommendedPosts(userId, limit = 10) {
    // Get user's interaction history
    const userInteractions = await this.getUserInteractions(userId);
    
    // Find similar users
    const similarUsers = await this.findSimilarUsers(userId, userInteractions);
    
    // Get posts from similar users
    const recommendedPosts = await this.getPostsFromUsers(similarUsers, userId);
    
    // Rank by relevance
    return this.rankPosts(recommendedPosts, userId);
  }
  
  async findSimilarUsers(userId, userInteractions) {
    // Jaccard similarity for user interactions
    const allUsers = await this.getAllUsers();
    const similarities = [];
    
    for (const user of allUsers) {
      if (user.id === userId) continue;
      
      const userInteractions2 = await this.getUserInteractions(user.id);
      const similarity = this.calculateJaccardSimilarity(userInteractions, userInteractions2);
      
      if (similarity > 0.1) {
        similarities.push({ user, similarity });
      }
    }
    
    return similarities
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 10)
      .map(item => item.user);
  }
}
```

### 4. Trending Detection

#### Real-time Trending Algorithm
```javascript
class TrendingService {
  constructor() {
    this.redis = new Redis();
    this.trendingWindow = 60 * 60 * 1000; // 1 hour
  }
  
  async updateTrending() {
    const now = Date.now();
    const windowStart = now - this.trendingWindow;
    
    // Get all hashtags from the last hour
    const hashtags = await this.getHashtagsInWindow(windowStart, now);
    
    // Calculate trending scores
    const trendingScores = await this.calculateTrendingScores(hashtags, windowStart, now);
    
    // Update trending list
    await this.updateTrendingList(trendingScores);
  }
  
  async calculateTrendingScores(hashtags, windowStart, now) {
    const scores = {};
    
    for (const hashtag of hashtags) {
      const count = await this.getHashtagCount(hashtag, windowStart, now);
      const previousCount = await this.getHashtagCount(hashtag, windowStart - this.trendingWindow, windowStart);
      
      // Calculate velocity (growth rate)
      const velocity = count / Math.max(previousCount, 1);
      
      // Calculate acceleration (rate of change of velocity)
      const acceleration = this.calculateAcceleration(hashtag, windowStart, now);
      
      scores[hashtag] = {
        count,
        velocity,
        acceleration,
        score: count * velocity * (1 + acceleration)
      };
    }
    
    return scores;
  }
}
```

## Implementation Architecture for INNKT

### 1. Microservices Structure
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Feed Service  │    │  Recommendation │    │  Trending       │
│                 │    │  Service        │    │  Service        │
│ - Timeline      │    │                 │    │                 │
│ - Real-time     │    │ - Collaborative │    │ - Hashtag       │
│ - Scoring       │    │   Filtering     │    │   Detection     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │     Redis       │
                    │   (Cache &      │
                    │    Pub/Sub)     │
                    └─────────────────┘
```

### 2. Database Design
```sql
-- Enhanced posts table
CREATE TABLE posts (
  id UUID PRIMARY KEY,
  author_id UUID REFERENCES users(id),
  content TEXT NOT NULL,
  media_urls TEXT[],
  hashtags TEXT[],
  mentions TEXT[],
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  is_public BOOLEAN DEFAULT true,
  engagement_score FLOAT DEFAULT 0,
  trending_score FLOAT DEFAULT 0
);

-- User preferences
CREATE TABLE user_preferences (
  user_id UUID PRIMARY KEY REFERENCES users(id),
  content_types TEXT[], -- ['text', 'image', 'video']
  languages TEXT[], -- ['en', 'es', 'fr']
  topics TEXT[], -- ['tech', 'sports', 'news']
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Feed cache
CREATE TABLE feed_cache (
  user_id UUID REFERENCES users(id),
  post_id UUID REFERENCES posts(id),
  score FLOAT NOT NULL,
  position INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (user_id, post_id)
);
```

### 3. API Endpoints
```javascript
// Feed API endpoints
app.get('/api/feed', authenticateUser, async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const userId = req.user.id;
  
  const feed = await feedService.getUserFeed(userId, page, limit);
  res.json(feed);
});

app.get('/api/feed/recommendations', authenticateUser, async (req, res) => {
  const userId = req.user.id;
  const recommendations = await recommendationService.getRecommendedPosts(userId);
  res.json(recommendations);
});

app.get('/api/trending', async (req, res) => {
  const trending = await trendingService.getTrendingHashtags();
  res.json(trending);
});
```

## Performance Optimizations

### 1. Caching Strategy
- **Redis**: Store timeline cache, trending data, user preferences
- **CDN**: Cache media content and static assets
- **Database**: Use read replicas for feed queries

### 2. Real-time Updates
- **WebSocket**: For real-time feed updates
- **Server-Sent Events**: For trending updates
- **Push Notifications**: For mobile apps

### 3. Scalability
- **Horizontal scaling**: Multiple feed service instances
- **Sharding**: Partition data by user ID
- **Load balancing**: Distribute requests across instances

## Open Source Libraries to Use

### 1. Timeline Algorithm
- **Redis**: For caching and pub/sub
- **Node.js**: For real-time processing
- **PostgreSQL**: For data persistence

### 2. Recommendation Engine
- **TensorFlow.js**: For machine learning
- **ML5.js**: For client-side ML
- **Apache Spark**: For large-scale processing

### 3. Real-time Updates
- **Socket.IO**: For WebSocket connections
- **Redis Pub/Sub**: For message broadcasting
- **Bull**: For job queues

## Implementation Timeline

### Phase 1: Basic Timeline (2 weeks)
- Implement basic timeline algorithm
- Set up Redis caching
- Create feed API endpoints

### Phase 2: Real-time Updates (2 weeks)
- Implement WebSocket connections
- Add real-time feed updates
- Set up push notifications

### Phase 3: Recommendations (3 weeks)
- Implement collaborative filtering
- Add content-based recommendations
- Create recommendation API

### Phase 4: Trending (2 weeks)
- Implement trending detection
- Add hashtag analysis
- Create trending API

### Phase 5: Optimization (2 weeks)
- Performance tuning
- Caching optimization
- Load testing

## Cost Analysis

### Infrastructure Costs (Monthly)
- **Redis**: $50-200 (depending on memory)
- **PostgreSQL**: $100-500 (depending on size)
- **CDN**: $20-100 (depending on traffic)
- **Total**: $170-800/month

### Development Costs
- **Backend Developer**: 2-3 months
- **Frontend Developer**: 1-2 months
- **DevOps Engineer**: 1 month
- **Total**: 4-6 months

## Conclusion

The X algorithm can be replicated using open source technologies with:
- **Redis** for caching and real-time updates
- **PostgreSQL** for data persistence
- **Node.js** for the backend services
- **Socket.IO** for real-time communication
- **TensorFlow.js** for machine learning

This approach provides a scalable, cost-effective solution that can handle millions of users while maintaining real-time performance.
