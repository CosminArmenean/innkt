# Kid Account Implementation Roadmap

## 🎯 **Project Overview**
Implementing maturity-based kid account system with QR code authentication, password management, and behavioral tracking.

## 📊 **Maturity Assessment Formula**
```typescript
interface MaturityScore {
  ageScore: number;           // 0-40 points (age 6-16)
  parentAssessment: number;   // 0-30 points (parent rating 0-5)
  behavioralTracking: number; // 0-30 points (behavior metrics)
  totalScore: number;         // 0-100 points
  level: 'low' | 'medium' | 'high';
}
```

## 🏗️ **Microservice Architecture**

### **Officer Service (Port 5001) - Authentication**
- User authentication and authorization
- JWT token generation for kid accounts
- Account verification
- Parent-kid relationship verification

### **Kinder Service (Port 5XXX) - Primary Kid Features** ⭐
- QR code generation/validation
- Login code management
- Maturity score calculation
- Behavioral tracking
- Password lifecycle management
- Parental controls (time restrictions, content filters)
- Activity monitoring
- Independence day logic

### **Social Service (Port 5000) - Content & Interaction**
- Kid-friendly content filtering
- Social interaction metrics
- Activity feed for behavioral tracking
- Content appropriateness scoring

### **Notifications Service (Port 5004) - Alerts**
- Parent notifications
- Maturity updates
- Password change alerts
- Independence day notifications
- Behavioral alerts

## 📱 **Implementation Phases**

### **Phase 1: Foundation (Weeks 1-2)**
**Backend Tasks (Kinder Service):**
- [ ] Set up Kinder Service project structure
- [ ] Create database tables (KidLoginCodes, MaturityScores, BehaviorMetrics)
- [ ] Implement QR code generation API (`POST /api/kinder/generate-login-code`)
- [ ] Implement login code validation API (`POST /api/kinder/validate-login-code`)
- [ ] Add maturity score calculation logic
- [ ] Create parent-kid relationship verification

**Backend Tasks (Officer Service):**
- [ ] Implement kid account authentication (`POST /api/kid-auth/login-with-code`)
- [ ] Add JWT token generation for kid accounts
- [ ] Integrate with Kinder service for code validation

**Frontend Tasks:**
- [ ] Update login screen with "Kid Account Login" button
- [ ] Create kid login modal/screen
- [ ] Implement QR code scanner (using `qrcode.react`)
- [ ] Add code input functionality
- [ ] Update QR code text to reflect kid device login purpose

**Files to Create/Modify:**
- `Backend/innkt.Kinder/Controllers/KinderAuthController.cs` (new)
- `Backend/innkt.Kinder/Models/KidLoginCode.cs` (new)
- `Backend/innkt.Kinder/Services/KinderAuthService.cs` (new)
- `Backend/innkt.Officer/Controllers/KidAuthController.cs` (new)
- `Frontend/innkt.react/src/components/auth/Login.tsx`
- `Frontend/innkt.react/src/components/accounts/KidAccountManagement.tsx`

### **Phase 2: Authentication System (Weeks 3-4)**
**Backend Tasks (Kinder Service):**
- [ ] Implement password lifecycle management
- [ ] Add behavioral tracking endpoints (`POST /api/kinder/behavior/track-activity`)
- [ ] Implement maturity-based authentication rules
- [ ] Add time restrictions API
- [ ] Create content filtering system

**Backend Tasks (Notifications Service):**
- [ ] Create parental notification system
- [ ] Add Kafka event consumers for kid account events
- [ ] Implement real-time parent alerts

**Backend Tasks (Officer Service):**
- [ ] Implement account switching logic
- [ ] Add parent-kid relationship management
- [ ] Integrate with Kinder service for authorization

**Frontend Tasks:**
- [ ] Add maturity assessment UI
- [ ] Implement password management interface
- [ ] Create parental control dashboard
- [ ] Add notification system
- [ ] Implement account switching for parents

