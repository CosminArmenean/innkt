# Phase 2: Enhanced Authentication & Notifications

## 🎯 **Overview**
Phase 2 builds on Phase 1's foundation by adding:
- Full password management UI
- Parent notifications via Kafka
- Behavioral tracking endpoints
- Time restrictions enforcement
- Content filtering
- Account switching for parents

---

## 📋 **Detailed Task Breakdown**

### **1. Password Management System** 🔐

#### **Backend (Kinder Service):**
**Already Implemented:**
- ✅ Password lifecycle tracking (`KidPasswordSettings` model)
- ✅ Set password endpoint
- ✅ Change password endpoint
- ✅ Revoke password endpoint
- ✅ Independence day logic

**To Implement:**
- [ ] Password strength validation
- [ ] Password change history tracking
- [ ] Password reset flow for kids
- [ ] Password expiration rules

**New Endpoints:**
```csharp
POST /api/kinder/{kidAccountId}/reset-password
GET  /api/kinder/{kidAccountId}/password-history
POST /api/kinder/{kidAccountId}/set-independence-day
```

#### **Frontend:**
**To Implement:**
- [ ] Password set form (for parents)
- [ ] Password strength indicator
- [ ] Independence day picker
- [ ] Password change form (for kids)
- [ ] Password settings UI in Kid Account Management

**Components:**
- `PasswordManagementPanel.tsx` (new)
- `SetPasswordModal.tsx` (new)
- `IndependenceDayPicker.tsx` (new)

---

### **2. Parent Notification System** 📢

#### **Backend (Notifications Service):**
**To Implement:**
- [ ] Kafka consumer for kid account events
- [ ] Event handlers for:
  - `kid-login-code-generated`
  - `kid-maturity-updated`
  - `kid-password-changed`
  - `kid-password-revoked`
- [ ] Real-time SignalR notifications to parents
- [ ] Email notifications for critical events
- [ ] In-app notification display

**New File:**
```csharp
// Backend/innkt.Notifications/Consumers/KidAccountEventConsumer.cs
public class KidAccountEventConsumer : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        // Subscribe to kid account topics
        // Process events
        // Send notifications to parents
    }
}
```

**Events to Handle:**
```json
// kid-login-code-generated
{
  "EventType": "kid-login-code-generated",
  "KidAccountId": "guid",
  "ParentId": "guid",
  "ExpiresAt": "2025-10-14T...",
  "MaturityLevel": "medium"
}
→ Notification: "Login code generated for Alex. Expires Oct 14."

// kid-password-changed
{
  "EventType": "kid-password-changed",
  "KidAccountId": "guid",
  "ChangedByParent": false
}
→ Notification: "Alex changed their password."

// kid-maturity-updated
{
  "EventType": "kid-maturity-updated",
  "KidAccountId": "guid",
  "Level": "medium",
  "PreviousLevel": "low"
}
→ Notification: "Alex's maturity level increased to Medium! 🎉"
```

#### **Frontend:**
**To Implement:**
- [ ] Real-time notification display for parents
- [ ] Notification bell badge
- [ ] Kid account activity feed
- [ ] Notification settings (email/in-app/push)

---

### **3. Behavioral Tracking** 📊

#### **Backend (Kinder Service):**
**To Implement:**
- [ ] Behavioral tracking endpoints
- [ ] Activity event processing
- [ ] Automatic maturity recalculation
- [ ] Behavioral metrics aggregation

**New Endpoints:**
```csharp
POST /api/kinder/behavior/track-activity
GET  /api/kinder/behavior/{kidId}/metrics
POST /api/kinder/behavior/{kidId}/update-score
GET  /api/kinder/behavior/{kidId}/history
```

**Activity Events:**
```json
{
  "kidAccountId": "guid",
  "activityType": "post_created",
  "contentType": "educational",
  "timestamp": "2025-10-07T...",
  "metadata": {
    "postId": "guid",
    "groupId": "guid"
  }
}
```

#### **Backend (Social Service):**
**To Implement:**
- [ ] Publish kid activity events to Kafka
- [ ] Track content appropriateness
- [ ] Track social interactions
- [ ] Send events to `kid-activity-tracked` topic

**Integration Points:**
```csharp
// When kid creates post
await PublishActivityEvent("post_created", kidId, metadata);

// When kid comments
await PublishActivityEvent("comment_posted", kidId, metadata);

// When kid likes
await PublishActivityEvent("content_liked", kidId, metadata);
```

#### **Frontend:**
**To Implement:**
- [ ] Behavioral metrics dashboard
- [ ] Maturity score visualization
- [ ] Activity timeline
- [ ] Progress tracking

**Components:**
- `BehavioralMetricsPanel.tsx` (new)
- `MaturityScoreCard.tsx` (new)
- `ActivityTimeline.tsx` (new)

---

### **4. Time Restrictions** ⏰

#### **Backend (Kinder Service):**
**Already Have:**
- ✅ `TimeRestrictions` table in database
- ✅ Fields in `KidAccount` model (MaxDailyTimeMinutes, AllowedHoursStart, AllowedHoursEnd)

**To Implement:**
- [ ] Time restriction enforcement middleware
- [ ] Daily usage tracking
- [ ] Time-based access control
- [ ] School mode implementation

