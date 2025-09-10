# PowerShell script to run tests for innkt.Officer
param(
    [string]$TestCategory = "All",
    [string]$OutputFormat = "trx",
    [string]$LogLevel = "normal",
    [switch]$Coverage = $false,
    [switch]$Verbose = $false
)

Write-Host "🧪 Running innkt.Officer Tests" -ForegroundColor Green
Write-Host "=================================" -ForegroundColor Green

# Set test parameters
$testParams = @(
    "test"
    "--configuration", "Debug"
    "--logger", "trx;LogFileName=TestResults.trx"
    "--collect", "XPlat Code Coverage"
)

if ($Verbose) {
    $testParams += "--verbosity", "detailed"
}

if ($TestCategory -ne "All") {
    $testParams += "--filter", "Category=$TestCategory"
}

if ($Coverage) {
    $testParams += "--collect", "XPlat Code Coverage"
}

# Run the tests
Write-Host "📋 Test Parameters:" -ForegroundColor Yellow
Write-Host "  Category: $TestCategory" -ForegroundColor White
Write-Host "  Output Format: $OutputFormat" -ForegroundColor White
Write-Host "  Log Level: $LogLevel" -ForegroundColor White
Write-Host "  Coverage: $Coverage" -ForegroundColor White
Write-Host "  Verbose: $Verbose" -ForegroundColor White
Write-Host ""

try {
    Write-Host "🚀 Starting test execution..." -ForegroundColor Cyan
    & dotnet $testParams
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ All tests passed!" -ForegroundColor Green
        
        if ($Coverage) {
            Write-Host "📊 Coverage report generated in TestResults/coverage.cobertura.xml" -ForegroundColor Yellow
        }
        
        Write-Host "📄 Test results saved to TestResults/TestResults.trx" -ForegroundColor Yellow
    } else {
        Write-Host "❌ Some tests failed!" -ForegroundColor Red
        exit $LASTEXITCODE
    }
} catch {
    Write-Host "💥 Error running tests: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🎉 Test execution completed!" -ForegroundColor Green
