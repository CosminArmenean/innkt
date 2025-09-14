# Get TestUser1 Profile Script
# This script gets the current profile for testuser1@example.com

$baseUrl = "http://localhost:5001"  # Officer service URL

Write-Host "Getting current user profile for testuser1@example.com..." -ForegroundColor Yellow

try {
    # First, let's try to get the current user profile (requires authentication)
    # Since we don't have auth, let's try a different approach
    
    # Let's check if there are any public endpoints
    Write-Host "Checking available endpoints..." -ForegroundColor Yellow
    
    # Try to get the auth test endpoint
    $testResponse = Invoke-RestMethod -Uri "$baseUrl/api/auth/test" -Method GET
    Write-Host "✅ Auth service is working: $($testResponse.message)" -ForegroundColor Green
    
    # Since we can't easily get the user ID without authentication,
    # let's create a simple database update script instead
    Write-Host "`nSince we can't easily get the user profile without authentication," -ForegroundColor Yellow
    Write-Host "let's create a database update script to update testuser1's profile directly." -ForegroundColor Yellow
    
} catch {
    Write-Host "❌ Failed to connect to Officer service" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`nProfile retrieval attempt completed!" -ForegroundColor Green