**New Endpoints:**
```csharp
POST /api/kinder/{kidId}/time-restrictions
GET  /api/kinder/{kidId}/time-restrictions
PUT  /api/kinder/{kidId}/time-restrictions/{id}
GET  /api/kinder/{kidId}/usage-today
POST /api/kinder/{kidId}/check-access
```

#### **Frontend:**
**To Implement:**
- [ ] Time restriction settings UI
- [ ] Daily schedule editor
- [ ] Usage meter display
- [ ] School mode toggle

**UI Components:**
- `TimeRestrictionsPanel.tsx` (new)
- `DailyScheduleEditor.tsx` (new)
- `UsageMeter.tsx` (new)

---

### **5. Content Filtering** 🛡️

#### **Backend (Kinder Service):**
**Already Have:**
- ✅ `ContentFilters` table
- ✅ `ContentSafetyRule` model

**To Implement:**
- [ ] Content filtering API
- [ ] Keyword blocking
- [ ] Category whitelisting/blacklisting
- [ ] Age-appropriate content scoring

**New Endpoints:**
```csharp
POST /api/kinder/{kidId}/content-filters
GET  /api/kinder/{kidId}/content-filters
POST /api/kinder/content/check-safety
GET  /api/kinder/content/safe-content-suggestions
```

#### **Backend (Social Service):**
**To Implement:**
- [ ] Check content safety before displaying to kids
- [ ] Filter posts based on kid age/maturity
- [ ] Hide inappropriate content

**Integration:**
```csharp
// Before showing content to kid
var isSafe = await CheckContentSafety(postContent, kidAccountId);
if (!isSafe) {
    // Hide or blur content
}
```

#### **Frontend:**
**To Implement:**
- [ ] Content filter settings UI
- [ ] Blocked keywords manager
- [ ] Allowed categories selector
- [ ] Filter level (Strict/Moderate/Relaxed)

---

### **6. Account Switching** 🔄

#### **Backend (Officer Service):**
**To Implement:**
- [ ] Parent can switch to kid account
- [ ] Maintain parent session while acting as kid
- [ ] Switch back to parent account
- [ ] Audit trail for account switches

**New Endpoints:**
```csharp
POST /api/auth/switch-to-kid-account
POST /api/auth/switch-back-to-parent
GET  /api/auth/current-acting-as
```

#### **Frontend:**
**To Implement:**
- [ ] Account switcher UI (dropdown)
- [ ] "Acting as [kid name]" indicator
- [ ] Quick switch between parent and kid views
- [ ] Switch back button

**UI:**
```
┌────────────────────────────┐
│ Patrick Jane              │
│ ▼ Switch Account           │
├────────────────────────────┤
│ ✓ Patrick Jane (You)      │
│   Alex Johnson (Kid)       │
│   Emma Johnson (Kid)       │
└────────────────────────────┘
```

---

## 📊 **Phase 2 Summary**

### **What You'll Have After Phase 2:**

✅ **Full Password System:**
- Parent sets first password
- Kid can change password
- Independence day automation
- Password history tracking

✅ **Parent Notifications:**
- Real-time alerts for kid activities
- Email notifications
- In-app notification center
- Customizable notification settings

✅ **Behavioral Tracking:**
- Automatic activity tracking
- Maturity score updates
- Behavioral metrics dashboard
- Progress visualization

✅ **Time Restrictions:**
- Daily usage limits
- Time window enforcement
- School mode
- Usage tracking

✅ **Content Filtering:**
- Age-appropriate content
- Keyword blocking
- Category filtering
- Safety scoring

✅ **Account Switching:**
- Parent can act as kid
- Easy switching between accounts
- Audit trail
- Session management

---

## 🎯 **Effort Estimation**

| Task | Complexity | Time Estimate |
|------|------------|---------------|
| Password Management UI | Medium | 2-3 days |
| Parent Notifications | Medium | 3-4 days |
| Behavioral Tracking | High | 5-7 days |
| Time Restrictions | Medium | 2-3 days |
| Content Filtering | High | 4-5 days |
| Account Switching | Low | 1-2 days |

**Total Phase 2 Estimate:** 3-4 weeks

---

## 📝 **Dependencies**

**Phase 2 depends on Phase 1:**
- ✅ Kid accounts exist
- ✅ Login codes work
- ✅ Maturity scoring foundation
- ✅ Kafka infrastructure

**Phase 2 enables Phase 3:**
- Behavioral tracking → Automatic maturity updates
- Time restrictions → Usage analytics
- Content filtering → Safety reports

---

## 🚀 **When to Start Phase 2?**

**Recommended:** After successfully testing Phase 1

**Test Phase 1 first:**
1. QR code generation works
2. Kid login works
3. Authentication completes
4. No critical bugs

**Then proceed to Phase 2:**
1. Parent notifications (highest priority)
2. Password management UI
3. Behavioral tracking
4. Time restrictions
5. Content filtering
6. Account switching

---

**Would you like to:**
1. **Test Phase 1 first** (recommended) ✅
2. **Start Phase 2 immediately** 
3. **Prioritize specific Phase 2 features**

I recommend testing Phase 1 first to ensure the foundation is solid! 🎯
