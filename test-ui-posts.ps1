Write-Host "Testing UI posts display..." -ForegroundColor Yellow

$userTokens = Get-Content "test-user-tokens.json" | ConvertFrom-Json
$testuser1Token = $userTokens."testuser1@example.com"

Write-Host "Testing posts feed API response..." -ForegroundColor Cyan

try {
    $response = Invoke-RestMethod -Uri "http://localhost:8081/api/posts/feed" -Method GET -Headers @{"Authorization" = "Bearer $testuser1Token"}
    
    Write-Host "Posts count: $($response.posts.Count)" -ForegroundColor Green
    Write-Host "Total count: $($response.totalCount)" -ForegroundColor Green
    Write-Host "Has next page: $($response.hasNextPage)" -ForegroundColor Green
    
    Write-Host "First post details:" -ForegroundColor Cyan
    $firstPost = $response.posts[0]
    Write-Host "  ID: $($firstPost.id)" -ForegroundColor White
    Write-Host "  Content: $($firstPost.content)" -ForegroundColor White
    Write-Host "  User ID: $($firstPost.userId)" -ForegroundColor White
    Write-Host "  Author: $($firstPost.author)" -ForegroundColor White
    Write-Host "  Author Profile: $($firstPost.authorProfile)" -ForegroundColor White
    Write-Host "  Created At: $($firstPost.createdAt)" -ForegroundColor White
    
} catch {
    Write-Host "Failed to get posts: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "=== UI TESTING INSTRUCTIONS ===" -ForegroundColor Cyan
Write-Host "1. Open http://localhost:3001 in your browser" -ForegroundColor White
Write-Host "2. Login with testuser1@example.com / TestPassword123!" -ForegroundColor White
Write-Host "3. Check if posts are visible in the social feed" -ForegroundColor White
Write-Host "4. Posts should show with user IDs as fallback names" -ForegroundColor White
Write-Host "5. Check the followers page for user relationships" -ForegroundColor White

Write-Host ""
Write-Host "Posts test complete!" -ForegroundColor Green
