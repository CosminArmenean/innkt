# Topic Settings Testing Script
# This script monitors the backend API calls and database changes

Write-Host "🧪 Starting Topic Settings Testing..." -ForegroundColor Green

# Function to test API endpoint
function Test-ApiEndpoint {
    param($Url, $Method = "GET", $Body = $null)
    
    try {
        if ($Method -eq "GET") {
            $response = Invoke-RestMethod -Uri $Url -Method GET
        } else {
            $response = Invoke-RestMethod -Uri $Url -Method $Method -Body $Body -ContentType "application/json"
        }
        Write-Host "✅ $Method $Url - SUCCESS" -ForegroundColor Green
        return $response
    } catch {
        Write-Host "❌ $Method $Url - FAILED: $($_.Exception.Message)" -ForegroundColor Red
        return $null
    }
}

# Test Groups Service
Write-Host "`n🔍 Testing Groups Service..." -ForegroundColor Yellow
$groups = Test-ApiEndpoint "http://localhost:5002/api/groups"

if ($groups) {
    Write-Host "📊 Found $($groups.Count) groups" -ForegroundColor Cyan
    
    # Test topics for first group
    if ($groups.Count -gt 0) {
        $groupId = $groups[0].id
        Write-Host "🔍 Testing topics for group: $groupId" -ForegroundColor Yellow
        
        # Test main group topics
        $mainTopics = Test-ApiEndpoint "http://localhost:5002/api/groups/$groupId/topics"
        
        # Test subgroups
        $subgroups = Test-ApiEndpoint "http://localhost:5002/api/groups/$groupId/subgroups"
        
        if ($subgroups -and $subgroups.Count -gt 0) {
            $subgroupId = $subgroups[0].id
            Write-Host "🔍 Testing subgroup topics for: $subgroupId" -ForegroundColor Yellow
            $subgroupTopics = Test-ApiEndpoint "http://localhost:5002/api/groups/$groupId/topics?subgroupId=$subgroupId"
            
            # Check for Global Audience topics
            if ($mainTopics) {
                $globalTopics = $mainTopics | Where-Object { $_.isGlobalAudience -eq $true }
                Write-Host "🌍 Found $($globalTopics.Count) Global Audience topics" -ForegroundColor Cyan
                
                if ($globalTopics.Count -gt 0) {
                    Write-Host "✅ Global Audience topics found in main group" -ForegroundColor Green
                } else {
                    Write-Host "⚠️ No Global Audience topics found" -ForegroundColor Yellow
                }
            }
        }
    }
}

# Test Officer Service
Write-Host "`n🔍 Testing Officer Service..." -ForegroundColor Yellow
$officerHealth = Test-ApiEndpoint "http://localhost:5001/api/health"

# Test Social Service  
Write-Host "`n🔍 Testing Social Service..." -ForegroundColor Yellow
$socialHealth = Test-ApiEndpoint "http://localhost:5003/api/health"

Write-Host "`n🎯 Testing Complete!" -ForegroundColor Green
Write-Host "Check the results above to see which services are working." -ForegroundColor Cyan
