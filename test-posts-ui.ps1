Write-Host "Testing posts UI..." -ForegroundColor Yellow

$userTokens = Get-Content "test-user-tokens.json" | ConvertFrom-Json
$testuser1Token = $userTokens."testuser1@example.com"

Write-Host "Testing posts feed API..." -ForegroundColor Cyan

try {
    $response = Invoke-RestMethod -Uri "http://localhost:8081/api/posts/feed" -Method GET -Headers @{"Authorization" = "Bearer $testuser1Token"}
    
    Write-Host "Posts count: $($response.posts.Count)" -ForegroundColor Green
    Write-Host "Total count: $($response.totalCount)" -ForegroundColor Green
    Write-Host "Has next page: $($response.hasNextPage)" -ForegroundColor Green
    
    Write-Host "First few posts:" -ForegroundColor Cyan
    for ($i = 0; $i -lt [Math]::Min(3, $response.posts.Count); $i++) {
        $post = $response.posts[$i]
        Write-Host "  Post $($i + 1): $($post.content.Substring(0, [Math]::Min(50, $post.content.Length)))..." -ForegroundColor White
        Write-Host "    Author: $($post.author)" -ForegroundColor Gray
        Write-Host "    Author Profile: $($post.authorProfile)" -ForegroundColor Gray
        Write-Host "    User ID: $($post.userId)" -ForegroundColor Gray
    }
    
} catch {
    Write-Host "Failed to get posts: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "Posts test complete!" -ForegroundColor Green
