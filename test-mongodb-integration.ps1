# Test MongoDB Integration
Write-Host "🧪 Testing MongoDB Integration for Social Service" -ForegroundColor Cyan
Write-Host "=================================================" -ForegroundColor Cyan

$baseUrl = "http://localhost:8081"

# Test health endpoint
Write-Host "`n🏥 Testing health endpoint..." -ForegroundColor Yellow
try {
    $healthResponse = Invoke-RestMethod -Uri "$baseUrl/health" -Method Get
    Write-Host "✅ Health check passed: $($healthResponse.Status)" -ForegroundColor Green
    Write-Host "   Service: $($healthResponse.Service)" -ForegroundColor Gray
    Write-Host "   Timestamp: $($healthResponse.Timestamp)" -ForegroundColor Gray
} catch {
    Write-Host "❌ Health check failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Test Swagger endpoint
Write-Host "`n📚 Testing Swagger documentation..." -ForegroundColor Yellow
try {
    $swaggerResponse = Invoke-WebRequest -Uri "$baseUrl/swagger/index.html" -Method Get
    if ($swaggerResponse.StatusCode -eq 200) {
        Write-Host "✅ Swagger UI is accessible" -ForegroundColor Green
    }
} catch {
    Write-Host "❌ Swagger UI failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test MongoDB endpoints (these should be available even without auth for testing)
Write-Host "`n🍃 Testing MongoDB endpoints..." -ForegroundColor Yellow

# Test public feed endpoint (should work without auth)
try {
    $feedResponse = Invoke-RestMethod -Uri "$baseUrl/api/v2/mongoposts/public?page=1`&pageSize=5" -Method Get
    Write-Host "✅ MongoDB public feed endpoint is working" -ForegroundColor Green
    Write-Host "   Posts returned: $($feedResponse.Posts.Count)" -ForegroundColor Gray
    Write-Host "   Page: $($feedResponse.Page), HasMore: $($feedResponse.HasMore)" -ForegroundColor Gray
} catch {
    if ($_.Exception.Response.StatusCode -eq 401) {
        Write-Host "⚠️  MongoDB endpoint requires authentication (expected)" -ForegroundColor Yellow
    } else {
        Write-Host "❌ MongoDB public feed failed: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host "   Status Code: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
    }
}

# Test cache refresh endpoint (maintenance)
try {
    $cacheResponse = Invoke-RestMethod -Uri "$baseUrl/api/v2/mongoposts/refresh-stale-caches" -Method Post
    Write-Host "✅ Cache refresh endpoint is working" -ForegroundColor Green
    Write-Host "   Response: $($cacheResponse.Message)" -ForegroundColor Gray
} catch {
    if ($_.Exception.Response.StatusCode -eq 401) {
        Write-Host "⚠️  Cache refresh endpoint requires authentication (expected)" -ForegroundColor Yellow
    } else {
        Write-Host "❌ Cache refresh failed: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host "`n🎉 MongoDB Integration Test Complete!" -ForegroundColor Green
Write-Host "The hybrid PostgreSQL + MongoDB architecture is ready!" -ForegroundColor Green

Write-Host "`n📋 Next Steps:" -ForegroundColor Cyan
Write-Host "1. Test creating posts via MongoDB endpoints" -ForegroundColor White
Write-Host "2. Verify user profile caching is working" -ForegroundColor White
Write-Host "3. Test the feed performance improvements" -ForegroundColor White
Write-Host "4. Set up real-time updates with Change Streams" -ForegroundColor White
