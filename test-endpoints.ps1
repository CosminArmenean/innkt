# INNKT Platform - Endpoint Testing Script
# This script tests all service endpoints to verify they're working

Write-Host "Testing INNKT Platform Endpoints" -ForegroundColor Green
Write-Host "=================================" -ForegroundColor Green

# Function to test a service endpoint
function Test-ServiceEndpoint {
    param(
        [string]$ServiceName,
        [string]$Url,
        [int]$ExpectedStatus = 200,
        [string]$Method = "GET"
    )
    
    Write-Host "Testing $ServiceName..." -NoNewline -ForegroundColor Yellow
    
    try {
        $response = Invoke-WebRequest -Uri $Url -Method $Method -TimeoutSec 10 -ErrorAction Stop
        if ($response.StatusCode -eq $ExpectedStatus) {
            Write-Host " OK ($($response.StatusCode))" -ForegroundColor Green
            return $true
        } else {
            Write-Host " Unexpected status: $($response.StatusCode)" -ForegroundColor Red
            return $false
        }
    }
    catch {
        Write-Host " Failed: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# Function to test database connectivity
function Test-DatabaseConnection {
    param(
        [string]$DatabaseName,
        [int]$Port
    )
    
    Write-Host "Testing $DatabaseName connection..." -NoNewline -ForegroundColor Yellow
    
    try {
        $tcpClient = New-Object System.Net.Sockets.TcpClient
        $tcpClient.Connect("localhost", $Port)
        $tcpClient.Close()
        Write-Host " OK" -ForegroundColor Green
        return $true
    }
    catch {
        Write-Host " Failed: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

Write-Host "`nTesting Infrastructure Components..." -ForegroundColor Cyan

# Test infrastructure
$infrastructureTests = @(
    @{ Name = "PostgreSQL Database"; Port = 5432 },
    @{ Name = "MongoDB Database"; Port = 27017 },
    @{ Name = "Redis Cache"; Port = 6379 },
    @{ Name = "Kafka Message Broker"; Port = 9092 }
)

$infrastructurePassed = 0
foreach ($test in $infrastructureTests) {
    if (Test-DatabaseConnection -DatabaseName $test.Name -Port $test.Port) {
        $infrastructurePassed++
    }
}

Write-Host "`nTesting Backend Services..." -ForegroundColor Cyan

# Test backend services
$serviceTests = @(
    @{ Name = "Officer Service (Identity)"; Url = "http://localhost:8080/health"; ExpectedStatus = 200 },
    @{ Name = "Social Service (Posts/Groups)"; Url = "http://localhost:8081/health"; ExpectedStatus = 200 },
    @{ Name = "NeuroSpark Service (AI)"; Url = "http://localhost:5003/health"; ExpectedStatus = 200 },
    @{ Name = "Messaging Service (Chat)"; Url = "http://localhost:3000/health"; ExpectedStatus = 200 },
    @{ Name = "Seer Service (Video Calls)"; Url = "http://localhost:5267/health"; ExpectedStatus = 200 },
    @{ Name = "Frontier Service (API Gateway)"; Url = "http://localhost:51303/health"; ExpectedStatus = 200 }
)

$servicesPassed = 0
foreach ($test in $serviceTests) {
    if (Test-ServiceEndpoint -ServiceName $test.Name -Url $test.Url -ExpectedStatus $test.ExpectedStatus) {
        $servicesPassed++
    }
}

Write-Host "`nTesting Frontend..." -ForegroundColor Cyan

# Test frontend
$frontendPassed = 0
if (Test-ServiceEndpoint -ServiceName "React UI" -Url "http://localhost:3001" -ExpectedStatus 200) {
    $frontendPassed = 1
}

Write-Host "`nTesting API Endpoints..." -ForegroundColor Cyan

# Test specific API endpoints
$apiTests = @(
    @{ Name = "Officer - Health Check"; Url = "http://localhost:8080/health" },
    @{ Name = "Officer - API Info"; Url = "http://localhost:8080/api" },
    @{ Name = "Social - Health Check"; Url = "http://localhost:8081/health" },
    @{ Name = "Social - API Info"; Url = "http://localhost:8081/api" },
    @{ Name = "NeuroSpark - Health Check"; Url = "http://localhost:5003/health" },
    @{ Name = "NeuroSpark - API Info"; Url = "http://localhost:5003/api" },
    @{ Name = "Messaging - Health Check"; Url = "http://localhost:3000/health" },
    @{ Name = "Seer - Health Check"; Url = "http://localhost:5267/health" },
    @{ Name = "Frontier - Health Check"; Url = "http://localhost:51303/health" },
    @{ Name = "Frontier - API Info"; Url = "http://localhost:51303/api" }
)

$apiPassed = 0
foreach ($test in $apiTests) {
    if (Test-ServiceEndpoint -ServiceName $test.Name -Url $test.Url) {
        $apiPassed++
    }
}

Write-Host "`nTest Results Summary:" -ForegroundColor Cyan
Write-Host "=====================" -ForegroundColor Cyan
Write-Host "Infrastructure: $infrastructurePassed/4 passed" -ForegroundColor $(if ($infrastructurePassed -eq 4) { "Green" } else { "Red" })
Write-Host "Backend Services: $servicesPassed/6 passed" -ForegroundColor $(if ($servicesPassed -eq 6) { "Green" } else { "Red" })
Write-Host "Frontend: $frontendPassed/1 passed" -ForegroundColor $(if ($frontendPassed -eq 1) { "Green" } else { "Red" })
Write-Host "API Endpoints: $apiPassed/10 passed" -ForegroundColor $(if ($apiPassed -eq 10) { "Green" } else { "Red" })

$totalPassed = $infrastructurePassed + $servicesPassed + $frontendPassed + $apiPassed
$totalTests = 4 + 6 + 1 + 10

Write-Host "`nOverall: $totalPassed/$totalTests tests passed" -ForegroundColor $(if ($totalPassed -eq $totalTests) { "Green" } else { "Red" })

if ($totalPassed -eq $totalTests) {
    Write-Host "`nAll tests passed! INNKT Platform is fully operational!" -ForegroundColor Green
} else {
    Write-Host "`nSome tests failed. Check the individual service windows for error messages." -ForegroundColor Yellow
}

Write-Host "`nAvailable Endpoints:" -ForegroundColor Cyan
Write-Host "• React UI:                       http://localhost:3001" -ForegroundColor White
Write-Host "• API Gateway:                    http://localhost:51303" -ForegroundColor White
Write-Host "• Officer Service:                http://localhost:8080" -ForegroundColor White
Write-Host "• Social Service:                 http://localhost:8081" -ForegroundColor White
Write-Host "• NeuroSpark Service:             http://localhost:5003" -ForegroundColor White
Write-Host "• Messaging Service:              http://localhost:3000" -ForegroundColor White
Write-Host "• Seer Service:                   http://localhost:5267" -ForegroundColor White
Write-Host "• Kafka UI (Monitoring):          http://localhost:8080" -ForegroundColor White

Write-Host "`nPress any key to continue..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
