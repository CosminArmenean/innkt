# Update existing MongoDB posts with fresh user profile data
echo "Refreshing user snapshots in all MongoDB posts..."

try {
    $response = Invoke-RestMethod -Uri "http://localhost:8081/api/migration/refresh-user-snapshots" -Method POST -TimeoutSec 30
    Write-Host "✅ User snapshots refreshed: $($response.message)" -ForegroundColor Green
} catch {
    Write-Host "❌ Error refreshing user snapshots: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "   This endpoint might not exist yet - we'll create it" -ForegroundColor Yellow
}
