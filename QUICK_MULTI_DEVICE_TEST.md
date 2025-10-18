# 🚀 Quick Multi-Device Testing Setup (Dirty Fix)

**Purpose:** Test audio functionality on 2 PCs ASAP  
**Time Required:** 10-15 minutes  
**Status:** Temporary solution for testing

---

## ⚡ Quick Setup Steps

### Step 1: Find Your PC's IP Address (2 minutes)

On your **main PC** (the one with the code), open PowerShell and run:

```powershell
ipconfig
```

Look for your **IPv4 Address** under Wi-Fi or Ethernet:
- Example: `192.168.1.100`
- Write it down: `192.168.1.6`

---

### Step 2: Update Backend Services CORS (5 minutes)

You need to allow connections from other devices. Update CORS in **3 backend services**:

#### 🔹 Service 1: Seer (Video Calls)

**File:** `Backend/innkt.Seer/Program.cs`

**Find (around line 78-86):**
```csharp
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.WithOrigins("http://localhost:3001", "http://localhost:3000")
              .AllowAnyMethod()
              .AllowAnyHeader()
              .AllowCredentials();
    });
});
```

**Replace with:**
```csharp
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.SetIsOriginAllowed(origin => true) // Allow all origins in development
              .AllowAnyMethod()
              .AllowAnyHeader()
              .AllowCredentials();
    });
});
```

#### 🔹 Service 2: Officer (Authentication)

**File:** `Backend/innkt.Officer/Program.cs` (if exists, same CORS fix)

Apply the same CORS change as above.

#### 🔹 Service 3: Messaging

**File:** `Backend/innkt.Messaging/src/server.js`

**Find the CORS section:**
```javascript
app.use(cors({
  origin: ['http://localhost:3001', 'http://localhost:3000'],
  credentials: true
}));
```

**Replace with:**
```javascript
app.use(cors({
  origin: true, // Allow all origins in development
  credentials: true
}));
```

---

### Step 3: Update Frontend Configuration (3 minutes)

