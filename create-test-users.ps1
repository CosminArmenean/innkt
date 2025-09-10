# Create Test Users and Test Social Flow
Write-Host "=== Creating Test Users and Testing Social Flow ===" -ForegroundColor Cyan

# Create Alice
Write-Host "1. Creating Alice..." -ForegroundColor Yellow
$aliceData = @{
    email = "alice@example.com"
    password = "TestPassword123!"
    confirmPassword = "TestPassword123!"
    firstName = "Alice"
    lastName = "Johnson"
    username = "alice"
    displayName = "Alice Johnson"
} | ConvertTo-Json

try {
    $aliceResponse = Invoke-RestMethod -Uri "http://localhost:5001/api/auth/register" -Method POST -Body $aliceData -ContentType "application/json" -TimeoutSec 10
    Write-Host "✅ Alice created successfully" -ForegroundColor Green
    $aliceToken = $aliceResponse.accessToken
    $aliceUserId = $aliceResponse.user.id
    Write-Host "   Alice ID: $aliceUserId" -ForegroundColor Gray
} catch {
    Write-Host "❌ Alice creation failed: $($_.Exception.Message)" -ForegroundColor Red
    $aliceToken = $null
    $aliceUserId = $null
}

# Create Bob
Write-Host "2. Creating Bob..." -ForegroundColor Yellow
$bobData = @{
    email = "bob@example.com"
    password = "TestPassword123!"
    confirmPassword = "TestPassword123!"
    firstName = "Bob"
    lastName = "Smith"
    username = "bob"
    displayName = "Bob Smith"
} | ConvertTo-Json

try {
    $bobResponse = Invoke-RestMethod -Uri "http://localhost:5001/api/auth/register" -Method POST -Body $bobData -ContentType "application/json" -TimeoutSec 10
    Write-Host "✅ Bob created successfully" -ForegroundColor Green
    $bobToken = $bobResponse.accessToken
    $bobUserId = $bobResponse.user.id
    Write-Host "   Bob ID: $bobUserId" -ForegroundColor Gray
} catch {
    Write-Host "❌ Bob creation failed: $($_.Exception.Message)" -ForegroundColor Red
    $bobToken = $null
    $bobUserId = $null
}

# Alice creates a post
if ($aliceToken) {
    Write-Host "3. Alice creates a post..." -ForegroundColor Yellow
    $alicePostData = @{
        content = "Hello everyone! This is my first post on INNKT. Excited to be part of this community! 🚀"
        visibility = "public"
        type = "text"
        tags = @("welcome", "firstpost", "community")
    } | ConvertTo-Json

    try {
        $aliceHeaders = @{ "Authorization" = "Bearer $aliceToken"; "Content-Type" = "application/json" }
        $alicePostResponse = Invoke-RestMethod -Uri "http://localhost:8081/api/posts" -Method POST -Body $alicePostData -Headers $aliceHeaders -TimeoutSec 10
        Write-Host "✅ Alice's post created successfully" -ForegroundColor Green
        $alicePostId = $alicePostResponse.id
        Write-Host "   Post ID: $alicePostId" -ForegroundColor Gray
    } catch {
        Write-Host "❌ Alice's post creation failed: $($_.Exception.Message)" -ForegroundColor Red
        $alicePostId = $null
    }
}

# Bob creates a post
if ($bobToken) {
    Write-Host "4. Bob creates a post..." -ForegroundColor Yellow
    $bobPostData = @{
        content = "Hey there! Just joined INNKT and loving the platform so far. Looking forward to connecting with everyone! 👋"
        visibility = "public"
        type = "text"
        tags = @("introduction", "newuser", "networking")
    } | ConvertTo-Json

    try {
        $bobHeaders = @{ "Authorization" = "Bearer $bobToken"; "Content-Type" = "application/json" }
        $bobPostResponse = Invoke-RestMethod -Uri "http://localhost:8081/api/posts" -Method POST -Body $bobPostData -Headers $bobHeaders -TimeoutSec 10
        Write-Host "✅ Bob's post created successfully" -ForegroundColor Green
        $bobPostId = $bobPostResponse.id
        Write-Host "   Post ID: $bobPostId" -ForegroundColor Gray
    } catch {
        Write-Host "❌ Bob's post creation failed: $($_.Exception.Message)" -ForegroundColor Red
        $bobPostId = $null
    }
}

