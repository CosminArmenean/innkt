# Test script to check comments in database
$postId = "8b5ba9de-0032-4f60-83ca-af85ceda018e"

Write-Host "Testing comment API for post: $postId"

# Test the comment API directly
try {
    $response = Invoke-RestMethod -Uri "http://localhost:8081/api/comments/post/$postId" -Method GET
    Write-Host "API Response:"
    $response | ConvertTo-Json -Depth 3
} catch {
    Write-Host "API Error: $($_.Exception.Message)"
}

# Test with a different post ID that might have comments
Write-Host "`nTesting with a different post ID..."
try {
    $response2 = Invoke-RestMethod -Uri "http://localhost:8081/api/comments/post/00000000-0000-0000-0000-000000000001" -Method GET
    Write-Host "API Response for test post:"
    $response2 | ConvertTo-Json -Depth 3
} catch {
    Write-Host "API Error for test post: $($_.Exception.Message)"
}