**File:** `Frontend/innkt.react/.env` (create if doesn't exist)

**Replace `YOUR_IP_HERE` with your actual IP from Step 1:**

```env
# Replace 192.168.1.100 with YOUR IP from Step 1
REACT_APP_OFFICER_API_URL=http://192.168.1.100:5001
REACT_APP_SEER_API_URL=http://192.168.1.100:5267
REACT_APP_MESSAGING_API_URL=http://192.168.1.100:3000
REACT_APP_NOTIFICATIONS_API_URL=http://192.168.1.100:5006
REACT_APP_SOCIAL_API_URL=http://192.168.1.100:8081
REACT_APP_GROUPS_API_URL=http://192.168.1.100:5002
REACT_APP_NEUROSPARK_API_URL=http://192.168.1.100:5003
REACT_APP_KINDER_API_URL=http://192.168.1.100:5004

# Frontend port
PORT=3001
```

---

### Step 4: Configure Windows Firewall (2 minutes)

**Open PowerShell as Administrator** and run:

```powershell
# Allow Seer (Video Calls)
New-NetFirewallRule -DisplayName "innkt-seer-dev" -Direction Inbound -LocalPort 5267 -Protocol TCP -Action Allow

# Allow Officer (Auth)
New-NetFirewallRule -DisplayName "innkt-officer-dev" -Direction Inbound -LocalPort 5001 -Protocol TCP -Action Allow

# Allow Messaging
New-NetFirewallRule -DisplayName "innkt-messaging-dev" -Direction Inbound -LocalPort 3000 -Protocol TCP -Action Allow

# Allow Frontend
New-NetFirewallRule -DisplayName "innkt-frontend-dev" -Direction Inbound -LocalPort 3001 -Protocol TCP -Action Allow

# Allow Notifications
New-NetFirewallRule -DisplayName "innkt-notifications-dev" -Direction Inbound -LocalPort 5006 -Protocol TCP -Action Allow

Write-Host "✅ Firewall rules added successfully!" -ForegroundColor Green
```

---

### Step 5: Restart Services (3 minutes)

**On your main PC:**

1. **Stop all running services** (Ctrl+C in each terminal)

2. **Restart backend services:**
   ```powershell
   # Terminal 1: Seer
   cd Backend\innkt.Seer
   dotnet run

   # Terminal 2: Officer (if separate)
   cd Backend\innkt.Officer
   dotnet run

   # Terminal 3: Messaging
   cd Backend\innkt.Messaging
   npm start
   ```

3. **Restart frontend:**
   ```powershell
   cd Frontend\innkt.react
   npm start
   ```

---

### Step 6: Test on Second PC (2 minutes)

**On your second PC (or phone):**

1. **Connect to the same WiFi network**

2. **Open browser and go to:**
   ```
   http://YOUR_IP_HERE:3001
   ```
   (Replace with your IP from Step 1)

3. **Login as a different user:**
   - PC 1: Login as `lisbon.teresa`
   - PC 2: Login as `patrick.jane`

4. **Test the call:**
   - Navigate to Messages
   - Start a voice call
   - **Speak and watch the audio intensity!** 🎤

---

## ✅ Expected Results

| Test | Expected | Why It Works |
|------|----------|--------------|
| **Login** | ✅ Both users can login | CORS allows cross-origin |
| **Messages Load** | ✅ Conversations appear | API accessible via IP |
| **Call Initiates** | ✅ Call modal appears | WebRTC signaling works |
| **Call Connects** | ✅ Both see "Connected" | Peer connection established |
| **Audio Intensity** | ✅ Shows > 0.0000 when speaking | Each PC has own microphone! |
| **Audio Pulse** | ✅ Animates when speaking | Real audio detection |

---

## 🔍 Troubleshooting

### ❌ Can't access from second device

**Check:**
1. Both devices on same WiFi
2. Firewall rules added (Step 4)
3. Services running on main PC
4. Correct IP in .env file

**Test connection:**
```powershell
# On second PC, open PowerShell:
Test-NetConnection YOUR_IP -Port 3001
Test-NetConnection YOUR_IP -Port 5267
```

### ❌ CORS errors in browser console

**Solution:** Make sure you updated ALL three services' CORS config (Step 2)

### ❌ Call doesn't connect

**Check:**
1. SignalR connected (check console logs)
2. Firewall allows port 5267
3. Both users logged in
4. Network stable

### ❌ Audio still shows 0.0000

**Possible causes:**
1. Microphone permissions not granted
2. WebRTC connection failed (check ICE state)
3. Audio stream not flowing (check browser console)

**Test local audio first:**
- Click "🎤 Test Audio" button
- Should show intensity > 0 when speaking
- If this works but remote doesn't, it's a WebRTC issue

---

## 📝 Quick Reference

### Your Configuration
| Setting | Value |
|---------|-------|
| **Your IP** | `_______________` |
| **Frontend URL** | `http://YOUR_IP:3001` |
| **Seer URL** | `http://YOUR_IP:5267` |
| **Officer URL** | `http://YOUR_IP:5001` |

### Test Users
| PC | User | Password |
|----|------|----------|
| PC 1 | lisbon.teresa | (your password) |
| PC 2 | patrick.jane | (your password) |

---

## ⚠️ Important Notes

1. **This is a TEMPORARY solution** for testing only
2. **Security:** All CORS restrictions removed (development only!)
3. **Performance:** No load balancing or rate limiting
4. **Production:** Use proper gateway architecture (see GATEWAY_MIGRATION_PLAN.md)

---

## 🔄 Cleanup After Testing

When done testing, you can:

1. **Remove firewall rules:**
   ```powershell
   Remove-NetFirewallRule -DisplayName "innkt-*-dev"
   ```

2. **Restore CORS settings** (revert Step 2 changes)

3. **Remove .env file** or update to use localhost

---

## 🎯 Success Checklist

- [ ] Found your PC's IP address
- [ ] Updated CORS in 3 backend services
- [ ] Created/updated Frontend .env file
- [ ] Added firewall rules
- [ ] Restarted all services
- [ ] Accessed frontend from second device
- [ ] Both users logged in successfully
- [ ] Call initiated successfully
- [ ] Call connected on both devices
- [ ] Audio intensity detected (> 0.0000)
- [ ] Audio pulse indicator working
- [ ] Can hear each other (if speakers/headphones)

---

**Once testing is complete and audio works, you can implement the proper Gateway architecture from GATEWAY_MIGRATION_PLAN.md for production.**

**Time to Test:** ~15 minutes  
**Expected Result:** Audio intensity working on 2 separate devices! 🎉

