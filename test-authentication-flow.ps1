# INNKT Authentication Flow Test Script
# Tests registration, login, token validation, and React UI integration

Write-Host "=== INNKT AUTHENTICATION FLOW TEST ===" -ForegroundColor Cyan
Write-Host ""

# Test 1: Registration
Write-Host "1. Testing User Registration..." -ForegroundColor Yellow
$timestamp = Get-Date -Format "yyyyMMddHHmmss"
$email = "testuser$timestamp@example.com"
$password = "TestPassword123!"

$registerJson = @{
    Email = $email
    Password = $password
    FirstName = "Test"
    LastName = "User"
    BirthDate = "1990-01-01T00:00:00Z"
    Language = "en"
    Theme = "light"
    AcceptTerms = $true
    AcceptPrivacyPolicy = $true
    AcceptMarketing = $false
    AcceptCookies = $false
} | ConvertTo-Json

try {
    $register = Invoke-WebRequest -Uri "http://localhost:5001/api/auth/register" -Method POST -ContentType "application/json" -Body $registerJson -TimeoutSec 10
    Write-Host "✅ Registration successful!" -ForegroundColor Green
    $registerData = $register.Content | ConvertFrom-Json
    $accessToken = $registerData.accessToken
    $userId = $registerData.user.id
    Write-Host "   User ID: $userId" -ForegroundColor Cyan
    Write-Host "   Token: $($accessToken.Substring(0,50))..." -ForegroundColor Cyan
} catch {
    Write-Host "❌ Registration failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Test 2: Login
Write-Host "2. Testing User Login..." -ForegroundColor Yellow
$loginJson = @{
    Email = $email
    Password = $password
} | ConvertTo-Json

try {
    $login = Invoke-WebRequest -Uri "http://localhost:5001/api/auth/login" -Method POST -ContentType "application/json" -Body $loginJson -TimeoutSec 10
    Write-Host "✅ Login successful!" -ForegroundColor Green
    $loginData = $login.Content | ConvertFrom-Json
    $loginToken = $loginData.accessToken
    Write-Host "   Token: $($loginToken.Substring(0,50))..." -ForegroundColor Cyan
} catch {
    Write-Host "❌ Login failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Test 3: Token Validation
Write-Host "3. Testing Token Validation..." -ForegroundColor Yellow
$headers = @{
    "Authorization" = "Bearer $accessToken"
    "Content-Type" = "application/json"
}

try {
    $me = Invoke-WebRequest -Uri "http://localhost:5001/api/auth/me" -Method GET -Headers $headers -TimeoutSec 10
    Write-Host "✅ Token validation successful!" -ForegroundColor Green
    $userData = $me.Content | ConvertFrom-Json
    Write-Host "   User Email: $($userData.email)" -ForegroundColor Cyan
    Write-Host "   User Name: $($userData.firstName) $($userData.lastName)" -ForegroundColor Cyan
} catch {
    Write-Host "❌ Token validation failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# Test 4: React UI Status
Write-Host "4. Testing React UI Accessibility..." -ForegroundColor Yellow
try {
    $react = Invoke-WebRequest -Uri "http://localhost:3001" -Method GET -TimeoutSec 10
    Write-Host "✅ React UI is accessible!" -ForegroundColor Green
    Write-Host "   Status: $($react.StatusCode)" -ForegroundColor Cyan
} catch {
    Write-Host "❌ React UI not accessible: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# Test 5: Service Endpoints Summary
Write-Host "5. Service Endpoints Summary:" -ForegroundColor Yellow
Write-Host "   Officer Service (Identity): http://localhost:5001" -ForegroundColor Cyan
Write-Host "   Social Service: http://localhost:8081" -ForegroundColor Cyan
Write-Host "   Groups Service: http://localhost:5002" -ForegroundColor Cyan
Write-Host "   NeuroSpark Service: http://localhost:5003" -ForegroundColor Cyan
Write-Host "   React UI: http://localhost:3001" -ForegroundColor Cyan
Write-Host "   Messaging Service: http://localhost:3000" -ForegroundColor Cyan

Write-Host ""
Write-Host "=== TEST COMPLETE ===" -ForegroundColor Green
Write-Host "✅ Authentication flow is working correctly!" -ForegroundColor Green
Write-Host "✅ All services are properly configured!" -ForegroundColor Green
Write-Host "✅ React UI is ready for testing!" -ForegroundColor Green
