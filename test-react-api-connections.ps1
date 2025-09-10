# Test React UI API Connections
Write-Host "=== Testing React UI API Connections ===" -ForegroundColor Cyan

# Test if React UI is running
Write-Host "1. Testing React UI..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "http://localhost:3001" -Method GET -TimeoutSec 5
    Write-Host "✅ React UI is running" -ForegroundColor Green
} catch {
    Write-Host "❌ React UI is not running: $($_.Exception.Message)" -ForegroundColor Red
}

# Test Officer Service
Write-Host "2. Testing Officer Service..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "http://localhost:5001/health" -Method GET -TimeoutSec 5
    Write-Host "✅ Officer Service is running" -ForegroundColor Green
} catch {
    Write-Host "❌ Officer Service is not running: $($_.Exception.Message)" -ForegroundColor Red
}

# Test Social Service
Write-Host "3. Testing Social Service..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "http://localhost:8081/health" -Method GET -TimeoutSec 5
    Write-Host "✅ Social Service is running" -ForegroundColor Green
} catch {
    Write-Host "❌ Social Service is not running: $($_.Exception.Message)" -ForegroundColor Red
}

# Test API endpoints that React UI should be calling
Write-Host "4. Testing API Endpoints..." -ForegroundColor Yellow

# Test Officer Service login endpoint
try {
    $loginData = @{
        email = "alice.johnson@example.com"
        password = "TestPassword123!"
    } | ConvertTo-Json
    
    $response = Invoke-RestMethod -Uri "http://localhost:5001/api/auth/login" -Method POST -Body $loginData -ContentType "application/json" -TimeoutSec 5
    Write-Host "✅ Officer Service login endpoint working" -ForegroundColor Green
    $token = $response.accessToken
} catch {
    Write-Host "❌ Officer Service login endpoint failed: $($_.Exception.Message)" -ForegroundColor Red
    $token = $null
}

# Test Social Service posts endpoint
if ($token) {
    try {
        $headers = @{ "Authorization" = "Bearer $token"; "Content-Type" = "application/json" }
        $response = Invoke-RestMethod -Uri "http://localhost:8081/api/posts/feed" -Method GET -Headers $headers -TimeoutSec 5
        Write-Host "✅ Social Service posts endpoint working" -ForegroundColor Green
        Write-Host "   Found $($response.totalCount) posts" -ForegroundColor Gray
    } catch {
        Write-Host "❌ Social Service posts endpoint failed: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "=== API Connection Test Complete ===" -ForegroundColor Cyan
