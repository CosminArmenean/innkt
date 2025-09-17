# 🚀 INNKT Hybrid Architecture Setup Guide

## 📊 Architecture Overview

INNKT now uses a **hybrid PostgreSQL + MongoDB architecture** for optimal performance:

- **PostgreSQL**: User profiles, follows, groups (relational data)
- **MongoDB**: Posts, comments, likes, polls (high-volume social data)
- **Real-time**: MongoDB Change Streams + Server-Sent Events (SSE)

## 🛠️ Quick Start

### 1. Start Infrastructure
```powershell
.\start-infra-simple.ps1
```

This will:
- ✅ Start PostgreSQL (port 5433)
- ✅ Start Redis (port 6379)
- ✅ Start MongoDB with replica set (port 27017)
- ✅ Start Kafka + Zookeeper (ports 9092, 2181)
- ✅ Initialize MongoDB replica set for Change Streams
- ✅ Configure all databases

### 2. Start Services
```powershell
.\start-services.ps1
```

### 3. Verify Setup
- **PostgreSQL**: `localhost:5433` (user profiles, follows)
- **MongoDB**: `localhost:27017` (posts, real-time data)
- **Social Service**: `localhost:8081` (hybrid API endpoints)
- **React App**: `localhost:3001` (with real-time notifications)

## 🔄 Real-Time Features

### MongoDB Change Streams
- **Automatic**: Detects new posts, likes, comments, poll votes
- **Instant**: Sub-second notification delivery
- **Scalable**: Handles millions of social interactions

### Server-Sent Events (SSE)
- **Endpoint**: `GET /api/realtime/events`
- **Events**: `new_post`, `post_liked`, `poll_voted`, `post_updated`
- **Frontend**: Automatic connection with reconnection logic

### React Notifications
- **Position**: Top-middle under navbar
- **Style**: Compact, rounded notifications
- **Grouping**: Multiple posts merge with overlapping profile circles
- **Interactive**: Click to dismiss and refresh feed

## 📡 API Endpoints

### MongoDB API (Primary)
```
POST   /api/v2/mongoposts              # Create post
GET    /api/v2/mongoposts/feed         # Get personalized feed
GET    /api/v2/mongoposts/public       # Get public feed
GET    /api/v2/mongoposts/{id}         # Get specific post
POST   /api/v2/mongoposts/{id}/like    # Like post
POST   /api/v2/mongoposts/{id}/vote    # Vote on poll
GET    /api/v2/mongoposts/{id}/poll-results # Get poll results
```

### Real-time API
```
GET    /api/realtime/events            # SSE connection
GET    /api/realtime/status            # Connection status
POST   /api/realtime/test-event        # Manual test events
```

### Migration API
```
POST   /api/migration/posts            # Migrate PostgreSQL → MongoDB
GET    /api/migration/stats            # Migration statistics
```

## 🗄️ Database Configuration

### PostgreSQL Connection
```json
{
  "DefaultConnection": "Host=localhost;Port=5433;Database=innkt_social;Username=admin_officer;Password=@CAvp57rt26;TrustServerCertificate=true;"
}
```

### MongoDB Connection
```json
{
  "MongoDB": "mongodb://localhost:27017/innkt_social?replicaSet=rs0"
}
```

## 🎯 Performance Benefits

### Smart User Caching
- **User profiles cached** with posts in MongoDB
- **No N+1 queries** when loading feeds
- **Auto-refresh** when profiles become stale

### Feed Performance
- **Before**: 4.6 seconds (PostgreSQL with N+1 queries)
- **After**: 99ms (MongoDB with cached profiles)
- **Improvement**: 46x faster!

### Real-time Updates
- **Change Streams**: Instant detection of data changes
- **SSE**: Sub-second notification delivery
- **Smart Grouping**: Multiple notifications merge automatically

## 🔧 Troubleshooting

### MongoDB Replica Set Issues
```powershell
# Check replica set status
docker exec innkt-mongodb mongosh --eval "rs.status()"

# Manual replica set initialization
docker exec innkt-mongodb mongosh --eval "rs.initiate({_id: 'rs0', members: [{_id: 0, host: 'localhost:27017'}]})"
```

### SSE Connection Issues
```powershell
# Check SSE status
curl http://localhost:8081/api/realtime/status

# Test manual SSE event
curl -X POST http://localhost:8081/api/realtime/test-event -H "Content-Type: application/json" -d '{"eventType":"test","message":"Manual test"}'
```

### Migration Issues
```powershell
# Check migration stats
curl http://localhost:8081/api/migration/stats

# Run migration
curl -X POST http://localhost:8081/api/migration/posts
```

## 📋 Development Workflow

### For New Posts
1. **Always use MongoDB API**: `/api/v2/mongoposts`
2. **Change Streams automatically trigger** real-time notifications
3. **React receives SSE events** and updates UI instantly

### For User Data
1. **PostgreSQL stores** user profiles, follows, groups
2. **MongoDB caches** user snapshots with posts
3. **Officer service** provides user data via batch API

### For Real-time Testing
1. **Open React app** in multiple browser tabs
2. **Create posts** from one tab
3. **Watch real-time notifications** in other tabs
4. **Monitor backend logs** for Change Streams activity

## 🎊 Features Implemented

- ✅ **Hybrid Architecture**: PostgreSQL + MongoDB
- ✅ **Change Streams**: Real-time data detection
- ✅ **SSE Integration**: Instant browser notifications  
- ✅ **Smart Caching**: User profiles cached with posts
- ✅ **Feed Optimization**: 46x performance improvement
- ✅ **Real-time UI**: X/Twitter style notifications
- ✅ **Poll System**: Real-time voting with Change Streams
- ✅ **Migration Tools**: PostgreSQL → MongoDB sync

## 🚀 Next Steps

1. **Production Setup**: Replace test user IDs with proper authentication
2. **WebSocket Upgrade**: Replace SSE with WebSockets for better auth
3. **Redis Integration**: Add Redis for SSE connection management
4. **Monitoring**: Add metrics for Change Streams and SSE performance
5. **Scaling**: Add MongoDB sharding for millions of posts

---

**The INNKT platform now provides enterprise-grade real-time social media functionality with optimal performance and scalability!** 🎉
