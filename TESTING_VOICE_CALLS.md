# 🎙️ **Testing Voice Calls on a Single PC**

## 📋 **Overview**

This guide explains how to test the voice calling functionality on a single development machine using multiple browser instances or profiles.

---

## 🚀 **Method 1: Multiple Browser Windows (Recommended)**

### **Step 1: Start the Seer Service**
```powershell
cd Backend\innkt.Seer
dotnet run
```

The Seer service should start on **Port 5267**.

### **Step 2: Start the Frontend (If not already running)**
```powershell
cd Frontend\innkt.react
npm start
```

The frontend should start on **Port 3001**.

### **Step 3: Open Multiple Browser Windows**

**Option A: Use Different Browser Profiles**
1. **Chrome**:
   - Window 1: Normal Chrome (User A)
   - Window 2: Chrome Incognito (User B) - Press `Ctrl+Shift+N`
   
2. **Firefox**:
   - Window 1: Normal Firefox (User A)
   - Window 2: Firefox Private Window (User B) - Press `Ctrl+Shift+P`

**Option B: Use Different Browsers**
- Window 1: Chrome (User A)
- Window 2: Firefox (User B)
- Window 3: Edge (User C) - Optional

### **Step 4: Login with Different Users**

In **each browser window**, login with a different user account:

**Window 1 (User A)**:
```
Email: lisbon@innkt.com
Password: (your password)
```

**Window 2 (User B)**:
```
Email: (another user email)
Password: (another password)
```

### **Step 5: Navigate to Messaging**

In both windows:
1. Click on **Messages** in the left sidebar
2. In Window 1 (User A): Find User B in conversations or start a new conversation
3. In Window 2 (User B): Find User A in conversations or start a new conversation

### **Step 6: Initiate a Call**

**From Window 1 (User A)**:
1. Open the conversation with User B
2. Click the **phone icon** in the chat header
3. Wait for the call to connect

**In Window 2 (User B)**:
1. You should see an incoming call notification
2. Click **Accept** to join the call

### **Step 7: Test Call Features**

Once connected, test:
- ✅ **Mute/Unmute**: Click the microphone icon
- ✅ **End Call**: Click the red phone icon
- ✅ **Call Quality**: Check the quality indicator
- ✅ **Notifications**: Verify real-time notifications appear

---

## 🔧 **Method 2: Chrome DevTools Device Emulation**

### **Step 1: Open DevTools**
1. Press `F12` or `Ctrl+Shift+I`
2. Click the **Toggle device toolbar** icon (or press `Ctrl+Shift+M`)

### **Step 2: Configure Two Devices**
1. **Window 1**: Desktop view
2. **Window 2**: Mobile device emulation (e.g., iPhone 12)

### **Step 3: Follow Steps 4-7 from Method 1**

---

## 🎯 **Method 3: Multiple Chrome Profiles (Advanced)**

### **Step 1: Create a New Chrome Profile**
1. Click your **profile icon** in Chrome (top right)
2. Click **Add** → **Create a new profile**
3. Name it "Test User 2"

### **Step 2: Open Chrome with Both Profiles**
1. **Profile 1** (Default): Login as User A
2. **Profile 2** (Test User 2): Login as User B

### **Step 3: Follow Steps 5-7 from Method 1**

---

## 🐛 **Troubleshooting**

### **Issue 1: 404 Error when starting a call**
**Solution**: 
- ✅ Ensure Seer service is running on port 5267
- ✅ Check `Frontend/innkt.react/src/config/environment.ts` has:
  ```typescript
  seer: 'http://localhost:5267'
  ```
- ✅ Verify `call.service.ts` is using `seerApi` instead of `messagingApi`

### **Issue 2: Microphone Permission Denied**
**Solution**:
- Click the **lock icon** in the browser address bar
- Allow microphone access
- Refresh the page and try again

### **Issue 3: Cannot hear audio**
**Causes**:
- Both users are using the same physical microphone/speakers
- Audio feedback creates an echo

**Solutions**:
1. **Use headphones** in at least one window
2. **Mute one user's microphone** in system settings
3. **Use virtual audio devices** (advanced)

### **Issue 4: WebRTC Connection Fails**
**Check**:
1. Browser console for errors (Press `F12`)
2. Network tab in DevTools for failed requests
3. Seer service logs for connection errors

### **Issue 5: SignalR Connection Errors**
**Solution**:
- Ensure authentication tokens are valid
- Check browser console for WebSocket errors
- Verify Seer service is running and accessible

