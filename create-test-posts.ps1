Write-Host "Creating test posts and follow relationships..." -ForegroundColor Yellow

# Load user tokens
$userTokens = Get-Content "test-user-tokens.json" | ConvertFrom-Json

$testuser1Token = $userTokens."testuser1@example.com"
$aliceToken = $userTokens."alice.johnson@example.com"
$bobToken = $userTokens."bob.smith@example.com"

Write-Host "Creating posts..." -ForegroundColor Cyan

# Test posts
$posts = @(
    @{
        token = $testuser1Token
        content = "Hello everyone! This is my first post on innkt! 🚀"
        author = "testuser1@example.com"
    },
    @{
        token = $aliceToken
        content = "Just joined innkt! Excited to connect with everyone! 👋"
        author = "alice.johnson@example.com"
    },
    @{
        token = $bobToken
        content = "Building amazing things with the innkt platform! 💻"
        author = "bob.smith@example.com"
    },
    @{
        token = $testuser1Token
        content = "Working on some cool features for our social platform! #development #innkt"
        author = "testuser1@example.com"
    },
    @{
        token = $aliceToken
        content = "Love the clean UI design! Great work team! 🎨"
        author = "alice.johnson@example.com"
    }
)

foreach ($post in $posts) {
    try {
        $response = Invoke-RestMethod -Uri "http://localhost:8081/api/posts" -Method POST -ContentType "application/json" -Headers @{"Authorization" = "Bearer $($post.token)"} -Body (@{
            Content = $post.content
            Visibility = "Public"
            Type = "Text"
        } | ConvertTo-Json)
        
        Write-Host "✓ Post created by $($post.author)" -ForegroundColor Green
    } catch {
        Write-Host "✗ Failed to create post by $($post.author): $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host "Creating follow relationships..." -ForegroundColor Cyan

# Create follow relationships
$follows = @(
    @{ follower = $testuser1Token; following = "alice.johnson@example.com" },
    @{ follower = $testuser1Token; following = "bob.smith@example.com" },
    @{ follower = $aliceToken; following = "testuser1@example.com" },
    @{ follower = $bobToken; following = "testuser1@example.com" }
)

foreach ($follow in $follows) {
    try {
        $response = Invoke-RestMethod -Uri "http://localhost:8081/api/follows/follow/$($follow.following)" -Method POST -Headers @{"Authorization" = "Bearer $($follow.follower)"}
        Write-Host "✓ Follow relationship created" -ForegroundColor Green
    } catch {
        Write-Host "✗ Failed to create follow relationship: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host "Posts and follows creation complete!" -ForegroundColor Green
