# 🚀 **INNKT Messaging & Calling System - Implementation Plan**

## 📋 **Project Overview**

Building a scalable, enterprise-grade messaging and calling system leveraging the existing microservices architecture with Kafka event-driven notifications.

### **🎯 Goals:**
- Scalable messaging system for thousands of concurrent users
- Professional video/voice calling with smart fallback
- Real-time notifications via Kafka + SignalR
- Conference calling (up to 4 users)
- Parental controls integration for kid accounts

---

## ✅ **COMPLETED PHASES**

### **Phase 1: UI/UX Improvements** ✅ **COMPLETED**
**Status:** 100% Complete  
**Duration:** 1 day  
**Commit:** `758a68d7` - "Implement Phase 1: UI/UX Improvements for Messaging System"

#### **Achievements:**
- ✅ **Increased Conversation List Width**: Changed from 3/9 to 4/8 column split (33% wider)
- ✅ **Enhanced Profile Pictures**: Added `convertToFullAvatarUrl` utility with error handling
- ✅ **Cleaned Chat Header**: Removed display names, shows only profile picture for modern look
- ✅ **Added Call Button**: Video call button in chat header for future functionality
- ✅ **Improved Avatar Display**: Consistent sizing, proper error handling, full URL conversion

#### **Technical Changes:**
- Added new `messaging` layout type to `PageLayout.tsx`
- Integrated `convertToFullAvatarUrl` in `ConversationList.tsx` and `MessagingDashboard.tsx`
- Enhanced chat header with call button and cleaner design
- Improved responsive design and theme consistency

---

## 🚧 **IN PROGRESS PHASES**

### **Phase 2A: Basic Voice Calling + Kafka Events** 🔄 **IN PROGRESS**
**Status:** 80% Complete - Core Implementation Done  
**Duration:** 2-3 days  
**Priority:** High

#### **Objectives:**
- ✅ Implement voice-only calling with Seer service integration
- ✅ Add basic Kafka call events for real-time notifications
- ✅ Create call UI components and user interface
- ✅ Integrate with existing MessagingContext for call state management

#### **Technical Requirements:**
1. **Frontend Components:** ✅ **COMPLETED**
   - ✅ Call interface modal/integration (`CallModal.tsx`)
   - ✅ Call controls (mute, end, add participant)
   - ✅ Call status indicators
   - ✅ Integration with chat header call button (`CallButton.tsx`)

2. **Backend Integration:** ✅ **COMPLETED**
   - ✅ Connect to Seer service SignalingHub (Port 5267) (`call.service.ts`)
   - ✅ Implement WebRTC peer connections for voice
   - ✅ Add Kafka call event publishing
   - ✅ Integrate with Notifications service for real-time alerts

3. **Kafka Events:** ✅ **COMPLETED**
   - ✅ `call.events` topic for call lifecycle events
   - ✅ `call.notifications` topic for notification events
   - ✅ Integration with existing Notifications service

#### **Deliverables:**
- ✅ Voice calling functionality (`CallService`, `CallContext`)
- ✅ Call UI components (`CallModal`, `CallButton`)
- ✅ Real-time call notifications (Kafka + SignalR integration)
- ✅ Integration with existing messaging system
- ✅ Basic call history (Kafka events)

#### **Remaining Tasks:**
- [ ] Test WebRTC connection with Seer service
- [ ] Verify Kafka event publishing and consumption
- [ ] Test end-to-end call flow
- [ ] Add error handling and edge cases

---

## 📅 **UPCOMING PHASES**

### **Phase 2B: Enhanced Notifications** 📋 **PLANNED**
**Status:** Pending Phase 2A  
**Duration:** 1-2 days  
**Priority:** High

#### **Objectives:**
- Add comprehensive call notification topics to Kafka
- Integrate with existing notification system
- Multi-device call notifications
- Call status synchronization across devices

#### **Technical Requirements:**
- Extend Notifications service with call event handlers
- Add call-specific notification templates
- Implement call notification routing
- Add parental notification controls for kid accounts

### **Phase 2C: Video Calling with Smart Fallback** 📋 **PLANNED**
**Status:** Pending Phase 2B  
**Duration:** 2-3 days  
**Priority:** Medium

#### **Objectives:**
- Video calling functionality with WebRTC
- Bandwidth detection and automatic fallback to voice
- Quality monitoring and adaptive bitrate
- Enhanced call UI with video controls

#### **Technical Requirements:**
- Video WebRTC implementation
- Bandwidth detection algorithms
- Quality monitoring and events
- Adaptive video quality controls

### **Phase 2D: Conference Calling** 📋 **PLANNED**
**Status:** Pending Phase 2C  
**Duration:** 2-3 days  
**Priority:** Medium

