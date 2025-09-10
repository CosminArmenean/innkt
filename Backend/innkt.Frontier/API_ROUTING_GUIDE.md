# API Gateway Routing Guide

This document outlines the API routing configuration for the innkt platform after the microservices migration.

## 🏗️ **Service Architecture**

| **Service** | **Port** | **Responsibility** | **Base Path** |
|-------------|----------|-------------------|---------------|
| **Officer** | 8080 | Identity & Authentication | `/api/identity/*` |
| **Social** | 8080 | Posts, Comments, Likes, Feeds | `/api/social/*` |
| **Groups** | 8080 | Group Management & Group Posts | `/api/groups/*` |
| **Follow** | 8080 | User Following & Followers | `/api/follow/*` |
| **NeuroSpark** | 8080 | AI Search, Image Processing, QR Codes | `/api/neurospark/*`, `/api/search/*` |
| **Messaging** | 8080 | Real-time Chat & Notifications | `/api/messaging/*` |
| **Seer** | 8080 | Video Calls & WebRTC | `/api/seer/*`, `/hubs/*` |

## 🔀 **API Endpoints**

### **Identity & Authentication (Officer Service)**
```
Base URL: /api/identity
Service: officer-service:8080

Endpoints:
- POST /api/identity/auth/login
- POST /api/identity/auth/register
- POST /api/identity/auth/logout
- POST /api/identity/auth/refresh
- POST /api/identity/auth/forgot-password
- POST /api/identity/auth/reset-password
- GET  /api/identity/users/profile
- PUT  /api/identity/users/profile
- POST /api/identity/users/verify-email
- POST /api/identity/users/verify-phone
- POST /api/identity/mfa/setup
- POST /api/identity/mfa/verify
- GET  /api/identity/kid-accounts
- POST /api/identity/kid-accounts
- GET  /api/identity/joint-accounts
- POST /api/identity/joint-accounts
```

### **Social Features (Social Service)**
```
Base URL: /api/social
Service: social-service:8080

Endpoints:
- GET    /api/social/posts
- POST   /api/social/posts
- GET    /api/social/posts/{id}
- PUT    /api/social/posts/{id}
- DELETE /api/social/posts/{id}
- POST   /api/social/posts/{id}/like
- DELETE /api/social/posts/{id}/like
- GET    /api/social/posts/feed
- GET    /api/social/posts/search
- GET    /api/social/posts/trending
- GET    /api/social/posts/hashtag/{hashtag}
- GET    /api/social/comments
- POST   /api/social/comments
- GET    /api/social/comments/{id}
- PUT    /api/social/comments/{id}
- DELETE /api/social/comments/{id}
- POST   /api/social/comments/{id}/like
- DELETE /api/social/comments/{id}/like
```

### **Groups (Groups Service)**
```
Base URL: /api/groups
Service: groups-service:8080

Endpoints:
- GET    /api/groups
- POST   /api/groups
- GET    /api/groups/{id}
- PUT    /api/groups/{id}
- DELETE /api/groups/{id}
- POST   /api/groups/{id}/join
- POST   /api/groups/{id}/leave
- GET    /api/groups/{id}/members
- GET    /api/groups/search
- GET    /api/groups/trending
- GET    /api/groups/recommended
- POST   /api/groups/{id}/invite
- GET    /api/groups/invitations
- POST   /api/groups/invitations/{id}/respond
```

### **Follow System (Follow Service)**
```
Base URL: /api/follow
Service: follow-service:8080

Endpoints:
- POST   /api/follow/follow
- POST   /api/follow/unfollow
- GET    /api/follow/check/{userId}
- GET    /api/follow/followers/{userId}
- GET    /api/follow/following/{userId}
- GET    /api/follow/mutual/{userId1}/{userId2}
- GET    /api/follow/stats/{userId}
- POST   /api/follow/suggestions
- POST   /api/follow/suggestions/dismiss
- POST   /api/follow/mute
- POST   /api/follow/block
- PUT    /api/follow/notes
- GET    /api/follow/notifications
- PUT    /api/follow/notifications/{id}/read
- PUT    /api/follow/notifications/read-all
- POST   /api/follow/timeline
```

