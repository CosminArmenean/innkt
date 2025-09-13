Write-Host "Creating followers for testuser1..." -ForegroundColor Yellow

$userTokens = Get-Content "test-user-tokens.json" | ConvertFrom-Json
$testuser1Token = $userTokens."testuser1@example.com"
$aliceToken = $userTokens."alice.johnson@example.com"
$bobToken = $userTokens."bob.smith@example.com"

Write-Host "Creating follow relationships..." -ForegroundColor Cyan

# Alice follows testuser1
try {
    $response = Invoke-RestMethod -Uri "http://localhost:8081/api/follows/follow/4f8c8759-dfdc-423e-878e-c68036140114" -Method POST -Headers @{"Authorization" = "Bearer $aliceToken"}
    Write-Host "Alice now follows testuser1" -ForegroundColor Green
} catch {
    Write-Host "Failed to create follow relationship: $($_.Exception.Message)" -ForegroundColor Red
}

# Bob follows testuser1
try {
    $response = Invoke-RestMethod -Uri "http://localhost:8081/api/follows/follow/4f8c8759-dfdc-423e-878e-c68036140114" -Method POST -Headers @{"Authorization" = "Bearer $bobToken"}
    Write-Host "Bob now follows testuser1" -ForegroundColor Green
} catch {
    Write-Host "Failed to create follow relationship: $($_.Exception.Message)" -ForegroundColor Red
}

# testuser1 follows Alice
try {
    $response = Invoke-RestMethod -Uri "http://localhost:8081/api/follows/follow/7d7a5bfe-1936-42d7-b5b2-1bdd5f29a319" -Method POST -Headers @{"Authorization" = "Bearer $testuser1Token"}
    Write-Host "testuser1 now follows Alice" -ForegroundColor Green
} catch {
    Write-Host "Failed to create follow relationship: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "Followers creation complete!" -ForegroundColor Green
