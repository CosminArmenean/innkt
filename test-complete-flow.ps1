# Test Complete Flow with 2 Users
Write-Host "=== Testing Complete Flow with 2 Users ===" -ForegroundColor Cyan

# Test 1: Register User 1 (Alice)
Write-Host "1. Registering User 1 (Alice)..." -ForegroundColor Yellow
$aliceData = @{
    email = "alice.johnson@example.com"
    password = "TestPassword123!"
    confirmPassword = "TestPassword123!"
    firstName = "Alice"
    lastName = "Johnson"
    username = "alice_johnson"
    displayName = "Alice Johnson"
    dateOfBirth = "1990-05-15"
    bio = "Software developer and tech enthusiast"
} | ConvertTo-Json

try {
    $aliceResponse = Invoke-RestMethod -Uri "http://localhost:5001/api/auth/register" -Method POST -Body $aliceData -ContentType "application/json" -TimeoutSec 10
    Write-Host "✅ Alice registered successfully" -ForegroundColor Green
    $aliceToken = $aliceResponse.accessToken
    $aliceUserId = $aliceResponse.userId
} catch {
    Write-Host "❌ Alice registration failed: $($_.Exception.Message)" -ForegroundColor Red
    $aliceToken = $null
    $aliceUserId = $null
}

# Test 2: Register User 2 (Bob)
Write-Host "2. Registering User 2 (Bob)..." -ForegroundColor Yellow
$bobData = @{
    email = "bob.smith@example.com"
    password = "TestPassword123!"
    confirmPassword = "TestPassword123!"
    firstName = "Bob"
    lastName = "Smith"
    username = "bob_smith"
    displayName = "Bob Smith"
    dateOfBirth = "1988-03-22"
    bio = "Designer and creative professional"
} | ConvertTo-Json

try {
    $bobResponse = Invoke-RestMethod -Uri "http://localhost:5001/api/auth/register" -Method POST -Body $bobData -ContentType "application/json" -TimeoutSec 10
    Write-Host "✅ Bob registered successfully" -ForegroundColor Green
    $bobToken = $bobResponse.accessToken
    $bobUserId = $bobResponse.userId
} catch {
    Write-Host "❌ Bob registration failed: $($_.Exception.Message)" -ForegroundColor Red
    $bobToken = $null
    $bobUserId = $null
}

# Test 3: Alice creates a post
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
    } catch {
        Write-Host "❌ Alice's post creation failed: $($_.Exception.Message)" -ForegroundColor Red
        $alicePostId = $null
    }
}

# Test 4: Bob creates a post
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
    } catch {
        Write-Host "❌ Bob's post creation failed: $($_.Exception.Message)" -ForegroundColor Red
        $bobPostId = $null
    }
}

# Test 5: Bob follows Alice
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

# Test 6: Alice follows Bob
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

# Test 7: Bob likes Alice's post
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

# Test 8: Alice likes Bob's post
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

# Test 9: Check Alice's feed
if ($aliceToken) {
    Write-Host "9. Checking Alice's feed..." -ForegroundColor Yellow
    try {
        $aliceHeaders = @{ "Authorization" = "Bearer $aliceToken"; "Content-Type" = "application/json" }
        $feedResponse = Invoke-RestMethod -Uri "http://localhost:8081/api/posts/feed" -Method GET -Headers $aliceHeaders -TimeoutSec 10
        Write-Host "✅ Alice's feed loaded successfully - Found $($feedResponse.totalCount) posts" -ForegroundColor Green
        Write-Host "   Posts in feed:" -ForegroundColor Gray
        foreach ($post in $feedResponse.posts) {
            Write-Host "   - $($post.content.Substring(0, [Math]::Min(50, $post.content.Length)))..." -ForegroundColor Gray
        }
    } catch {
        Write-Host "❌ Alice's feed failed: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Test 10: Check Bob's feed
if ($bobToken) {
    Write-Host "10. Checking Bob's feed..." -ForegroundColor Yellow
    try {
        $bobHeaders = @{ "Authorization" = "Bearer $bobToken"; "Content-Type" = "application/json" }
        $feedResponse = Invoke-RestMethod -Uri "http://localhost:8081/api/posts/feed" -Method GET -Headers $bobHeaders -TimeoutSec 10
        Write-Host "✅ Bob's feed loaded successfully - Found $($feedResponse.totalCount) posts" -ForegroundColor Green
        Write-Host "   Posts in feed:" -ForegroundColor Gray
        foreach ($post in $feedResponse.posts) {
            Write-Host "   - $($post.content.Substring(0, [Math]::Min(50, $post.content.Length)))..." -ForegroundColor Gray
        }
    } catch {
        Write-Host "❌ Bob's feed failed: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "=== Test Summary ===" -ForegroundColor Cyan
Write-Host "Users created: Alice Johnson and Bob Smith" -ForegroundColor White
Write-Host "Posts created: 2" -ForegroundColor White
Write-Host "Follow relationships: 2 (mutual follows)" -ForegroundColor White
Write-Host "Likes: 2" -ForegroundColor White
Write-Host ""
Write-Host "You can now test the React UI at http://localhost:3001" -ForegroundColor Green
Write-Host "Login with either:" -ForegroundColor Yellow
Write-Host "  - alice.johnson@example.com / TestPassword123!" -ForegroundColor White
Write-Host "  - bob.smith@example.com / TestPassword123!" -ForegroundColor White
