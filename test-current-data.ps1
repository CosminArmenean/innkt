Write-Host "Testing current data and verifying UI..." -ForegroundColor Yellow

$userTokens = Get-Content "test-user-tokens.json" | ConvertFrom-Json
$testuser1Token = $userTokens."testuser1@example.com"

Write-Host "Testing posts feed..." -ForegroundColor Cyan
try {
    $postsResponse = Invoke-RestMethod -Uri "http://localhost:8081/api/posts/feed" -Method GET -Headers @{"Authorization" = "Bearer $testuser1Token"}
    Write-Host "Posts in feed: $($postsResponse.posts.Count)" -ForegroundColor Green
    foreach ($post in $postsResponse.posts) {
        Write-Host "  - $($post.content.Substring(0, [Math]::Min(50, $post.content.Length)))..." -ForegroundColor White
    }
} catch {
    Write-Host "Failed to get posts: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "Testing user profile..." -ForegroundColor Cyan
try {
    $profileResponse = Invoke-RestMethod -Uri "http://localhost:8081/api/users/me" -Method GET -Headers @{"Authorization" = "Bearer $testuser1Token"}
    Write-Host "User profile: $($profileResponse.displayName) (@$($profileResponse.username))" -ForegroundColor Green
} catch {
    Write-Host "Failed to get profile: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "Testing messaging service health..." -ForegroundColor Cyan
try {
    $healthResponse = Invoke-RestMethod -Uri "http://localhost:3000/health" -Method GET
    Write-Host "Messaging service: $($healthResponse.status)" -ForegroundColor Green
} catch {
    Write-Host "Messaging service not responding: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "Testing conversations endpoint..." -ForegroundColor Cyan
try {
    $conversationsResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/conversations" -Method GET -Headers @{"Authorization" = "Bearer $testuser1Token"}
    Write-Host "Conversations: $($conversationsResponse.conversations.Count)" -ForegroundColor Green
} catch {
    Write-Host "Failed to get conversations: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "Data testing complete!" -ForegroundColor Green
Write-Host ""
Write-Host "=== UI VERIFICATION INSTRUCTIONS ===" -ForegroundColor Cyan
Write-Host "1. Open http://localhost:3001 in your browser" -ForegroundColor White
Write-Host "2. Login with testuser1@example.com / TestPassword123!" -ForegroundColor White
Write-Host "3. Check the social feed for posts" -ForegroundColor White
Write-Host "4. Check the profile page for user stats" -ForegroundColor White
Write-Host "5. Check the messaging section for conversations" -ForegroundColor White
Write-Host "6. Check the followers page for user relationships" -ForegroundColor White