**Files to Create/Modify:**
- `Backend/innkt.Kinder/Controllers/BehaviorController.cs` (new)
- `Backend/innkt.Kinder/Services/MaturityService.cs` (new)
- `Backend/innkt.Kinder/Services/PasswordService.cs` (new)
- `Backend/innkt.Notifications/Consumers/KidAccountEventConsumer.cs` (new)
- `Frontend/innkt.react/src/components/accounts/KidAccountManagement.tsx`
- `Frontend/innkt.react/src/components/auth/Login.tsx`

### **Phase 3: Behavioral Tracking (Weeks 5-6)**
**Backend Tasks (Kinder Service):**
- [ ] Implement behavior metrics collection
- [ ] Create maturity score recalculation
- [ ] Add parental reporting endpoints
- [ ] Implement independence day logic
- [ ] Add automated maturity progression

**Backend Tasks (Social Service):**
- [ ] Integrate with Kinder service for content tracking
- [ ] Send activity events to Kinder service via Kafka
- [ ] Implement kid-friendly content filtering

**Frontend Tasks:**
- [ ] Add behavioral tracking UI
- [ ] Create maturity score display
- [ ] Implement parental controls
- [ ] Add reporting dashboard
- [ ] Create time restriction interface

**Files to Create/Modify:**
- `Backend/innkt.Kinder/Controllers/BehaviorController.cs` (enhance)
- `Backend/innkt.Kinder/Services/BehaviorTrackingService.cs` (new)
- `Backend/innkt.Kinder/Services/MaturityProgressionService.cs` (new)
- `Backend/innkt.Social/Services/ActivityEventPublisher.cs` (new)
- `Frontend/innkt.react/src/components/accounts/KidAccountManagement.tsx`
- `Frontend/innkt.react/src/components/dashboard/ParentDashboard.tsx`

### **Phase 4: Advanced Features (Weeks 7-8)**
**Backend Tasks:**
- [ ] Implement content filtering levels
- [ ] Create social feature controls
- [ ] Implement parental monitoring
- [ ] Add advanced behavioral analytics
- [ ] Create independence day automation

**Frontend Tasks:**
- [ ] Add content filter settings
- [ ] Implement social controls
- [ ] Add monitoring dashboard
- [ ] Create advanced parental controls
- [ ] Implement maturity progression UI

## 🔄 **Mobile App Migration Plan**

### **Current Web Implementation**
- All features implemented in React web client
- Full functionality available on web
- Parental controls and kid management
- QR code generation and scanning

### **Future Mobile App Features**
- Native QR code scanner
- Push notifications for parents
- Offline capability for kid accounts
- Device-specific parental controls
- Biometric authentication for parents

### **Migration Strategy**
1. **Phase 1:** Web implementation (current)
2. **Phase 2:** Mobile app with same features
3. **Phase 3:** Enhanced mobile-specific features
4. **Phase 4:** Cross-platform synchronization

## 📊 **Database Schema**

