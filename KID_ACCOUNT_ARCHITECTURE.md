# Kid Account System Architecture

## 🏗️ **Microservice Distribution**

### **Service Responsibilities**

```
┌─────────────────────────────────────────────────────────────┐
│                    INNKT Platform                           │
└─────────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
   ┌────▼────┐       ┌──────▼──────┐     ┌─────▼─────┐
   │ Officer │       │   Kinder    │     │  Social   │
   │ Service │       │   Service   │     │  Service  │
   │ :5001   │       │   :5XXX     │     │  :5000    │
   └────┬────┘       └──────┬──────┘     └─────┬─────┘
        │                   │                   │
        │                   │                   │
        └───────────────────┼───────────────────┘
                            │
                     ┌──────▼──────┐
                     │    Kafka    │
                     │   :9092     │
                     └──────┬──────┘
                            │
                ┌───────────┼───────────┐
                │                       │
         ┌──────▼──────┐        ┌──────▼──────┐
         │Notifications│        │  Messaging  │
         │   Service   │        │   Service   │
         │   :5004     │        │   :5003     │
         └─────────────┘        └─────────────┘
```

## 📊 **Service Breakdown**

### **1. Officer Service (Port 5001) - Authentication**
**Primary Responsibility:** User authentication and authorization

**Endpoints:**
```typescript
POST /api/auth/login          // Standard user login
POST /api/kid-auth/login      // Kid account login with code
POST /api/auth/token          // JWT token generation
GET  /api/user/profile        // User profile
POST /api/user/switch-account // Parent switches to kid account
```

**Database Tables:**
- `Users` - All user accounts (adults + kids)
- `ParentKidRelationships` - Parent-kid associations
- `Sessions` - Active sessions

**Integrations:**
- ✅ Validates login codes with **Kinder Service**
- ✅ Generates JWT tokens for authenticated users
- ✅ Manages account switching for parents

---

### **2. Kinder Service (Port 5XXX) - Kid Features** ⭐
**Primary Responsibility:** All kid-specific functionality

**Endpoints:**
```typescript
// QR Code & Login Management
POST   /api/kinder/generate-login-code
GET    /api/kinder/login-codes/{kidId}
DELETE /api/kinder/login-codes/{codeId}
POST   /api/kinder/validate-login-code

// Maturity Assessment
POST /api/kinder/assess-maturity
GET  /api/kinder/{kidId}/maturity-score
POST /api/kinder/{kidId}/update-maturity

// Behavioral Tracking
POST /api/kinder/behavior/track-activity
GET  /api/kinder/behavior/{kidId}/metrics
POST /api/kinder/behavior/{kidId}/update-score

// Password Management
POST /api/kinder/{kidId}/set-password
POST /api/kinder/{kidId}/revoke-password
GET  /api/kinder/{kidId}/password-status

// Parental Controls
POST /api/kinder/{kidId}/time-restrictions
POST /api/kinder/{kidId}/content-filters
GET  /api/kinder/{kidId}/controls
```

**Database Tables:**
- `KidLoginCodes` - QR codes and login codes
- `MaturityScores` - Maturity assessment scores
- `BehaviorMetrics` - Behavioral tracking data
- `KidPasswordSettings` - Password lifecycle management
- `TimeRestrictions` - Time-based access controls
- `ContentFilters` - Content filtering rules

**Kafka Events Published:**
```typescript
// Maturity changes
'kid-maturity-updated'
'kid-maturity-level-changed'

// Password events
'kid-password-set'
'kid-password-changed'
'kid-password-revoked'

// Behavioral events
'kid-behavior-tracked'
'kid-independence-day-reached'
```

**Integrations:**
- ✅ Provides login code validation to **Officer Service**
- ✅ Receives activity events from **Social Service**
- ✅ Publishes parent notifications to **Notifications Service**

---

### **3. Social Service (Port 5000) - Content & Interaction**
**Primary Responsibility:** Social features and content management

**Endpoints:**
```typescript
GET  /api/posts/feed          // Social feed
POST /api/posts               // Create post
GET  /api/posts/{id}          // Get post
POST /api/posts/{id}/like     // Like post
POST /api/posts/{id}/comment  // Comment on post
```

**Database Tables:**
- `Posts` - Social posts
- `Comments` - Post comments
- `Likes` - Post likes
- `ActivityLog` - User activity tracking

**Kafka Events Published:**
```typescript
// Activity tracking for behavioral scoring
'kid-activity-tracked'      // Post created, commented, liked
'kid-content-viewed'        // Content access tracking
'kid-social-interaction'    // Interaction with other users
```

