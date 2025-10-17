# Debugging Incoming Call Notifications

## Problem
The callee (patrick.jane) is not seeing the incoming call notification when someone calls them.

## Root Cause
The SignalR connection was only being established when a user **initiated** a call, not when they loaded the app. This meant that potential callees weren't connected to the SignalR hub and couldn't receive `IncomingCall` notifications.

## Fix Applied
1. **Added `connect()` method to `call.service.ts`**: A public method that proactively establishes the SignalR connection.
2. **Updated `CallContext.tsx`**: Now calls `callService.connect()` when the user is authenticated, establishing the connection immediately on app load.

## Testing Steps

### 1. Open Two Browser Windows
- Window 1: Teresa Lisbon (the caller)
- Window 2: Patrick Jane (the callee)

### 2. Check Browser Console for patrick.jane
You should see these logs when patrick.jane loads the app:
```
CallContext: Module loaded
CallProvider: Component function called
CallProvider: Component mounted/updated { isAuthenticated: true, userId: "...", username: "patrick.jane", isSetupComplete: false }
CallContext: Initializing call service for user: <userId>
CallContext: Setting up call service event handlers
CallContext: Establishing SignalR connection for incoming calls
CallService: Connecting to SignalR hub...
Call service connected to Seer service
CallContext: SignalR connection established for user: <userId>
```

### 3. Check Seer Service Backend Logs (patrick.jane connection)
You should see:
```
User <patrick.jane-userId> connected to signaling hub with connection <connectionId> and added to group user_<userId>
```

### 4. Start a Call from teresa.lisbon
In Window 1 (teresa.lisbon), click the voice or video call button.

### 5. Check Seer Service Backend Logs (during call initiation)
You should see:
```
Call started: <callId> from <teresa-userId> to <patrick-userId>
Sending IncomingCall notification to user_<patrick-userId> for call <callId>
IncomingCall notification sent to user_<patrick-userId>
```

### 6. Check patrick.jane Browser Console (during incoming call)
You should see:
```
CallService: Incoming call received via SignalR: { CallId: "...", CallerId: "...", CallType: 0, ConversationId: "...", CreatedAt: "..." }
CallContext: Incoming call received: { CallId: "...", CallerId: "...", CallType: 0, ... }
```

### 7. Check patrick.jane UI
The call modal should appear with:
- Caller information
- "Incoming call" status
- Answer and Reject buttons

## Key Debugging Points

### If patrick.jane doesn't see "Call service connected to Seer service":
- Check if JWT token is present in localStorage
- Check browser console for authentication errors
- Verify patrick.jane is fully authenticated before CallContext initializes

### If patrick.jane is connected but doesn't receive the notification:
- Verify the SignalR group name matches: `user_<userId>`
- Check if the userId from the JWT token matches the CalleeId in the API call
- Look for any SignalR disconnections in the browser console

### If the UI doesn't update:
- Check if the `incomingCall` event handler is firing in `CallContext`
- Verify `setShowCallModal(true)` is being called
- Check if `CallModal` is rendered when `showCallModal` is true

## Additional Debugging
If issues persist, add this temporary logging to `CallContext.tsx`:

```typescript
useEffect(() => {
  console.log('🎯 CallContext State Update:', {
    incomingCall,
    showCallModal,
    currentCall,
    callStatus,
    isSetupComplete,
    isConnected
  });
}, [incomingCall, showCallModal, currentCall, callStatus, isSetupComplete, isConnected]);
```

This will help you see all state changes in real-time.

