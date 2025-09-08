# PowerShell script to run all tests for the innkt platform
param(
    [string]$TestCategory = "All",
    [switch]$Coverage = $false,
    [switch]$Verbose = $false,
    [switch]$Parallel = $false,
    [switch]$SkipFrontend = $false,
    [switch]$SkipBackend = $false,
    [switch]$SkipMessaging = $false,
    [switch]$SkipNeuroSpark = $false,
    [switch]$SkipSeer = $false
)

Write-Host "🧪 Running All innkt Platform Tests" -ForegroundColor Green
Write-Host "====================================" -ForegroundColor Green

$testResults = @()
$overallSuccess = $true

# Function to run tests for a service
function Run-ServiceTests {
    param(
        [string]$ServiceName,
        [string]$ServicePath,
        [string]$TestCommand,
        [string]$TestArgs = ""
    )
    
    Write-Host "`n🔍 Testing $ServiceName..." -ForegroundColor Cyan
    Write-Host "Path: $ServicePath" -ForegroundColor Gray
    Write-Host "Command: $TestCommand $TestArgs" -ForegroundColor Gray
    
    try {
        Push-Location $ServicePath
        
        if ($TestCommand -eq "dotnet") {
            $testArgs = "test --configuration Debug --logger trx;LogFileName=TestResults.trx"
            if ($Coverage) {
                $testArgs += " --collect `"XPlat Code Coverage`""
            }
            if ($Verbose) {
                $testArgs += " --verbosity detailed"
            }
        } elseif ($TestCommand -eq "npm") {
            $testArgs = "test"
            if ($Coverage) {
                $testArgs += " -- --coverage"
            }
            if ($Verbose) {
                $testArgs += " -- --verbose"
            }
        }
        
        $result = Invoke-Expression "$TestCommand $testArgs"
        $exitCode = $LASTEXITCODE
        
        if ($exitCode -eq 0) {
            Write-Host "✅ $ServiceName tests passed!" -ForegroundColor Green
            $testResults += @{
                Service = $ServiceName
                Status = "PASSED"
                ExitCode = $exitCode
            }
        } else {
            Write-Host "❌ $ServiceName tests failed!" -ForegroundColor Red
            $testResults += @{
                Service = $ServiceName
                Status = "FAILED"
                ExitCode = $exitCode
            }
            $script:overallSuccess = $false
        }
        
    } catch {
        Write-Host "💥 Error running $ServiceName tests: $($_.Exception.Message)" -ForegroundColor Red
        $testResults += @{
            Service = $ServiceName
            Status = "ERROR"
            ExitCode = 1
        }
        $script:overallSuccess = $false
    } finally {
        Pop-Location
    }
}

# Function to run tests in parallel
function Run-ParallelTests {
    param(
        [array]$TestJobs
    )
    
    $jobs = @()
    
    foreach ($job in $TestJobs) {
        $jobScript = {
            param($ServiceName, $ServicePath, $TestCommand, $TestArgs)
            
            try {
                Push-Location $ServicePath
                $result = Invoke-Expression "$TestCommand $TestArgs"
                $exitCode = $LASTEXITCODE
                
                return @{
                    Service = $ServiceName
                    Status = if ($exitCode -eq 0) { "PASSED" } else { "FAILED" }
                    ExitCode = $exitCode
                }
            } catch {
                return @{
                    Service = $ServiceName
                    Status = "ERROR"
                    ExitCode = 1
                }
            } finally {
                Pop-Location
            }
        }
        
        $jobs += Start-Job -ScriptBlock $jobScript -ArgumentList $job.ServiceName, $job.ServicePath, $job.TestCommand, $job.TestArgs
    }
    
    # Wait for all jobs to complete
    $jobs | Wait-Job | Out-Null
    
    # Collect results
    foreach ($job in $jobs) {
        $result = Receive-Job -Job $job
        $testResults += $result
        
        if ($result.Status -ne "PASSED") {
            $script:overallSuccess = $false
        }
        
        Remove-Job -Job $job
    }
}

# Define test jobs
$testJobs = @()

if (-not $SkipBackend) {
    $testJobs += @{
        ServiceName = "Officer (.NET)"
        ServicePath = "Backend/innkt.Officer/Tests"
        TestCommand = "dotnet"
        TestArgs = "test"
    }
}

if (-not $SkipNeuroSpark) {
    $testJobs += @{
        ServiceName = "NeuroSpark (.NET)"
        ServicePath = "Backend/innkt.NeuroSpark/innkt.NeuroSpark"
        TestCommand = "dotnet"
        TestArgs = "test"
    }
}

if (-not $SkipSeer) {
    $testJobs += @{
        ServiceName = "Seer (.NET)"
        ServicePath = "Backend/innkt.Seer"
        TestCommand = "dotnet"
        TestArgs = "test"
    }
}

if (-not $SkipMessaging) {
    $testJobs += @{
        ServiceName = "Messaging (Node.js)"
        ServicePath = "Backend/innkt.Messaging"
        TestCommand = "npm"
        TestArgs = "test"
    }
}

if (-not $SkipFrontend) {
    $testJobs += @{
        ServiceName = "React Frontend"
        ServicePath = "Frontend/innkt.react"
        TestCommand = "npm"
        TestArgs = "test"
    }
}

# Run tests
if ($Parallel -and $testJobs.Count -gt 1) {
    Write-Host "🚀 Running tests in parallel..." -ForegroundColor Yellow
    Run-ParallelTests -TestJobs $testJobs
} else {
    Write-Host "🚀 Running tests sequentially..." -ForegroundColor Yellow
    foreach ($job in $testJobs) {
        Run-ServiceTests -ServiceName $job.ServiceName -ServicePath $job.ServicePath -TestCommand $job.TestCommand -TestArgs $job.TestArgs
    }
}

# Display results summary
Write-Host "`n📊 Test Results Summary" -ForegroundColor Yellow
Write-Host "======================" -ForegroundColor Yellow

foreach ($result in $testResults) {
    $statusColor = switch ($result.Status) {
        "PASSED" { "Green" }
        "FAILED" { "Red" }
        "ERROR" { "Red" }
        default { "Yellow" }
    }
    
    Write-Host "$($result.Service): " -NoNewline
    Write-Host $result.Status -ForegroundColor $statusColor
}

# Overall result
Write-Host "`n🎯 Overall Result: " -NoNewline
if ($overallSuccess) {
    Write-Host "ALL TESTS PASSED! 🎉" -ForegroundColor Green
} else {
    Write-Host "SOME TESTS FAILED! ❌" -ForegroundColor Red
}

# Coverage information
if ($Coverage) {
    Write-Host "`n📈 Coverage Reports Generated:" -ForegroundColor Yellow
    Write-Host "  - Officer: Backend/innkt.Officer/Tests/TestResults/coverage.cobertura.xml" -ForegroundColor White
    Write-Host "  - NeuroSpark: Backend/innkt.NeuroSpark/TestResults/coverage.cobertura.xml" -ForegroundColor White
    Write-Host "  - Seer: Backend/innkt.Seer/TestResults/coverage.cobertura.xml" -ForegroundColor White
    Write-Host "  - Messaging: Backend/innkt.Messaging/coverage/lcov-report/index.html" -ForegroundColor White
    Write-Host "  - Frontend: Frontend/innkt.react/coverage/lcov-report/index.html" -ForegroundColor White
}

# Test artifacts
Write-Host "`n📄 Test Artifacts:" -ForegroundColor Yellow
Write-Host "  - Test Results: */TestResults/TestResults.trx" -ForegroundColor White
Write-Host "  - Coverage Reports: */coverage/" -ForegroundColor White
Write-Host "  - Logs: */logs/" -ForegroundColor White

# Exit with appropriate code
if ($overallSuccess) {
    Write-Host "`n🎉 All tests completed successfully!" -ForegroundColor Green
    exit 0
} else {
    Write-Host "`n💥 Some tests failed. Please check the output above." -ForegroundColor Red
    exit 1
}