**Integrations:**
- ✅ Sends activity events to **Kinder Service** for behavioral tracking
- ✅ Queries **Kinder Service** for content filtering rules
- ✅ Enforces time restrictions from **Kinder Service**

---

### **4. Notifications Service (Port 5004) - Alerts**
**Primary Responsibility:** Parent notifications and alerts

**Endpoints:**
```typescript
GET  /api/notifications       // Get notifications
POST /api/notifications/read  // Mark as read
```

**Database Tables (MongoDB):**
- `Notifications` - All notifications
- `ParentAlerts` - Parent-specific alerts

**Kafka Events Consumed:**
```typescript
// From Kinder Service
'kid-maturity-updated'
'kid-password-changed'
'kid-independence-day-reached'

// From Social Service
'kid-inappropriate-content-detected'
```

**Integrations:**
- ✅ Listens to **Kinder Service** events
- ✅ Listens to **Social Service** events
- ✅ Sends real-time notifications via SignalR

---

## 🔄 **Data Flow Examples**

### **Example 1: Kid Login via QR Code**
```
1. Parent opens web app
2. Parent navigates to "Kid Account Management"
3. Parent clicks "Generate Login Code"
   ├─ Frontend → POST /api/kinder/generate-login-code
   └─ Kinder Service creates code, stores in DB, returns QR code
4. Kid scans QR code on device
5. Kid device sends code to backend
   ├─ Frontend → POST /api/kid-auth/login (with code)
   ├─ Officer Service → Validates with Kinder Service
   └─ Kinder Service → Checks code validity, not expired, not used
6. Officer Service generates JWT token
7. Kid is authenticated and logged in
```

### **Example 2: Behavioral Tracking**
```
1. Kid creates a post in Social Service
   ├─ POST /api/posts (authenticated as kid)
   └─ Social Service creates post
2. Social Service publishes activity event to Kafka
   ├─ Topic: 'kid-activity-tracked'
   └─ Event: { kidId, action: 'post_created', contentType, timestamp }
3. Kinder Service consumes event
   ├─ Updates BehaviorMetrics table
   ├─ Recalculates maturity score
   └─ If score changes level, publishes 'kid-maturity-level-changed'
4. Notifications Service consumes maturity event
   ├─ Creates notification for parent
   └─ Sends real-time alert via SignalR
```

### **Example 3: Parent Sets Password**
```
1. Parent opens "Kid Account Management"
2. Parent clicks "Set Password" for kid
   ├─ Frontend → POST /api/kinder/{kidId}/set-password
   └─ Kinder Service:
       ├─ Creates password in Users table (Officer DB)
       ├─ Updates KidPasswordSettings table
       ├─ Sets PasswordSetByParent = true
       ├─ Sets CanChangePassword = true (based on maturity)
       └─ Publishes 'kid-password-set' event to Kafka
3. Notifications Service consumes event
   ├─ Creates confirmation notification for parent
   └─ Sends email confirmation
4. Kid can now login with password OR QR code
```

## 🎯 **Why This Architecture?**

### **✅ Separation of Concerns**
- **Officer Service:** Only handles authentication, no kid logic
- **Kinder Service:** All kid features in one place
- **Social Service:** Focuses on content, not kid management

### **✅ Scalability**
- Each service can scale independently
- Kinder Service can handle millions of kid accounts
- No bottlenecks in Officer Service

### **✅ Maintainability**
- Kid features isolated in Kinder Service
- Easy to add new kid-specific features
- Changes don't affect other services

### **✅ Security**
- Kid data isolated in Kinder Service database
- Parent-kid relationships strictly enforced
- Password management separated from general auth

### **✅ Event-Driven**
- Loosely coupled services
- Real-time parent notifications
- Behavioral tracking without tight coupling

## 📝 **Implementation Priority**

### **Phase 1: Foundation**
1. ✅ Create Kinder Service project
2. ✅ Set up database and migrations
3. ✅ Implement QR code generation
4. ✅ Implement login code validation

### **Phase 2: Integration**
1. ✅ Officer Service integration
2. ✅ Frontend kid login screen
3. ✅ Kafka event publishing
4. ✅ Notifications Service integration

### **Phase 3: Advanced Features**
1. ✅ Maturity assessment
2. ✅ Behavioral tracking
3. ✅ Password management
4. ✅ Parental controls

---

*Last Updated: October 7, 2025*
*Architecture Version: 2.0*
*Status: Planning Complete, Ready for Implementation*