#### **Objectives:**
- Multi-participant support (up to 4 users)
- Participant management (add, remove, mute all)
- Conference call UI with participant grid
- Host controls and permissions

#### **Technical Requirements:**
- Multi-peer WebRTC connections
- Participant management system
- Conference call UI components
- Host permission controls

### **Phase 2E: Advanced Features** 📋 **PLANNED**
**Status:** Pending Phase 2D  
**Duration:** 1-2 days  
**Priority:** Low

#### **Objectives:**
- Call history integration with messaging
- Advanced parental controls for kid accounts
- Performance optimizations
- Analytics and monitoring

#### **Technical Requirements:**
- Call history storage and retrieval
- Parental notification controls
- Performance monitoring
- Call analytics and metrics

---

## 🏗️ **Technical Architecture**

### **Microservices Integration:**
```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Seer Service  │    │ Notifications    │    │ Messaging       │
│   (Port 5267)   │    │ Service          │    │ Service         │
│                 │    │ (Port 5006)      │    │ (Port 3000)     │
├─────────────────┤    ├──────────────────┤    ├─────────────────┤
│ • Call Signaling│    │ • Kafka Consumer │    │ • Conversation  │
│ • WebRTC Hub    │    │ • Event Processing│    │   Management    │
│ • Call Storage  │    │ • SignalR Hub    │    │ • Message Sync  │
│ • Participant   │    │ • Multi-channel  │    │ • User Status   │
│   Management    │    │   Delivery       │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────────┐
                    │   Kafka Topics      │
                    │                     │
                    │ • call.events       │ ← NEW
                    │ • call.notifications│ ← NEW  
                    │ • call.quality      │ ← NEW
                    │ • social.events     │ ← Existing
                    │ • user.actions      │ ← Existing
                    └─────────────────────┘
```

### **Kafka Topics for Calling:**
```csharp
public static class CallTopics
{
    public const string CallEvents = "call.events";
    public const string CallNotifications = "call.notifications";
    public const string CallQuality = "call.quality";
    public const string CallHistory = "call.history";
    public const string CallAnalytics = "call.analytics";
}
```

### **Call Event Types:**
```csharp
public enum CallEventType
{
    CallInitiated,
    CallRinging,
    CallAnswered,
    CallRejected,
    CallEnded,
    CallMissed,
    ParticipantJoined,
    ParticipantLeft,
    ParticipantMuted,
    ParticipantVideoToggled,
    QualityChanged,
    CallFailed
}
```

---

## 🎯 **Performance Targets**

### **Scalability Goals:**
- Support 1000+ concurrent voice calls
- Support 500+ concurrent video calls
- Sub-100ms call notification latency
- 99.9% call connection success rate

### **Quality Standards:**
- Voice calls: < 150ms latency, < 1% packet loss
- Video calls: 720p adaptive, bandwidth-aware
- Notifications: < 200ms delivery time
- UI responsiveness: < 50ms interaction response

---

## 📊 **Success Metrics**

### **Phase 2A Success Criteria:**
- [ ] Voice calls can be initiated and completed successfully
- [ ] Real-time call notifications work via SignalR
- [ ] Call events are properly published to Kafka
- [ ] Integration with existing messaging system is seamless
- [ ] UI components are responsive and user-friendly

### **Overall Project Success:**
- [ ] System handles 1000+ concurrent users
- [ ] Video calling with smart fallback works reliably
- [ ] Conference calling supports up to 4 participants
- [ ] Parental controls work for kid accounts
- [ ] Performance meets all target metrics

---

## 🔄 **Update Log**

### **2025-01-16**
- ✅ Created comprehensive implementation plan
- ✅ Completed Phase 1: UI/UX Improvements
- 🔄 Started Phase 2A: Basic Voice Calling + Kafka Events
- 📋 Planned all subsequent phases with detailed technical requirements

### **Next Update:** After Phase 2A completion

---

## 📝 **Notes & Decisions**

### **Key Technical Decisions:**
1. **Smart Fallback Strategy**: Video calls automatically fall back to voice when bandwidth is insufficient
2. **Kafka Integration**: Leverage existing Notifications service infrastructure for call events
3. **Seer Service**: Use existing WebRTC infrastructure (Port 5267) for all calling functionality
4. **Conference Limit**: Maximum 4 participants for optimal performance
5. **Parental Controls**: Integrate with existing kid safety notification system

### **Architecture Benefits:**
- Event-driven, highly scalable design
- Leverages existing proven infrastructure
- Real-time notifications across all devices
- Fault-tolerant with Kafka event replay
- Parental integration for family safety

---

**Last Updated:** January 16, 2025  
**Next Milestone:** Complete Phase 2A - Basic Voice Calling + Kafka Events  
**Project Status:** 🚧 Active Development