### **AI Search & Content Analysis (NeuroSpark Service)**
```
Base URL: /api/search, /api/neurospark
Service: neurospark-service:8080

Search Endpoints:
- POST   /api/search/search
- POST   /api/search/search/posts
- POST   /api/search/search/users
- POST   /api/search/search/groups
- POST   /api/search/search/hashtags
- POST   /api/search/semantic
- POST   /api/search/vector
- POST   /api/search/hybrid
- GET    /api/search/suggestions
- GET    /api/search/analytics
- GET    /api/search/stats

Content Analysis:
- POST   /api/search/analyze
- POST   /api/search/recommendations
- POST   /api/search/trending

Image Processing:
- POST   /api/imageprocessing/process
- POST   /api/imageprocessing/background-remove
- POST   /api/imageprocessing/enhance
- POST   /api/imageprocessing/crop
- GET    /api/imageprocessing/history

QR Code Generation:
- POST   /api/qrcode/generate
- POST   /api/qrcode/generate/kid-pairing
- POST   /api/qrcode/scan
- GET    /api/qrcode/validate
- GET    /api/qrcode/history
```

### **Messaging (Messaging Service)**
```
Base URL: /api/messaging
Service: messaging-service:8080

Endpoints:
- GET    /api/messaging/conversations
- POST   /api/messaging/conversations
- GET    /api/messaging/conversations/{id}
- PUT    /api/messaging/conversations/{id}
- DELETE /api/messaging/conversations/{id}
- GET    /api/messaging/conversations/{id}/messages
- POST   /api/messaging/conversations/{id}/messages
- PUT    /api/messaging/messages/{id}
- DELETE /api/messaging/messages/{id}
- POST   /api/messaging/messages/{id}/react
- DELETE /api/messaging/messages/{id}/react
- GET    /api/messaging/users
- GET    /api/messaging/notifications
- PUT    /api/messaging/notifications/{id}/read
```

### **Video Calls (Seer Service)**
```
Base URL: /api/seer, /hubs
Service: seer-service:8080

Endpoints:
- POST   /api/seer/calls/start
- POST   /api/seer/calls/join
- POST   /api/seer/calls/end
- GET    /api/seer/calls/{id}
- GET    /api/seer/calls/history
- POST   /api/seer/calls/{id}/invite
- GET    /api/seer/rooms
- POST   /api/seer/rooms
- GET    /api/seer/rooms/{id}
- PUT    /api/seer/rooms/{id}
- DELETE /api/seer/rooms/{id}

WebRTC Hubs:
- GET    /hubs/signaling
- POST   /hubs/signaling
```

## 🔐 **Authentication**

All API endpoints (except public identity endpoints) require JWT authentication:

```http
Authorization: Bearer <jwt_token>
```

## 📊 **Health Checks**

Each service provides health check endpoints:

```http
GET /health/identity    # Officer service
GET /health/social      # Social service
GET /health/groups      # Groups service
GET /health/follow      # Follow service
GET /health/neurospark  # NeuroSpark service
GET /health/messaging   # Messaging service
GET /health/seer        # Seer service
```

## 🚀 **Deployment Configuration**

### **Docker Services**
```yaml
services:
  officer-service:
    image: innkt/officer:latest
    ports: ["8080:8080"]
    
  social-service:
    image: innkt/social:latest
    ports: ["8080:8080"]
    
  groups-service:
    image: innkt/groups:latest
    ports: ["8080:8080"]
    
  follow-service:
    image: innkt/follow:latest
    ports: ["8080:8080"]
    
  neurospark-service:
    image: innkt/neurospark:latest
    ports: ["8080:8080"]
    
  messaging-service:
    image: innkt/messaging:latest
    ports: ["8080:8080"]
    
  seer-service:
    image: innkt/seer:latest
    ports: ["8080:8080"]
    
  frontier-gateway:
    image: innkt/frontier:latest
    ports: ["5002:8080"]
```

### **Kubernetes Services**
```yaml
apiVersion: v1
kind: Service
metadata:
  name: officer-service
spec:
  selector:
    app: officer-service
  ports:
  - port: 8080
    targetPort: 8080
```

## 🔄 **Migration Benefits**

1. **Separation of Concerns**: Each service handles a specific domain
2. **Independent Scaling**: Services can be scaled based on demand
3. **Technology Flexibility**: Each service can use different technologies
4. **Fault Isolation**: Issues in one service don't affect others
5. **Team Autonomy**: Different teams can work on different services
6. **Easier Testing**: Smaller, focused services are easier to test
7. **Deployment Independence**: Services can be deployed independently

## 📝 **Notes**

- All services use HTTP/2 for better performance
- Rate limiting is configured at the gateway level
- Load balancing uses round-robin strategy
- Circuit breaker pattern is implemented for fault tolerance
- All services support CORS for cross-origin requests
- Static files are served directly from the appropriate services
