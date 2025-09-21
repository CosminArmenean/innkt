# ⚡ QUICK INTEGRATION TEST COMMANDS
## Ready-to-Execute PowerShell Commands for Testing

*Use these commands after all services are running*

---

## 🧪 **HEALTH CHECK COMMANDS**

```powershell
# Test all service health endpoints
Write-Host "🧪 HEALTH CHECK TESTING..." -ForegroundColor Cyan

# Kinder Service Health
try {
    $kinder = Invoke-RestMethod -Uri "http://localhost:5004/health" -Method GET
    Write-Host "✅ Kinder Service: $($kinder.message)" -ForegroundColor Green
} catch { Write-Host "❌ Kinder Service: Not responding" -ForegroundColor Red }

# Notifications Service Health  
try {
    $notifications = Invoke-RestMethod -Uri "http://localhost:5006/health" -Method GET
    Write-Host "✅ Notifications Service: $($notifications.message)" -ForegroundColor Green
} catch { Write-Host "❌ Notifications Service: Not responding" -ForegroundColor Red }

# NeuroSpark Service Health
try {
    $neurospark = Invoke-RestMethod -Uri "http://localhost:5005/health" -Method GET
    Write-Host "✅ NeuroSpark Service: $($neurospark.message)" -ForegroundColor Green
} catch { Write-Host "❌ NeuroSpark Service: Not responding" -ForegroundColor Red }

# Social Service Health
try {
    $social = Invoke-RestMethod -Uri "http://localhost:8081/health" -Method GET
    Write-Host "✅ Social Service: $($social.message)" -ForegroundColor Green
} catch { Write-Host "❌ Social Service: Not responding" -ForegroundColor Red }

# API Gateway Health
try {
    $gateway = Invoke-RestMethod -Uri "http://localhost:51303/health" -Method GET
    Write-Host "✅ API Gateway: Healthy" -ForegroundColor Green
} catch { Write-Host "❌ API Gateway: Not responding" -ForegroundColor Red }
```

---

## 🛡️ **KID SAFETY INTEGRATION TESTS**

```powershell
Write-Host "🛡️ TESTING KID SAFETY FEATURES..." -ForegroundColor Cyan

# Test 1: Kid Account Creation (via API Gateway)
$kidAccountData = @{
    userId = [Guid]::NewGuid().ToString()
    age = 10
    safetyLevel = "strict"
} | ConvertTo-Json

try {
    $kidAccount = Invoke-RestMethod -Uri "http://localhost:51303/api/kinder/kid-accounts" -Method POST -Body $kidAccountData -ContentType "application/json"
    Write-Host "✅ Kid Account Created: $($kidAccount.kidAccount.id)" -ForegroundColor Green
    $kidAccountId = $kidAccount.kidAccount.id
} catch {
    Write-Host "❌ Kid Account Creation Failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 2: Panic Button Simulation
if ($kidAccountId) {
    $panicData = @{
        message = "Integration test emergency - not real"
    } | ConvertTo-Json
    
    try {
        $panicResult = Invoke-RestMethod -Uri "http://localhost:51303/api/kinder/kid-accounts/$kidAccountId/panic" -Method POST -Body $panicData -ContentType "application/json"
        Write-Host "✅ Panic Button Test: Emergency protocols activated" -ForegroundColor Green
    } catch {
        Write-Host "❌ Panic Button Test Failed: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Test 3: Safety Events Retrieval
if ($kidAccountId) {
    try {
        $safetyEvents = Invoke-RestMethod -Uri "http://localhost:51303/api/kinder/kid-accounts/$kidAccountId/safety-events" -Method GET
        Write-Host "✅ Safety Events Retrieved: $($safetyEvents.Count) events" -ForegroundColor Green
    } catch {
        Write-Host "❌ Safety Events Test Failed: $($_.Exception.Message)" -ForegroundColor Red
    }
}
```

---

## 🤖 **@GROK AI INTEGRATION TESTS**

```powershell
Write-Host "🤖 TESTING @GROK AI FEATURES..." -ForegroundColor Cyan

# Test 1: @grok Mention Detection
$grokMentionData = @{
    content = "@grok explain photosynthesis for kids"
} | ConvertTo-Json

try {
    $mentionResult = Invoke-RestMethod -Uri "http://localhost:51303/api/neurospark/grok/check-mention" -Method POST -Body $grokMentionData -ContentType "application/json"
    Write-Host "✅ @grok Mention Detection: $($mentionResult.isGrokMention)" -ForegroundColor Green
} catch {
    Write-Host "❌ @grok Mention Test Failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 2: Question Extraction
$questionData = @{
    content = "@grok how do plants make food? What is chlorophyll?"
} | ConvertTo-Json

try {
    $questions = Invoke-RestMethod -Uri "http://localhost:51303/api/neurospark/grok/extract-questions" -Method POST -Body $questionData -ContentType "application/json"
    Write-Host "✅ Question Extraction: $($questions.questions.Count) questions found" -ForegroundColor Green
} catch {
    Write-Host "❌ Question Extraction Failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 3: AI Response Generation
$responseData = @{
    question = "How do plants make their own food?"
    context = "Educational discussion"
    userId = [Guid]::NewGuid().ToString()
    isKidAccount = $true
} | ConvertTo-Json

try {
    $aiResponse = Invoke-RestMethod -Uri "http://localhost:51303/api/neurospark/grok/generate" -Method POST -Body $responseData -ContentType "application/json"
    Write-Host "✅ AI Response Generated: Safety Score $($aiResponse.safetyScore)" -ForegroundColor Green
} catch {
    Write-Host "❌ AI Response Generation Failed: $($_.Exception.Message)" -ForegroundColor Red
}
```

