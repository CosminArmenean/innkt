# Create Posts for Alice and Bob
Write-Host "=== Creating Posts for Alice and Bob ===" -ForegroundColor Cyan

# Login Alice
Write-Host "1. Logging in Alice..." -ForegroundColor Yellow
$aliceLoginData = @{
    email = "alice@example.com"
    password = "TestPassword123!"
} | ConvertTo-Json

try {
    $aliceLoginResponse = Invoke-RestMethod -Uri "http://localhost:5001/api/auth/login" -Method POST -Body $aliceLoginData -ContentType "application/json" -TimeoutSec 10
    $aliceToken = $aliceLoginResponse.accessToken
    Write-Host "✅ Alice logged in successfully" -ForegroundColor Green
} catch {
    Write-Host "❌ Alice login failed: $($_.Exception.Message)" -ForegroundColor Red
    $aliceToken = $null
}

# Login Bob
Write-Host "2. Logging in Bob..." -ForegroundColor Yellow
$bobLoginData = @{
    email = "bob@example.com"
    password = "TestPassword123!"
} | ConvertTo-Json

try {
    $bobLoginResponse = Invoke-RestMethod -Uri "http://localhost:5001/api/auth/login" -Method POST -Body $bobLoginData -ContentType "application/json" -TimeoutSec 10
    $bobToken = $bobLoginResponse.accessToken
    Write-Host "✅ Bob logged in successfully" -ForegroundColor Green
} catch {
    Write-Host "❌ Bob login failed: $($_.Exception.Message)" -ForegroundColor Red
    $bobToken = $null
}

# Alice creates a post
if ($aliceToken) {
    Write-Host "3. Alice creates a post..." -ForegroundColor Yellow
    $alicePostData = @{
        content = "Hello everyone! This is my first post on INNKT. Excited to be part of this community! 🚀"
        visibility = "public"
        type = "text"
    } | ConvertTo-Json

    try {
        $aliceHeaders = @{ "Authorization" = "Bearer $aliceToken"; "Content-Type" = "application/json" }
        $alicePostResponse = Invoke-RestMethod -Uri "http://localhost:8081/api/posts" -Method POST -Body $alicePostData -Headers $aliceHeaders -TimeoutSec 10
        Write-Host "✅ Alice's post created successfully" -ForegroundColor Green
        Write-Host "   Post ID: $($alicePostResponse.id)" -ForegroundColor Gray
        Write-Host "   Content: $($alicePostResponse.content)" -ForegroundColor Gray
    } catch {
        Write-Host "❌ Alice's post creation failed: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Bob creates a post
if ($bobToken) {
    Write-Host "4. Bob creates a post..." -ForegroundColor Yellow
    $bobPostData = @{
        content = "Hey there! Just joined INNKT and loving the platform so far. Looking forward to connecting with everyone! 👋"
        visibility = "public"
        type = "text"
    } | ConvertTo-Json

    try {
        $bobHeaders = @{ "Authorization" = "Bearer $bobToken"; "Content-Type" = "application/json" }
        $bobPostResponse = Invoke-RestMethod -Uri "http://localhost:8081/api/posts" -Method POST -Body $bobPostData -Headers $bobHeaders -TimeoutSec 10
        Write-Host "✅ Bob's post created successfully" -ForegroundColor Green
        Write-Host "   Post ID: $($bobPostResponse.id)" -ForegroundColor Gray
        Write-Host "   Content: $($bobPostResponse.content)" -ForegroundColor Gray
    } catch {
        Write-Host "❌ Bob's post creation failed: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Alice creates another post
if ($aliceToken) {
    Write-Host "5. Alice creates another post..." -ForegroundColor Yellow
    $alicePost2Data = @{
        content = "Just finished working on a new project! Can't wait to share more updates soon. #coding #development"
        visibility = "public"
        type = "text"
    } | ConvertTo-Json

    try {
        $aliceHeaders = @{ "Authorization" = "Bearer $aliceToken"; "Content-Type" = "application/json" }
        $alicePost2Response = Invoke-RestMethod -Uri "http://localhost:8081/api/posts" -Method POST -Body $alicePost2Data -Headers $aliceHeaders -TimeoutSec 10
        Write-Host "✅ Alice's second post created successfully" -ForegroundColor Green
        Write-Host "   Post ID: $($alicePost2Response.id)" -ForegroundColor Gray
    } catch {
        Write-Host "❌ Alice's second post creation failed: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Bob creates another post
if ($bobToken) {
    Write-Host "6. Bob creates another post..." -ForegroundColor Yellow
    $bobPost2Data = @{
        content = "Beautiful day today! Perfect weather for a walk in the park. Hope everyone is having a great day! 🌞"
        visibility = "public"
        type = "text"
    } | ConvertTo-Json

    try {
        $bobHeaders = @{ "Authorization" = "Bearer $bobToken"; "Content-Type" = "application/json" }
        $bobPost2Response = Invoke-RestMethod -Uri "http://localhost:8081/api/posts" -Method POST -Body $bobPost2Data -Headers $bobHeaders -TimeoutSec 10
        Write-Host "✅ Bob's second post created successfully" -ForegroundColor Green
        Write-Host "   Post ID: $($bobPost2Response.id)" -ForegroundColor Gray
    } catch {
        Write-Host "❌ Bob's second post creation failed: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Check Alice's feed
if ($aliceToken) {
    Write-Host "7. Checking Alice's feed..." -ForegroundColor Yellow
    try {
        $aliceHeaders = @{ "Authorization" = "Bearer $aliceToken"; "Content-Type" = "application/json" }
        $feedResponse = Invoke-RestMethod -Uri "http://localhost:8081/api/posts/feed" -Method GET -Headers $aliceHeaders -TimeoutSec 10
        Write-Host "✅ Alice's feed loaded successfully - Found $($feedResponse.totalCount) posts" -ForegroundColor Green
        Write-Host "   Posts in Alice's feed:" -ForegroundColor Gray
        for ($i = 0; $i -lt $feedResponse.posts.Count; $i++) {
            $post = $feedResponse.posts[$i]
            Write-Host "   $($i+1). $($post.content.Substring(0, [Math]::Min(60, $post.content.Length)))..." -ForegroundColor Gray
        }
    } catch {
        Write-Host "❌ Alice's feed failed: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Check Bob's feed
if ($bobToken) {
    Write-Host "8. Checking Bob's feed..." -ForegroundColor Yellow
    try {
        $bobHeaders = @{ "Authorization" = "Bearer $bobToken"; "Content-Type" = "application/json" }
        $feedResponse = Invoke-RestMethod -Uri "http://localhost:8081/api/posts/feed" -Method GET -Headers $bobHeaders -TimeoutSec 10
        Write-Host "✅ Bob's feed loaded successfully - Found $($feedResponse.totalCount) posts" -ForegroundColor Green
        Write-Host "   Posts in Bob's feed:" -ForegroundColor Gray
        for ($i = 0; $i -lt $feedResponse.posts.Count; $i++) {
            $post = $feedResponse.posts[$i]
            Write-Host "   $($i+1). $($post.content.Substring(0, [Math]::Min(60, $post.content.Length)))..." -ForegroundColor Gray
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
Write-Host "The React UI should now show real data instead of mock data!" -ForegroundColor Green