# Bob follows Alice
if ($bobToken -and $aliceUserId) {
    Write-Host "5. Bob follows Alice..." -ForegroundColor Yellow
    $followData = @{
        userId = $aliceUserId
    } | ConvertTo-Json

    try {
        $bobHeaders = @{ "Authorization" = "Bearer $bobToken"; "Content-Type" = "application/json" }
        $followResponse = Invoke-RestMethod -Uri "http://localhost:8081/api/follows" -Method POST -Body $followData -Headers $bobHeaders -TimeoutSec 10
        Write-Host "✅ Bob successfully followed Alice" -ForegroundColor Green
    } catch {
        Write-Host "❌ Bob's follow request failed: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Alice follows Bob
if ($aliceToken -and $bobUserId) {
    Write-Host "6. Alice follows Bob..." -ForegroundColor Yellow
    $followData = @{
        userId = $bobUserId
    } | ConvertTo-Json

    try {
        $aliceHeaders = @{ "Authorization" = "Bearer $aliceToken"; "Content-Type" = "application/json" }
        $followResponse = Invoke-RestMethod -Uri "http://localhost:8081/api/follows" -Method POST -Body $followData -Headers $aliceHeaders -TimeoutSec 10
        Write-Host "✅ Alice successfully followed Bob" -ForegroundColor Green
    } catch {
        Write-Host "❌ Alice's follow request failed: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Bob likes Alice's post
if ($bobToken -and $alicePostId) {
    Write-Host "7. Bob likes Alice's post..." -ForegroundColor Yellow
    try {
        $bobHeaders = @{ "Authorization" = "Bearer $bobToken"; "Content-Type" = "application/json" }
        $likeResponse = Invoke-RestMethod -Uri "http://localhost:8081/api/posts/$alicePostId/like" -Method POST -Headers $bobHeaders -TimeoutSec 10
        Write-Host "✅ Bob successfully liked Alice's post" -ForegroundColor Green
    } catch {
        Write-Host "❌ Bob's like failed: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Alice likes Bob's post
if ($aliceToken -and $bobPostId) {
    Write-Host "8. Alice likes Bob's post..." -ForegroundColor Yellow
    try {
        $aliceHeaders = @{ "Authorization" = "Bearer $aliceToken"; "Content-Type" = "application/json" }
        $likeResponse = Invoke-RestMethod -Uri "http://localhost:8081/api/posts/$bobPostId/like" -Method POST -Headers $aliceHeaders -TimeoutSec 10
        Write-Host "✅ Alice successfully liked Bob's post" -ForegroundColor Green
    } catch {
        Write-Host "❌ Alice's like failed: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Check Alice's feed
if ($aliceToken) {
    Write-Host "9. Checking Alice's feed..." -ForegroundColor Yellow
    try {
        $aliceHeaders = @{ "Authorization" = "Bearer $aliceToken"; "Content-Type" = "application/json" }
        $feedResponse = Invoke-RestMethod -Uri "http://localhost:8081/api/posts/feed" -Method GET -Headers $aliceHeaders -TimeoutSec 10
        Write-Host "✅ Alice's feed loaded successfully - Found $($feedResponse.totalCount) posts" -ForegroundColor Green
        Write-Host "   Posts in Alice's feed:" -ForegroundColor Gray
        foreach ($post in $feedResponse.posts) {
            Write-Host "   - $($post.content.Substring(0, [Math]::Min(50, $post.content.Length)))..." -ForegroundColor Gray
        }
    } catch {
        Write-Host "❌ Alice's feed failed: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Check Bob's feed
if ($bobToken) {
    Write-Host "10. Checking Bob's feed..." -ForegroundColor Yellow
    try {
        $bobHeaders = @{ "Authorization" = "Bearer $bobToken"; "Content-Type" = "application/json" }
        $feedResponse = Invoke-RestMethod -Uri "http://localhost:8081/api/posts/feed" -Method GET -Headers $bobHeaders -TimeoutSec 10
        Write-Host "✅ Bob's feed loaded successfully - Found $($feedResponse.totalCount) posts" -ForegroundColor Green
        Write-Host "   Posts in Bob's feed:" -ForegroundColor Gray
        foreach ($post in $feedResponse.posts) {
            Write-Host "   - $($post.content.Substring(0, [Math]::Min(50, $post.content.Length)))..." -ForegroundColor Gray
        }
    } catch {
        Write-Host "❌ Bob's feed failed: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "=== Test Complete! ===" -ForegroundColor Green
Write-Host "You can now test the React UI at http://localhost:3001" -ForegroundColor Cyan
Write-Host ""
Write-Host "Login credentials:" -ForegroundColor Yellow
Write-Host "  Alice: alice@example.com / TestPassword123!" -ForegroundColor White
Write-Host "  Bob:   bob@example.com / TestPassword123!" -ForegroundColor White
Write-Host ""
Write-Host "Both users should see each other's posts in their feeds!" -ForegroundColor Green