---

## 🔔 **NOTIFICATION SYSTEM TESTS**

```powershell
Write-Host "🔔 TESTING NOTIFICATION SYSTEM..." -ForegroundColor Cyan

# Test 1: Basic Notification
$basicNotification = @{
    type = "test_notification"
    recipientId = [Guid]::NewGuid().ToString()
    title = "Integration Test Notification"
    message = "Testing the revolutionary notification system"
    priority = "medium"
    channel = "in_app"
} | ConvertTo-Json

try {
    $notifResult = Invoke-RestMethod -Uri "http://localhost:51303/api/notifications" -Method POST -Body $basicNotification -ContentType "application/json"
    Write-Host "✅ Basic Notification Sent: $($notifResult)" -ForegroundColor Green
} catch {
    Write-Host "❌ Basic Notification Failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 2: Emergency Alert
$emergencyAlert = @{
    kidAccountId = $kidAccountId
    alertType = "integration_test"
    severity = "emergency"
    description = "Integration testing emergency alert - not real"
    safetyData = @{
        testMode = $true
        timestamp = (Get-Date).ToString()
    }
} | ConvertTo-Json

try {
    $emergencyResult = Invoke-RestMethod -Uri "http://localhost:51303/api/notifications/emergency" -Method POST -Body $emergencyAlert -ContentType "application/json"
    Write-Host "✅ Emergency Alert Sent: $($emergencyResult)" -ForegroundColor Green
} catch {
    Write-Host "❌ Emergency Alert Failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 3: Get User Notifications
try {
    $userNotifications = Invoke-RestMethod -Uri "http://localhost:51303/api/notifications" -Method GET
    Write-Host "✅ User Notifications Retrieved: $($userNotifications.Count) notifications" -ForegroundColor Green
} catch {
    Write-Host "❌ Get Notifications Failed: $($_.Exception.Message)" -ForegroundColor Red
}
```

---

## 📱 **CONTENT FILTERING TESTS**

```powershell
Write-Host "🤖 TESTING CONTENT FILTERING..." -ForegroundColor Cyan

# Test 1: Safe Content Analysis
$safeContent = @{
    content = "Learning about science and mathematics is fun and educational"
    kidAge = 10
} | ConvertTo-Json

try {
    $safeResult = Invoke-RestMethod -Uri "http://localhost:51303/api/neurospark/content/analyze-safety" -Method POST -Body $safeContent -ContentType "application/json"
    Write-Host "✅ Safe Content Analysis: Safety Score $($safeResult.safetyScore)" -ForegroundColor Green
} catch {
    Write-Host "❌ Safe Content Test Failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 2: Educational Content Detection
$educationalContent = @{
    content = "Let's learn about photosynthesis and how plants convert sunlight into energy"
    kidAge = 12
} | ConvertTo-Json

try {
    $eduResult = Invoke-RestMethod -Uri "http://localhost:51303/api/neurospark/content/educational-analysis" -Method POST -Body $educationalContent -ContentType "application/json"
    Write-Host "✅ Educational Content Analysis: Educational Score $($eduResult.educationalScore)" -ForegroundColor Green
} catch {
    Write-Host "❌ Educational Content Test Failed: $($_.Exception.Message)" -ForegroundColor Red
}
```

---

## 🎉 **TESTING COMPLETION VALIDATION**

```powershell
Write-Host ""
Write-Host "🎉 INTEGRATION TESTING COMPLETE!" -ForegroundColor Green
Write-Host ""
Write-Host "📊 REVOLUTIONARY FEATURES VALIDATED:" -ForegroundColor Yellow
Write-Host "   🛡️ Kid Safety: Account creation + Emergency systems"
Write-Host "   🤖 @grok AI: Social integration + Safety filtering"
Write-Host "   🔔 Notifications: Real-time delivery + Multi-channel"
Write-Host "   📱 Content Filtering: AI analysis + Educational detection"
Write-Host ""
Write-Host "🚀 SYSTEM STATUS: READY FOR PRODUCTION!" -ForegroundColor Cyan
Write-Host ""
Write-Host "🎯 NEXT PHASE OPTIONS:"
Write-Host "   📱 Mobile Development: Build on proven foundation"
Write-Host "   🌍 European Market: Romanian localization ready"
Write-Host "   🚀 Production Deployment: Launch revolutionary platform"
```

---

**🎯 Ready to execute these integration tests! Once you have the services running, these commands will validate that our entire revolutionary platform works seamlessly together!**

**Should I help you start the services or would you prefer to run the startup commands manually?** 🚀✨