### **Kinder Service Database** ⭐
```sql
-- Kid login codes
CREATE TABLE KidLoginCodes (
    Id UUID PRIMARY KEY,
    Code VARCHAR(50) UNIQUE NOT NULL,
    QRCodeData TEXT,
    KidAccountId UUID NOT NULL,
    ParentId UUID NOT NULL,
    ExpiresAt TIMESTAMP NOT NULL,
    IsUsed BOOLEAN DEFAULT FALSE,
    RevokedAt TIMESTAMP NULL,
    CreatedAt TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (KidAccountId) REFERENCES Users(Id),
    FOREIGN KEY (ParentId) REFERENCES Users(Id)
);

-- Maturity scores
CREATE TABLE MaturityScores (
    Id UUID PRIMARY KEY,
    KidAccountId UUID NOT NULL,
    AgeScore INTEGER,
    ParentAssessment INTEGER,
    BehavioralScore INTEGER,
    TotalScore INTEGER,
    Level VARCHAR(10), -- 'low', 'medium', 'high'
    LastUpdated TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (KidAccountId) REFERENCES Users(Id)
);

-- Behavioral metrics
CREATE TABLE BehaviorMetrics (
    Id UUID PRIMARY KEY,
    KidAccountId UUID NOT NULL,
    TimeManagement INTEGER,
    ContentAppropriateness INTEGER,
    SocialInteraction INTEGER,
    ResponsibilityScore INTEGER,
    SecurityAwareness INTEGER,
    RecordedAt TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (KidAccountId) REFERENCES Users(Id)
);

-- Password settings
CREATE TABLE KidPasswordSettings (
    Id UUID PRIMARY KEY,
    KidAccountId UUID NOT NULL,
    HasPassword BOOLEAN DEFAULT FALSE,
    PasswordSetByParent BOOLEAN DEFAULT TRUE,
    FirstPasswordSetAt TIMESTAMP NULL,
    LastPasswordChangeAt TIMESTAMP NULL,
    PasswordChangedByKid BOOLEAN DEFAULT FALSE,
    IndependenceDay TIMESTAMP NULL,
    CanChangePassword BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (KidAccountId) REFERENCES Users(Id)
);

-- Time restrictions
CREATE TABLE TimeRestrictions (
    Id UUID PRIMARY KEY,
    KidAccountId UUID NOT NULL,
    DayOfWeek INTEGER, -- 0-6 (Sunday-Saturday)
    StartTime TIME,
    EndTime TIME,
    IsActive BOOLEAN DEFAULT TRUE,
    CreatedAt TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (KidAccountId) REFERENCES Users(Id)
);

-- Content filters
CREATE TABLE ContentFilters (
    Id UUID PRIMARY KEY,
    KidAccountId UUID NOT NULL,
    FilterLevel VARCHAR(20), -- 'strict', 'moderate', 'relaxed'
    BlockedKeywords TEXT[],
    AllowedCategories TEXT[],
    IsActive BOOLEAN DEFAULT TRUE,
    UpdatedAt TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (KidAccountId) REFERENCES Users(Id)
);
```

## 🎯 **Success Metrics**

### **Technical Metrics**
- [ ] QR code generation < 2 seconds
- [ ] Login validation < 1 second
- [ ] Maturity score calculation < 500ms
- [ ] Parent notification delivery < 5 seconds

### **User Experience Metrics**
- [ ] Parent can set up kid account in < 5 minutes
- [ ] Kid can login with QR code in < 30 seconds
- [ ] Maturity assessment completion in < 3 minutes
- [ ] Parental control setup in < 2 minutes

### **Security Metrics**
- [ ] QR codes expire within set timeframe
- [ ] Parent notifications for all password changes
- [ ] Behavioral tracking accuracy > 90%
- [ ] Zero unauthorized access incidents

## 📝 **Change Log**

### **Week 1 (Current)**
- [x] Remove duplicate "Kid Account Management" header
- [x] Update QR code text to reflect kid device login purpose
- [x] Evaluate time restriction tools
- [x] Create implementation roadmap
- [x] Map microservice architecture

### **Week 2 (Planned)**
- [ ] Implement QR code generation API
- [ ] Create kid login screen
- [ ] Add QR code scanner functionality
- [ ] Implement code input system

### **Week 3 (Planned)**
- [ ] Add maturity assessment system
- [ ] Implement password management
- [ ] Create parental notification system
- [ ] Add account switching logic

### **Week 4 (Planned)**
- [ ] Implement behavioral tracking
- [ ] Add maturity score recalculation
- [ ] Create parental reporting
- [ ] Add independence day logic

## 🚀 **Next Steps**

1. **Start Phase 1** - Foundation and basic QR code system
2. **Implement maturity assessment** - Parent rating + behavioral tracking
3. **Add password management** - Parent-controlled with kid autonomy
4. **Create unified login** - Adult-focused with kid option
5. **Implement behavioral tracking** - Continuous maturity assessment

## 📞 **Contact & Support**

- **Lead Developer:** AI Assistant
- **Project Manager:** User
- **Architecture:** Microservices (Officer, Social, Notifications)
- **Frontend:** React Web Client
- **Future:** Mobile App (iOS/Android)

---

*Last Updated: October 7, 2025*
*Version: 1.0*
*Status: In Development*