---

## 📊 **Testing Checklist**

### **Basic Functionality**
- [ ] Start a call from User A to User B
- [ ] User B receives incoming call notification
- [ ] User B can accept the call
- [ ] User B can reject the call
- [ ] Audio connection establishes successfully
- [ ] Both users can hear each other
- [ ] Call quality indicator shows green (good)

### **Call Controls**
- [ ] Mute button works (microphone icon)
- [ ] Unmute button works
- [ ] End call button works (red phone icon)
- [ ] Call ends for both users when one hangs up

### **UI/UX**
- [ ] Call modal displays correctly
- [ ] Profile pictures show in call modal
- [ ] Call status updates (ringing → connecting → active)
- [ ] Call duration timer works
- [ ] Quality indicators update in real-time

### **Error Handling**
- [ ] User A can call User B when User B is offline (should show as missed call)
- [ ] Call fails gracefully if connection drops
- [ ] Proper error messages display
- [ ] UI doesn't break on errors

### **Notifications**
- [ ] Incoming call notification appears
- [ ] Call connected notification appears
- [ ] Call ended notification appears
- [ ] Missed call notification appears (if applicable)

---

## 🎓 **Advanced Testing: Virtual Audio Devices**

For more realistic testing without audio feedback issues:

### **Windows: VB-Audio Virtual Cable**
1. Download **VB-Audio Virtual Cable** (free)
2. Install and restart your PC
3. Set **Virtual Cable** as output in one browser window
4. Set **Virtual Cable** as input in the other window

### **macOS: BlackHole**
1. Download **BlackHole** (free, open-source)
2. Install using the installer
3. Configure **Audio MIDI Setup** to route audio between windows

### **Linux: PulseAudio**
1. Use `pavucontrol` to create virtual sinks
2. Route audio between different browser instances

---

## 📝 **Expected Console Logs**

### **User A (Caller)**
```
🔌 Call service connected to Seer service
Starting voice call to <User B ID>
📞 Creating WebRTC peer connection
📡 Sending offer to User B
✅ Received answer from User B
🎙️ Audio connection established
```

### **User B (Callee)**
```
📞 Incoming call from <User A>
📡 Received WebRTC offer
📞 Creating answer
✅ Sent answer to User A
🎙️ Audio connection established
```

---

## 🔍 **Debugging Tips**

1. **Open Browser Console** (`F12`) in both windows
2. **Enable verbose logging** in Seer service
3. **Check Network tab** for failed API requests
4. **Monitor WebSocket connections** in DevTools
5. **Check SignalR connection** status
6. **Verify Kafka** events are being published (if Kafka is running)

---

## ✅ **Success Criteria**

Your implementation is working correctly if:
1. ✅ User A can initiate a call to User B
2. ✅ User B receives the incoming call notification instantly
3. ✅ Audio connection establishes within 2-3 seconds
4. ✅ Both users can hear each other clearly
5. ✅ Call controls (mute, end) work as expected
6. ✅ Call ends cleanly for both users
7. ✅ No console errors during the call flow

---

## 🚨 **Common Pitfalls**

1. **Same Microphone/Speakers**: Creates audio feedback loop
   - **Solution**: Use headphones or mute one user
   
2. **Browser Permissions**: Microphone access denied
   - **Solution**: Allow microphone in browser settings
   
3. **Seer Service Not Running**: 404 errors
   - **Solution**: Start the Seer service first
   
4. **Authentication Issues**: Unauthorized errors
   - **Solution**: Ensure both users are logged in with valid tokens

5. **WebRTC ICE Failures**: Connection cannot establish
   - **Solution**: Check firewall settings, ensure STUN servers are accessible

---

## 📞 **Quick Test Script**

### **Automated Testing (Optional)**

You can use this simple test flow:

1. **Window 1**: Login → Go to Messages → Select User B → Click Call
2. **Window 2**: Wait for notification → Click Accept
3. **Test**: Speak in Window 1, verify audio in Window 2
4. **Test**: Click Mute in Window 1, verify silence in Window 2
5. **Test**: Click End Call in Window 1, verify call ends in Window 2

---

## 📚 **Additional Resources**

- **WebRTC Debugging**: chrome://webrtc-internals (Chrome)
- **SignalR Debugging**: Browser DevTools → Network → WS (WebSocket)
- **Audio Devices**: chrome://settings/content/microphone

---

**Last Updated**: January 16, 2025  
**Status**: Ready for Testing  
**Next**: Video Calling (Phase 2C)
